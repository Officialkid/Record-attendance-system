import 'server-only';

import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import {
  addDays,
  addHours,
  differenceInCalendarDays,
  endOfMonth,
  endOfQuarter,
  endOfYear,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  subDays,
} from 'date-fns';

import { getDb, type SqlValue } from './db';
import {
  extractMeetingMinutesWithGroq,
  generateExecutiveSummaryWithGroq,
} from './groq';
import {
  deleteGoogleCalendarEvent,
  isGoogleCalendarSyncConfigured,
  upsertGoogleCalendarEvent,
} from './google-calendar';
import {
  sendAdminAddedUserInviteNotification,
  sendDepartmentAccessRequestNotification,
  sendDepartmentMembershipDecisionNotification,
  sendMeetingReminderNotification,
} from './notifications';
import { deleteAttachmentObject } from './r2';
import {
  createDepartmentSchema,
  createDepartmentInviteSchema,
  departmentAccessRequestSchema,
  departmentMembershipDecisionSchema,
  generateDepartmentReportSchema,
  acceptDepartmentInviteSchema,
  acceptDepartmentInviteWithSignupSchema,
  createFieldDefinitionSchema,
  createMeetingSchema,
  publicSignupSchema,
  createRecordSchema,
  createUserSchema,
  processMeetingMinutesSchema,
  updateOwnProfileSchema,
  updateMeetingSchema,
  updateRecordSchema,
} from './validation';
import {
  AcceptDepartmentInviteInput,
  AcceptDepartmentInviteWithSignupInput,
  Department,
  DepartmentInvite,
  DepartmentMembershipRole,
  DepartmentFieldDefinition,
  DepartmentRecord,
  DepartmentRecordDetail,
  CalendarConnection,
  DashboardSummary,
  InsightsPayload,
  MeetingMinutesSuggestion,
  MeetingSummary,
  UserNotification,
  UserRecord,
  CreateDepartmentInput,
  CreateDepartmentInviteInput,
  GenerateDepartmentReportInput,
  GeneratedReport,
  GeneratedReportSnapshot,
  DepartmentAccessRequestInput,
  DepartmentMembershipDecisionInput,
  DepartmentMembership,
  CreateFieldDefinitionInput,
  CreateMeetingInput,
  CreateRecordInput,
  CreateRecordResult,
  PublicUserAccessRequestInput,
  CreateUserInput,
  DepartmentMembershipInput,
  GlobalRole,
  MembershipReviewItem,
  RecordVisitor,
  SystemRole,
  UpdateMeetingInput,
  UpdateOwnProfileInput,
  UpdateRecordInput,
} from './types';
import { fromSqliteBoolean, isIsoDateString, normalizeSlug, parseJsonValue } from './utils';

type SessionLikeUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: GlobalRole;
  systemRole?: SystemRole;
  departmentIds: number[];
  departmentRoles?: Record<number, DepartmentMembershipRole>;
};

function deriveUiRole(systemRole: SystemRole, departmentRoles: Record<number, DepartmentMembershipRole>): GlobalRole {
  if (systemRole === 'main_admin' || systemRole === 'chief_admin') {
    return 'admin';
  }

  if (Object.values(departmentRoles).some((role) => role === 'department_admin')) {
    return 'leader';
  }

  return 'member';
}

async function allRows<T>(sql: string, ...params: SqlValue[]) {
  const db = await getDb();
  return (await db.prepare(sql).all(...params)) as T[];
}

async function firstRow<T>(sql: string, ...params: SqlValue[]) {
  const db = await getDb();
  return (await db.prepare(sql).get(...params)) as T | undefined;
}

async function runStatement(sql: string, ...params: SqlValue[]) {
  const db = await getDb();
  return db.prepare(sql).run(...params);
}

async function getDepartmentById(departmentId: number) {
  return firstRow<{ id: number; name: string; slug: string; description: string | null; created_at: string }>(
    'SELECT id, name, slug, description, created_at FROM departments WHERE id = ?',
    departmentId
  );
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashInviteToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function generateInviteToken() {
  return randomBytes(24).toString('base64url');
}

function getBaseUrl() {
  return (
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    'http://localhost:3003'
  ).replace(/\/$/, '');
}

function buildInviteUrl(token: string) {
  return `${getBaseUrl()}/invite/${token}`;
}

function buildDepartmentLandingUrl(departmentId: number) {
  return `/records/new?departmentId=${departmentId}&invite=claimed`;
}

async function getApprovalRecipientsForDepartment(departmentId: number) {
  return allRows<{ email: string; name: string | null }>(
    `SELECT DISTINCT users.email, users.name
     FROM users
     LEFT JOIN department_memberships
       ON department_memberships.user_id = users.id
      AND department_memberships.department_id = ?
      AND department_memberships.status = 'approved'
      AND department_memberships.role = 'department_admin'
     WHERE users.system_role IN ('main_admin', 'chief_admin')
        OR department_memberships.id IS NOT NULL`,
    departmentId
  );
}

function mapDepartment(row: {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}): Department {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    createdAt: row.created_at,
  };
}

function mapFieldDefinition(row: {
  id: number;
  department_id: number;
  field_key: string;
  label: string;
  field_type: DepartmentFieldDefinition['fieldType'];
  display_order: number;
  is_required: number;
  created_at: string;
}): DepartmentFieldDefinition {
  return {
    id: row.id,
    departmentId: row.department_id,
    fieldKey: row.field_key,
    label: row.label,
    fieldType: row.field_type,
    displayOrder: row.display_order,
    isRequired: fromSqliteBoolean(row.is_required),
    createdAt: row.created_at,
  };
}

function mapDepartmentMembership(row: {
  id: number;
  department_id: number;
  user_id: number;
  role: DepartmentMembershipRole;
  status: 'pending' | 'approved' | 'rejected';
  added_directly: number;
  requested_at: string | null;
  decided_at: string | null;
  decided_by_user_id: number | null;
}): DepartmentMembership {
  return {
    id: row.id,
    departmentId: row.department_id,
    userId: row.user_id,
    role: row.role,
    status: row.status,
    addedDirectly: fromSqliteBoolean(row.added_directly),
    requestedAt: row.requested_at,
    decidedAt: row.decided_at,
    decidedByUserId: row.decided_by_user_id,
  };
}

function mapDepartmentInvite(row: {
  id: number;
  department_id: number;
  department_name: string;
  role: DepartmentMembershipRole;
  note: string | null;
  expires_at: string;
  used_at: string | null;
  used_by_user_id: number | null;
  used_by_name: string | null;
  created_at: string;
  created_by_user_id: number | null;
  created_by_name: string | null;
}): DepartmentInvite {
  return {
    id: row.id,
    departmentId: row.department_id,
    departmentName: row.department_name,
    role: row.role,
    inviteUrl: null,
    note: row.note,
    expiresAt: row.expires_at,
    usedAt: row.used_at,
    usedByUserId: row.used_by_user_id,
    usedByName: row.used_by_name,
    createdAt: row.created_at,
    createdByUserId: row.created_by_user_id,
    createdByName: row.created_by_name,
  };
}

async function mapUser(row: {
  id: number;
  name: string;
  email: string;
  role: GlobalRole;
  system_role?: SystemRole;
  status?: 'pending' | 'approved' | 'rejected' | 'active';
  avatar_url?: string | null;
  must_change_password: number;
  created_at: string;
  updated_at: string;
}): Promise<UserRecord> {
  const memberships = await allRows<{ department_id: number; role: DepartmentMembershipRole }>(
    `SELECT department_id, role
     FROM department_memberships
     WHERE user_id = ? AND status = 'approved'
     ORDER BY department_id ASC`,
    row.id
  );

  const departmentIds = memberships.map((membership) => membership.department_id);
  const departmentRoles = Object.fromEntries(
    memberships.map((membership) => [membership.department_id, membership.role])
  ) as Record<number, DepartmentMembershipRole>;
  const systemRole = row.system_role || 'none';

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: deriveUiRole(systemRole, departmentRoles),
    systemRole,
    status: row.status || (departmentIds.length > 0 ? 'active' : 'pending'),
    departmentIds,
    departmentRoles,
    avatarUrl: row.avatar_url || null,
    mustChangePassword: fromSqliteBoolean(row.must_change_password),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRecord(row: {
  id: number;
  department_id: number;
  department_name: string;
  record_date: string;
  handled_by_user_id: number;
  handled_by_name: string;
  values_json: string;
  visitor_count: number;
  created_at: string;
  updated_at: string;
}): DepartmentRecord {
  return {
    id: row.id,
    departmentId: row.department_id,
    departmentName: row.department_name,
    recordDate: row.record_date,
    handledByUserId: row.handled_by_user_id,
    handledByName: row.handled_by_name,
    values: parseJsonValue<Record<string, unknown>>(row.values_json, {}),
    visitorCount: row.visitor_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function listVisitorsForRecord(recordId: number): Promise<RecordVisitor[]> {
  return allRows<RecordVisitor>(
    `SELECT id, name, contact
     FROM record_visitors
     WHERE record_id = ?
     ORDER BY id ASC`,
    recordId
  );
}

function buildRecordValues(
  fieldDefs: DepartmentFieldDefinition[],
  rawValues: Record<string, unknown>
) {
  const values: Record<string, unknown> = {};

  for (const field of fieldDefs) {
    const rawValue = rawValues[field.fieldKey];
    if (field.fieldType === 'number' || field.fieldType === 'currency') {
      if (rawValue === '' || rawValue === null || rawValue === undefined) {
        if (field.isRequired) {
          throw new Error(`${field.label} is required.`);
        }

        values[field.fieldKey] = 0;
        continue;
      }

      const numericValue = Number(rawValue);
      if (!Number.isFinite(numericValue)) {
        throw new Error(`${field.label} must be a valid number.`);
      }

      values[field.fieldKey] = numericValue;
    } else if (field.fieldType === 'list') {
      const listValue = Array.isArray(rawValue)
        ? rawValue.map((item) => String(item).trim()).filter(Boolean)
        : typeof rawValue === 'string'
          ? rawValue
              .split(/\r?\n|,/)
              .map((item) => item.trim())
              .filter(Boolean)
          : [];

      if (field.isRequired && listValue.length === 0) {
        throw new Error(`${field.label} is required.`);
      }

      values[field.fieldKey] = listValue;
    } else if (field.fieldType === 'date') {
      if (rawValue === '' || rawValue === null || rawValue === undefined) {
        if (field.isRequired) {
          throw new Error(`${field.label} is required.`);
        }

        values[field.fieldKey] = '';
        continue;
      }

      const dateValue = String(rawValue).trim();
      if (!isIsoDateString(dateValue)) {
        throw new Error(`${field.label} must be a valid date.`);
      }

      values[field.fieldKey] = dateValue;
    } else {
      const textValue = rawValue == null ? '' : String(rawValue).trim();
      if (field.isRequired && textValue === '') {
        throw new Error(`${field.label} is required.`);
      }

      values[field.fieldKey] = textValue;
    }
  }

  return values;
}

function buildWhatsappSummary(recordDate: string, values: Record<string, unknown>, visitorCount: number) {
  return [
    `Date: ${recordDate}`,
    `Tithe: ${values.tithe ?? 0}`,
    `Offering: ${values.offering ?? 0}`,
    `Expenses: ${values.expenses ?? 0}`,
    `N.o of visitors: ${visitorCount}`,
    `Headcount: ${values.headcount ?? 0}`,
  ].join('\n');
}

async function assertHandledByMembership(departmentId: number, handledByUserId: number) {
  const membership = await firstRow<{ 1: number }>(
    `SELECT 1
     FROM department_memberships
     WHERE department_id = ? AND user_id = ? AND status = 'approved'`,
    departmentId,
    handledByUserId
  );

  if (!membership) {
    throw new Error('Handled-by user must belong to the selected department.');
  }
}

async function writeRecordMetrics(
  recordId: number,
  fieldDefs: DepartmentFieldDefinition[],
  values: Record<string, unknown>
) {
  await runStatement('DELETE FROM record_metrics WHERE record_id = ?', recordId);

  for (const field of fieldDefs) {
    if (field.fieldType === 'number' || field.fieldType === 'currency') {
      await runStatement(
        `INSERT INTO record_metrics (record_id, field_key, numeric_value)
         VALUES (?, ?, ?)`,
        recordId,
        field.fieldKey,
        Number(values[field.fieldKey] || 0)
      );
    }
  }
}

async function mapMeetingRows(): Promise<MeetingSummary[]> {
  const meetings = await allRows<{
    id: number;
    department_id: number | null;
    department_name: string | null;
    title: string;
    meeting_date: string;
    agenda: string | null;
    decisions: string | null;
    ai_summary: string | null;
    source_document_r2_key: string | null;
    next_meeting_date: string | null;
    created_by_user_id: number;
    created_by_name: string;
    created_at: string;
  }>(
    `SELECT
      meetings.id,
      meetings.department_id,
      departments.name AS department_name,
      meetings.title,
      meetings.meeting_date,
      meetings.agenda,
      meetings.decisions,
      meetings.ai_summary,
      meetings.source_document_r2_key,
      meetings.next_meeting_date,
      meetings.created_by_user_id,
      users.name AS created_by_name,
      meetings.created_at
    FROM meetings
    LEFT JOIN departments ON departments.id = meetings.department_id
    INNER JOIN users ON users.id = meetings.created_by_user_id
    ORDER BY meetings.meeting_date DESC, meetings.id DESC`
  );

  return Promise.all(
    meetings.map(async (meeting) => {
      const attendees = await allRows<{ id: number; name: string }>(
        `SELECT users.id, users.name
         FROM meeting_attendees
         INNER JOIN users ON users.id = meeting_attendees.user_id
         WHERE meeting_attendees.meeting_id = ?
         ORDER BY users.name ASC`,
        meeting.id
      );

      const actionItems = await allRows<{
        id: number;
        meeting_id: number;
        description: string;
        owner_user_id: number | null;
        owner_name: string | null;
        status: 'open' | 'done';
        due_date: string | null;
      }>(
        `SELECT
          meeting_action_items.id,
          meeting_action_items.meeting_id,
          meeting_action_items.description,
          meeting_action_items.owner_user_id,
          users.name AS owner_name,
          meeting_action_items.status,
          meeting_action_items.due_date
         FROM meeting_action_items
         LEFT JOIN users ON users.id = meeting_action_items.owner_user_id
         WHERE meeting_action_items.meeting_id = ?
         ORDER BY meeting_action_items.id DESC`,
        meeting.id
      );

      const attachments = await allRows<{
        id: number;
        meeting_id: number | null;
        record_id: number | null;
        r2_key: string;
        filename: string;
        uploaded_by_user_id: number | null;
        uploaded_at: string;
      }>(
        `SELECT id, meeting_id, record_id, r2_key, filename, uploaded_by_user_id, uploaded_at
         FROM attachments
         WHERE meeting_id = ?
         ORDER BY uploaded_at DESC`,
        meeting.id
      );

      return {
        id: meeting.id,
        departmentId: meeting.department_id,
        departmentName: meeting.department_name,
        title: meeting.title,
        meetingDate: meeting.meeting_date,
        agenda: meeting.agenda,
        decisions: meeting.decisions,
        aiSummary: meeting.ai_summary,
        sourceDocumentR2Key: meeting.source_document_r2_key,
        nextMeetingDate: meeting.next_meeting_date,
        createdByUserId: meeting.created_by_user_id,
        createdByName: meeting.created_by_name,
        createdAt: meeting.created_at,
        attendees,
        actionItems: actionItems.map((item) => ({
          id: item.id,
          meetingId: item.meeting_id,
          description: item.description,
          ownerUserId: item.owner_user_id,
          ownerName: item.owner_name,
          status: item.status,
          dueDate: item.due_date,
        })),
        attachments: attachments.map((attachment) => ({
          id: attachment.id,
          meetingId: attachment.meeting_id,
          recordId: attachment.record_id,
          r2Key: attachment.r2_key,
          filename: attachment.filename,
          uploadedByUserId: attachment.uploaded_by_user_id,
          uploadedAt: attachment.uploaded_at,
        })),
      };
    })
  );
}

async function writeAuditLog(
  userId: number | null,
  action: string,
  entityType: string,
  entityId: number,
  details: Record<string, unknown>
) {
  await runStatement(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details_json)
     VALUES (?, ?, ?, ?, ?)`,
    userId,
    action,
    entityType,
    entityId,
    JSON.stringify(details)
  );
}

export function assertAuthenticated(user: SessionLikeUser | null | undefined): asserts user is SessionLikeUser {
  if (!user?.id) {
    throw new Error('You must be signed in to continue.');
  }
}

export function assertAdmin(user: SessionLikeUser | null | undefined) {
  assertAuthenticated(user);

  if (user.systemRole !== 'main_admin' && user.systemRole !== 'chief_admin' && user.role !== 'admin') {
    throw new Error('Only admins can perform this action.');
  }
}

export function assertDepartmentAccess(user: SessionLikeUser | null | undefined, departmentId: number) {
  assertAuthenticated(user);

  if (user.systemRole === 'main_admin' || user.systemRole === 'chief_admin' || user.role === 'admin') {
    return;
  }

  if (!user.departmentIds.includes(departmentId)) {
    throw new Error('You do not have access to this department.');
  }
}

function assertDepartmentAdminAccess(user: SessionLikeUser | null | undefined, departmentId: number) {
  assertAuthenticated(user);

  if (user.systemRole === 'main_admin' || user.systemRole === 'chief_admin' || user.role === 'admin') {
    return;
  }

  if (user.departmentRoles?.[departmentId] === 'department_admin') {
    return;
  }

  throw new Error('You do not have department admin access.');
}

function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function resolveReportRange(
  periodType: GenerateDepartmentReportInput['periodType'],
  start?: string,
  end?: string
) {
  const now = new Date();

  if (periodType === 'custom') {
    return {
      start: start!,
      end: end!,
    };
  }

  if (periodType === 'monthly') {
    return {
      start: toIsoDate(startOfMonth(now)),
      end: toIsoDate(endOfMonth(now)),
    };
  }

  if (periodType === 'quarterly') {
    return {
      start: toIsoDate(startOfQuarter(now)),
      end: toIsoDate(endOfQuarter(now)),
    };
  }

  return {
    start: toIsoDate(startOfYear(now)),
    end: toIsoDate(endOfYear(now)),
  };
}

function resolvePreviousReportRange(start: string, end: string) {
  const startDate = new Date(`${start}T00:00:00.000Z`);
  const endDate = new Date(`${end}T00:00:00.000Z`);
  const daySpan = Math.max(1, differenceInCalendarDays(endDate, startDate) + 1);
  const previousEnd = subDays(startDate, 1);
  const previousStart = addDays(previousEnd, -(daySpan - 1));

  return {
    start: toIsoDate(previousStart),
    end: toIsoDate(previousEnd),
  };
}

function getMeetingReminderHours() {
  const parsed = Number(process.env.CAP_MEETING_REMINDER_HOURS || '24');
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 24;
}

function getAppBaseUrl() {
  return (process.env.NEXTAUTH_URL || 'http://localhost:3003').replace(/\/$/, '');
}

export async function listDepartmentsForUser(user: SessionLikeUser) {
  const rows =
    user.systemRole === 'main_admin' || user.systemRole === 'chief_admin' || user.role === 'admin'
      ? await allRows<{
          id: number;
          name: string;
          slug: string;
          description: string | null;
          created_at: string;
        }>('SELECT id, name, slug, description, created_at FROM departments ORDER BY name ASC')
      : await allRows<{
          id: number;
          name: string;
          slug: string;
          description: string | null;
          created_at: string;
        }>(
          `SELECT departments.id, departments.name, departments.slug, departments.description, departments.created_at
           FROM departments
           INNER JOIN department_memberships ON department_memberships.department_id = departments.id
           WHERE department_memberships.user_id = ?
             AND department_memberships.status = 'approved'
           ORDER BY departments.name ASC`,
          Number(user.id)
        );

  return rows.map(mapDepartment);
}

export async function listAllDepartments() {
  const rows = await allRows<{
    id: number;
    name: string;
    slug: string;
    description: string | null;
    created_at: string;
  }>('SELECT id, name, slug, description, created_at FROM departments ORDER BY name ASC');

  return rows.map(mapDepartment);
}

export async function getCalendarConnectionForUser(userId: number): Promise<CalendarConnection | null> {
  const row = await firstRow<{
    user_id: number;
    connected_at: string;
  }>(
    `SELECT user_id, connected_at
     FROM calendar_connections
     WHERE user_id = ?`,
    userId
  );

  if (!row) {
    return null;
  }

  return {
    userId: row.user_id,
    connectedAt: row.connected_at,
  };
}

export async function disconnectCalendarConnection(currentUser: SessionLikeUser) {
  assertAuthenticated(currentUser);
  await runStatement('DELETE FROM calendar_connections WHERE user_id = ?', Number(currentUser.id));
  await writeAuditLog(Number(currentUser.id), 'delete', 'calendar_connection', Number(currentUser.id), {
    userId: Number(currentUser.id),
  });
}

export async function listNotificationsForUser(currentUser: SessionLikeUser, limit = 50) {
  assertAuthenticated(currentUser);

  const rows = await allRows<{
    id: number;
    user_id: number;
    notification_type: string;
    title: string;
    message: string;
    action_url: string | null;
    read_at: string | null;
    created_at: string;
  }>(
    `SELECT
      id,
      user_id,
      notification_type,
      title,
      message,
      action_url,
      read_at,
      created_at
     FROM user_notifications
     WHERE user_id = ?
     ORDER BY created_at DESC, id DESC
     LIMIT ?`,
    Number(currentUser.id),
    limit
  );

  return rows.map(
    (row): UserNotification => ({
      id: row.id,
      userId: row.user_id,
      notificationType: row.notification_type,
      title: row.title,
      message: row.message,
      actionUrl: row.action_url,
      readAt: row.read_at,
      createdAt: row.created_at,
    })
  );
}

export async function markNotificationRead(currentUser: SessionLikeUser, notificationId: number) {
  assertAuthenticated(currentUser);

  await runStatement(
    `UPDATE user_notifications
     SET read_at = COALESCE(read_at, datetime('now'))
     WHERE id = ? AND user_id = ?`,
    notificationId,
    Number(currentUser.id)
  );
}

export async function getDepartmentFieldDefinitions(departmentId: number) {
  const rows = await allRows<{
    id: number;
    department_id: number;
    field_key: string;
    label: string;
    field_type: DepartmentFieldDefinition['fieldType'];
    display_order: number;
    is_required: number;
    created_at: string;
  }>(
    `SELECT id, department_id, field_key, label, field_type, display_order, is_required, created_at
     FROM department_field_defs
     WHERE department_id = ?
     ORDER BY display_order ASC, id ASC`,
    departmentId
  );

  return rows.map(mapFieldDefinition);
}

export async function listUsers() {
  const rows = await allRows<{
    id: number;
    name: string;
    email: string;
    role: GlobalRole;
    system_role?: SystemRole;
    status?: 'pending' | 'approved' | 'rejected' | 'active';
    avatar_url?: string | null;
    must_change_password: number;
    created_at: string;
    updated_at: string;
  }>(
    `SELECT id, name, email, role, system_role, status, avatar_url, must_change_password, created_at, updated_at
     FROM users
     ORDER BY name ASC`
  );

  return Promise.all(rows.map(mapUser));
}

export async function listDepartmentMembershipsForUser(userId: number) {
  const rows = await allRows<{
    id: number;
    department_id: number;
    user_id: number;
    role: DepartmentMembershipRole;
    status: 'pending' | 'approved' | 'rejected';
    added_directly: number;
    requested_at: string | null;
    decided_at: string | null;
    decided_by_user_id: number | null;
  }>(
    `SELECT
      id,
      department_id,
      user_id,
      role,
      status,
      added_directly,
      requested_at,
      decided_at,
      decided_by_user_id
     FROM department_memberships
     WHERE user_id = ?
     ORDER BY requested_at DESC, id DESC`,
    userId
  );

  return rows.map(mapDepartmentMembership);
}

export async function listPendingDepartmentMemberships(
  currentUser: SessionLikeUser
): Promise<MembershipReviewItem[]> {
  assertAuthenticated(currentUser);

  const rows = await allRows<{
    id: number;
    department_id: number;
    user_id: number;
    role: DepartmentMembershipRole;
    status: 'pending' | 'approved' | 'rejected';
    added_directly: number;
    requested_at: string | null;
    decided_at: string | null;
    decided_by_user_id: number | null;
    department_name: string;
    user_name: string;
    user_email: string;
  }>(
    `SELECT
      department_memberships.id,
      department_memberships.department_id,
      department_memberships.user_id,
      department_memberships.role,
      department_memberships.status,
      department_memberships.added_directly,
      department_memberships.requested_at,
      department_memberships.decided_at,
      department_memberships.decided_by_user_id,
      departments.name AS department_name,
      users.name AS user_name,
      users.email AS user_email
     FROM department_memberships
     INNER JOIN departments ON departments.id = department_memberships.department_id
     INNER JOIN users ON users.id = department_memberships.user_id
     WHERE department_memberships.status = 'pending'
     ORDER BY department_memberships.requested_at ASC, department_memberships.id ASC`
  );

  return rows
    .filter((row) => {
      if (currentUser.systemRole === 'main_admin' || currentUser.systemRole === 'chief_admin' || currentUser.role === 'admin') {
        return true;
      }

      return currentUser.departmentRoles?.[row.department_id] === 'department_admin';
    })
    .map((row) => ({
      ...mapDepartmentMembership(row),
      departmentName: row.department_name,
      userName: row.user_name,
      userEmail: row.user_email,
      }));
}

export async function countPendingDepartmentMemberships(currentUser: SessionLikeUser) {
  const requests = await listPendingDepartmentMemberships(currentUser);
  return requests.length;
}

export async function countUnreadNotificationsForUser(currentUser: SessionLikeUser) {
  assertAuthenticated(currentUser);

  const row = await firstRow<{ total: number }>(
    `SELECT COUNT(*) AS total
     FROM user_notifications
     WHERE user_id = ? AND read_at IS NULL`,
    Number(currentUser.id)
  );

  return row?.total || 0;
}

export async function listDepartmentInvites(currentUser: SessionLikeUser, departmentId?: number) {
  assertAuthenticated(currentUser);

  if (departmentId) {
    assertDepartmentAdminAccess(currentUser, departmentId);
  }

  const filterSql = departmentId ? 'WHERE department_invites.department_id = ?' : '';
  const filterParams = departmentId ? [departmentId] : [];

  const rows = await allRows<{
    id: number;
    department_id: number;
    department_name: string;
    role: DepartmentMembershipRole;
    note: string | null;
    expires_at: string;
    used_at: string | null;
    used_by_user_id: number | null;
    used_by_name: string | null;
    created_at: string;
    created_by_user_id: number | null;
    created_by_name: string | null;
  }>(
    `SELECT
      department_invites.id,
      department_invites.department_id,
      departments.name AS department_name,
      department_invites.role,
      department_invites.note,
      department_invites.expires_at,
      department_invites.used_at,
      department_invites.used_by_user_id,
      used_by.name AS used_by_name,
      department_invites.created_at,
      department_invites.created_by_user_id,
      created_by.name AS created_by_name
     FROM department_invites
     INNER JOIN departments ON departments.id = department_invites.department_id
     LEFT JOIN users AS used_by ON used_by.id = department_invites.used_by_user_id
     LEFT JOIN users AS created_by ON created_by.id = department_invites.created_by_user_id
     ${filterSql}
     ORDER BY department_invites.created_at DESC, department_invites.id DESC`,
    ...filterParams
  );

  return rows
    .filter((row) => {
      if (currentUser.systemRole === 'main_admin' || currentUser.systemRole === 'chief_admin' || currentUser.role === 'admin') {
        return true;
      }

      return currentUser.departmentRoles?.[row.department_id] === 'department_admin';
    })
    .map(mapDepartmentInvite);
}

async function getInviteRowByToken(token: string) {
  const tokenHash = hashInviteToken(token);
  return firstRow<{
    id: number;
    department_id: number;
    department_name: string;
    role: DepartmentMembershipRole;
    note: string | null;
    expires_at: string;
    used_at: string | null;
  }>(
    `SELECT
      department_invites.id,
      department_invites.department_id,
      departments.name AS department_name,
      department_invites.role,
      department_invites.note,
      department_invites.expires_at,
      department_invites.used_at
     FROM department_invites
     INNER JOIN departments ON departments.id = department_invites.department_id
     WHERE department_invites.token_hash = ?`,
    tokenHash
  );
}

export async function getDepartmentInviteByToken(token: string) {
  const parsed = acceptDepartmentInviteSchema.parse({ token });
  const row = await getInviteRowByToken(parsed.token);

  if (!row) {
    return null;
  }

  return {
    ...mapDepartmentInvite({
      ...row,
      used_by_user_id: null,
      used_by_name: null,
      created_at: '',
      created_by_user_id: null,
      created_by_name: null,
    }),
    inviteUrl: buildInviteUrl(parsed.token),
    createdAt: '',
  };
}

export async function getDashboardSummary(user: SessionLikeUser): Promise<DashboardSummary> {
  const departments = await listDepartmentsForUser(user);
  const departmentIds = departments.map((department) => department.id);

  const recordCount = departmentIds.length
    ? ((await firstRow<{ total: number }>(
        `SELECT COUNT(*) AS total
         FROM department_records
         WHERE department_id IN (${departmentIds.map(() => '?').join(', ')})`,
        ...departmentIds
      ))?.total || 0)
    : 0;

  const visitorCount = departmentIds.length
    ? ((await firstRow<{ total: number }>(
        `SELECT COUNT(*) AS total
         FROM record_visitors
         INNER JOIN department_records ON department_records.id = record_visitors.record_id
         WHERE department_records.department_id IN (${departmentIds.map(() => '?').join(', ')})`,
        ...departmentIds
      ))?.total || 0)
    : 0;

  const openActionItemCount = departmentIds.length
    ? ((await firstRow<{ total: number }>(
        `SELECT COUNT(*) AS total
         FROM meeting_action_items
         INNER JOIN meetings ON meetings.id = meeting_action_items.meeting_id
         WHERE meeting_action_items.status = 'open'
           AND (meetings.department_id IS NULL OR meetings.department_id IN (${departmentIds.map(() => '?').join(', ')}))`,
        ...departmentIds
      ))?.total || 0)
    : ((await firstRow<{ total: number }>(
        "SELECT COUNT(*) AS total FROM meeting_action_items WHERE status = 'open'"
      ))?.total || 0);

  const latestRows = departmentIds.length
    ? await allRows<{
        id: number;
        department_id: number;
        department_name: string;
        record_date: string;
        handled_by_user_id: number;
        handled_by_name: string;
        values_json: string;
        visitor_count: number;
        created_at: string;
        updated_at: string;
      }>(
        `SELECT
          department_records.id,
          department_records.department_id,
          departments.name AS department_name,
          department_records.record_date,
          department_records.handled_by_user_id,
          users.name AS handled_by_name,
          department_records.values_json,
          COALESCE(visitor_counts.total, 0) AS visitor_count,
          department_records.created_at,
          department_records.updated_at
        FROM department_records
        INNER JOIN departments ON departments.id = department_records.department_id
        INNER JOIN users ON users.id = department_records.handled_by_user_id
        LEFT JOIN (
          SELECT record_id, COUNT(*) AS total
          FROM record_visitors
          GROUP BY record_id
        ) AS visitor_counts ON visitor_counts.record_id = department_records.id
        WHERE department_records.department_id IN (${departmentIds.map(() => '?').join(', ')})
        ORDER BY department_records.record_date DESC, department_records.id DESC
        LIMIT 5`,
        ...departmentIds
      )
    : [];

  const latestRecords = latestRows.map(mapRecord);
  const upcomingMeetings = (await listMeetings(user)).slice(0, 5);

  return {
    departmentCount: departments.length,
    recordCount,
    openActionItemCount,
    visitorCount,
    latestRecords,
    upcomingMeetings,
  };
}

export async function listRecordsForDepartment(
  user: SessionLikeUser,
  departmentId: number,
  range?: { start?: string; end?: string }
) {
  assertDepartmentAccess(user, departmentId);

  const start = range?.start?.trim() || '';
  const end = range?.end?.trim() || '';

  const rows = await allRows<{
    id: number;
    department_id: number;
    department_name: string;
    record_date: string;
    handled_by_user_id: number;
    handled_by_name: string;
    values_json: string;
    visitor_count: number;
    created_at: string;
    updated_at: string;
  }>(
    `SELECT
      department_records.id,
      department_records.department_id,
      departments.name AS department_name,
      department_records.record_date,
      department_records.handled_by_user_id,
      users.name AS handled_by_name,
      department_records.values_json,
      COALESCE(visitor_counts.total, 0) AS visitor_count,
      department_records.created_at,
      department_records.updated_at
    FROM department_records
    INNER JOIN departments ON departments.id = department_records.department_id
    INNER JOIN users ON users.id = department_records.handled_by_user_id
    LEFT JOIN (
      SELECT record_id, COUNT(*) AS total
      FROM record_visitors
      GROUP BY record_id
    ) AS visitor_counts ON visitor_counts.record_id = department_records.id
    WHERE department_records.department_id = ?
      AND (? = '' OR department_records.record_date >= ?)
      AND (? = '' OR department_records.record_date <= ?)
    ORDER BY department_records.record_date DESC, department_records.id DESC`,
    departmentId,
    start,
    start,
    end,
    end
  );

  return rows.map(mapRecord);
}

export async function getDepartmentRecordById(
  user: SessionLikeUser,
  recordId: number
): Promise<DepartmentRecordDetail> {
  const row = (await firstRow<
    | {
        id: number;
        department_id: number;
        department_name: string;
        record_date: string;
        handled_by_user_id: number;
        handled_by_name: string;
        values_json: string;
        visitor_count: number;
        created_at: string;
        updated_at: string;
      }
    >(
      `SELECT
        department_records.id,
        department_records.department_id,
        departments.name AS department_name,
        department_records.record_date,
        department_records.handled_by_user_id,
        users.name AS handled_by_name,
        department_records.values_json,
        COALESCE(visitor_counts.total, 0) AS visitor_count,
        department_records.created_at,
        department_records.updated_at
      FROM department_records
      INNER JOIN departments ON departments.id = department_records.department_id
      INNER JOIN users ON users.id = department_records.handled_by_user_id
      LEFT JOIN (
        SELECT record_id, COUNT(*) AS total
        FROM record_visitors
        GROUP BY record_id
      ) AS visitor_counts ON visitor_counts.record_id = department_records.id
      WHERE department_records.id = ?`,
      recordId
    )) as
    | {
        id: number;
        department_id: number;
        department_name: string;
        record_date: string;
        handled_by_user_id: number;
        handled_by_name: string;
        values_json: string;
        visitor_count: number;
        created_at: string;
        updated_at: string;
      }
    | undefined;

  if (!row) {
    throw new Error('Record not found.');
  }

  assertDepartmentAccess(user, row.department_id);

  return {
    ...mapRecord(row),
    visitors: await listVisitorsForRecord(recordId),
  };
}

export async function getInsightsForDepartment(
  user: SessionLikeUser,
  departmentId: number,
  range?: { start?: string; end?: string }
): Promise<InsightsPayload> {
  assertDepartmentAccess(user, departmentId);

  const department = (await listAllDepartments()).find((item) => item.id === departmentId);
  if (!department) {
    throw new Error('Department not found.');
  }

  const records = (await listRecordsForDepartment(user, departmentId, range)).reverse();
  const fieldDefs = await getDepartmentFieldDefinitions(departmentId);
  const numericFieldDefs = fieldDefs.filter(
    (field) => field.fieldType === 'number' || field.fieldType === 'currency'
  );
  const start = range?.start || subDays(new Date(), 120).toISOString().slice(0, 10);
  const end = range?.end || new Date().toISOString().slice(0, 10);
  const metrics = await allRows<{
    record_id: number;
    field_key: string;
    label: string;
    numeric_value: number;
    record_date: string;
  }>(
    `SELECT
      record_metrics.record_id,
      record_metrics.field_key,
      department_field_defs.label,
      record_metrics.numeric_value,
      department_records.record_date
     FROM record_metrics
     INNER JOIN department_records ON department_records.id = record_metrics.record_id
     INNER JOIN department_field_defs
       ON department_field_defs.department_id = department_records.department_id
      AND department_field_defs.field_key = record_metrics.field_key
     WHERE department_records.department_id = ?
       AND department_records.record_date BETWEEN ? AND ?
     ORDER BY department_records.record_date ASC, record_metrics.field_key ASC`,
    departmentId,
    start,
    end
  );

  const threshold = Number(process.env.CAP_ANOMALY_THRESHOLD || '25');
  const metricGroups = new Map<string, Array<{ recordId: number; recordDate: string; value: number; label: string }>>();
  const metricsByRecordId = new Map<number, Map<string, number>>();

  for (const metric of metrics) {
    const current = metricGroups.get(metric.field_key) || [];
    current.push({
      recordId: metric.record_id,
      recordDate: metric.record_date,
      value: metric.numeric_value,
      label: metric.label,
    });
    metricGroups.set(metric.field_key, current);

    const recordMetrics = metricsByRecordId.get(metric.record_id) || new Map<string, number>();
    recordMetrics.set(metric.field_key, metric.numeric_value);
    metricsByRecordId.set(metric.record_id, recordMetrics);
  }

  for (const field of numericFieldDefs) {
    if (!metricGroups.has(field.fieldKey)) {
      metricGroups.set(field.fieldKey, []);
    }
  }

  metricGroups.set(
    'visitor_count',
    records.map((record) => ({
      recordId: record.id,
      recordDate: record.recordDate,
      value: record.visitorCount,
      label: 'Visitor Count',
    }))
  );

  const orderedSeriesKeys = [...numericFieldDefs.map((field) => field.fieldKey), 'visitor_count'];
  const series = orderedSeriesKeys
    .filter((fieldKey) => metricGroups.has(fieldKey))
    .map((fieldKey) => {
      const points = metricGroups.get(fieldKey) || [];
    const enrichedPoints = points.map((point, index) => {
      const previous = points.slice(Math.max(0, index - 4), index);
      const average = previous.length
        ? previous.reduce((sum, current) => sum + current.value, 0) / previous.length
        : point.value;
      const anomaly = previous.length > 0 && average !== 0
        ? Math.abs(((point.value - average) / average) * 100) > threshold
        : false;

      return {
        recordId: point.recordId,
        recordDate: point.recordDate,
        value: point.value,
        anomaly,
      };
    });

    return {
      fieldKey,
      label: points[0]?.label || fieldDefs.find((field) => field.fieldKey === fieldKey)?.label || fieldKey,
      points: enrichedPoints,
    };
  });

  const hasNetPosition = ['tithe', 'offering', 'expenses'].every((fieldKey) =>
    numericFieldDefs.some((field) => field.fieldKey === fieldKey)
  );

  const netPositions = hasNetPosition
    ? records.reduce<
    Array<{
      recordId: number;
      recordDate: string;
      weeklyNet: number;
      cumulativeNet: number;
    }>
  >((accumulator, record) => {
    const values = record.values as Record<string, number | string>;
    const weeklyNet = Number(values.tithe || 0) + Number(values.offering || 0) - Number(values.expenses || 0);
    const lastCumulative = accumulator.length ? accumulator[accumulator.length - 1].cumulativeNet : 0;
    accumulator.push({
      recordId: record.id,
      recordDate: record.recordDate,
      weeklyNet,
      cumulativeNet: lastCumulative + weeklyNet,
    });
    return accumulator;
  }, [])
    : [];

  const handlerSummaryMap = new Map<
    number,
    {
      handledByUserId: number;
      handledByName: string;
      weeksHandled: number;
      totalVisitors: number;
      metricTotalsMap: Map<string, number>;
    }
  >();

  for (const record of records) {
    const current =
      handlerSummaryMap.get(record.handledByUserId) ||
      {
        handledByUserId: record.handledByUserId,
        handledByName: record.handledByName,
        weeksHandled: 0,
        totalVisitors: 0,
        metricTotalsMap: new Map<string, number>(),
      };

    current.weeksHandled += 1;
    current.totalVisitors += record.visitorCount;

    const recordMetrics = metricsByRecordId.get(record.id) || new Map<string, number>();
    for (const field of numericFieldDefs) {
      const previousValue = current.metricTotalsMap.get(field.fieldKey) || 0;
      current.metricTotalsMap.set(field.fieldKey, previousValue + (recordMetrics.get(field.fieldKey) || 0));
    }

    handlerSummaryMap.set(record.handledByUserId, current);
  }

  const handlerSummary = Array.from(handlerSummaryMap.values())
    .map((row) => ({
      handledByUserId: row.handledByUserId,
      handledByName: row.handledByName,
      weeksHandled: row.weeksHandled,
      metricTotals: numericFieldDefs.map((field) => ({
        fieldKey: field.fieldKey,
        label: field.label,
        value: row.metricTotalsMap.get(field.fieldKey) || 0,
      })),
      totalVisitors: row.totalVisitors,
    }))
    .sort((left, right) => {
      if (right.weeksHandled !== left.weeksHandled) {
        return right.weeksHandled - left.weeksHandled;
      }

      return left.handledByName.localeCompare(right.handledByName);
    });

  return {
    department,
    records,
    series,
    netPositions,
    hasNetPosition,
    handlerSummary,
  };
}

function calculateChangePercent(currentValue: number, previousValue: number) {
  if (previousValue === 0) {
    return currentValue === 0 ? 0 : null;
  }

  return Number((((currentValue - previousValue) / previousValue) * 100).toFixed(1));
}

async function buildGeneratedReportSnapshot(
  user: SessionLikeUser,
  departmentId: number,
  periodType: GenerateDepartmentReportInput['periodType'],
  periodStart: string,
  periodEnd: string
): Promise<GeneratedReportSnapshot> {
  const insights = await getInsightsForDepartment(user, departmentId, {
    start: periodStart,
    end: periodEnd,
  });
  const previousRange = resolvePreviousReportRange(periodStart, periodEnd);
  const previousInsights = await getInsightsForDepartment(user, departmentId, previousRange);

  const totals = insights.series
    .filter((series) => series.fieldKey !== 'visitor_count')
    .map((series) => {
      const total = series.points.reduce((sum, point) => sum + point.value, 0);
      const previousSeries = previousInsights.series.find((item) => item.fieldKey === series.fieldKey);
      const previousTotal =
        previousSeries?.points.reduce((sum, point) => sum + point.value, 0) || 0;

      return {
        fieldKey: series.fieldKey,
        label: series.label,
        total,
        average: series.points.length > 0 ? Number((total / series.points.length).toFixed(2)) : 0,
        previousTotal,
        changePercent: calculateChangePercent(total, previousTotal),
      };
    });

  const anomalyFields = Array.from(
    new Set(
      insights.series
        .filter((series) => series.points.some((point) => point.anomaly))
        .map((series) => series.label)
    )
  );

  const netPositionTotal = insights.netPositions.reduce((sum, point) => sum + point.weeklyNet, 0);
  const previousNetPositionTotal = previousInsights.netPositions.reduce(
    (sum, point) => sum + point.weeklyNet,
    0
  );

  return {
    departmentId: insights.department.id,
    departmentName: insights.department.name,
    periodType,
    periodStart,
    periodEnd,
    previousPeriodStart: previousRange.start,
    previousPeriodEnd: previousRange.end,
    generatedAt: new Date().toISOString(),
    recordCount: insights.records.length,
    previousRecordCount: previousInsights.records.length,
    totalVisitors: insights.records.reduce((sum, record) => sum + record.visitorCount, 0),
    previousTotalVisitors: previousInsights.records.reduce((sum, record) => sum + record.visitorCount, 0),
    totals,
    anomalyCount: insights.series.reduce(
      (sum, series) => sum + series.points.filter((point) => point.anomaly).length,
      0
    ),
    anomalyFields,
    netPosition: insights.hasNetPosition
      ? {
          total: netPositionTotal,
          previousTotal: previousNetPositionTotal,
          changePercent: calculateChangePercent(netPositionTotal, previousNetPositionTotal),
        }
      : null,
    handlerSummary: insights.handlerSummary,
  };
}

function mapGeneratedReport(row: {
  id: number;
  department_id: number;
  period_type: GenerateDepartmentReportInput['periodType'];
  period_start: string;
  period_end: string;
  summary_text: string;
  data_snapshot_json: string;
  generated_by_user_id: number | null;
  generated_by_name: string | null;
  generated_at: string;
}): GeneratedReport {
  return {
    id: row.id,
    departmentId: row.department_id,
    periodType: row.period_type,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    summaryText: row.summary_text,
    dataSnapshot: parseJsonValue<GeneratedReportSnapshot>(row.data_snapshot_json, {
      departmentId: row.department_id,
      departmentName: '',
      periodType: row.period_type,
      periodStart: row.period_start,
      periodEnd: row.period_end,
      previousPeriodStart: row.period_start,
      previousPeriodEnd: row.period_end,
      generatedAt: row.generated_at,
      recordCount: 0,
      previousRecordCount: 0,
      totalVisitors: 0,
      previousTotalVisitors: 0,
      totals: [],
      anomalyCount: 0,
      anomalyFields: [],
      netPosition: null,
      handlerSummary: [],
    }),
    generatedByUserId: row.generated_by_user_id,
    generatedByName: row.generated_by_name,
    generatedAt: row.generated_at,
  };
}

export async function listGeneratedReportsForDepartment(
  user: SessionLikeUser,
  departmentId: number,
  limit = 6
) {
  assertDepartmentAccess(user, departmentId);

  const rows = await allRows<{
    id: number;
    department_id: number;
    period_type: GenerateDepartmentReportInput['periodType'];
    period_start: string;
    period_end: string;
    summary_text: string;
    data_snapshot_json: string;
    generated_by_user_id: number | null;
    generated_by_name: string | null;
    generated_at: string;
  }>(
    `SELECT
      generated_reports.id,
      generated_reports.department_id,
      generated_reports.period_type,
      generated_reports.period_start,
      generated_reports.period_end,
      generated_reports.summary_text,
      generated_reports.data_snapshot_json,
      generated_reports.generated_by_user_id,
      users.name AS generated_by_name,
      generated_reports.generated_at
     FROM generated_reports
     LEFT JOIN users ON users.id = generated_reports.generated_by_user_id
     WHERE generated_reports.department_id = ?
     ORDER BY generated_reports.generated_at DESC
     LIMIT ?`,
    departmentId,
    limit
  );

  return rows.map(mapGeneratedReport);
}

export async function getGeneratedReportById(
  user: SessionLikeUser,
  reportId: number
) {
  const row = await firstRow<{
    id: number;
    department_id: number;
    period_type: GenerateDepartmentReportInput['periodType'];
    period_start: string;
    period_end: string;
    summary_text: string;
    data_snapshot_json: string;
    generated_by_user_id: number | null;
    generated_by_name: string | null;
    generated_at: string;
  }>(
    `SELECT
      generated_reports.id,
      generated_reports.department_id,
      generated_reports.period_type,
      generated_reports.period_start,
      generated_reports.period_end,
      generated_reports.summary_text,
      generated_reports.data_snapshot_json,
      generated_reports.generated_by_user_id,
      users.name AS generated_by_name,
      generated_reports.generated_at
     FROM generated_reports
     LEFT JOIN users ON users.id = generated_reports.generated_by_user_id
     WHERE generated_reports.id = ?`,
    reportId
  );

  if (!row) {
    throw new Error('Generated report not found.');
  }

  assertDepartmentAccess(user, row.department_id);
  return mapGeneratedReport(row);
}

export async function deleteGeneratedReport(
  currentUser: SessionLikeUser,
  reportId: number
) {
  const row = await firstRow<{
    id: number;
    department_id: number;
    period_type: GenerateDepartmentReportInput['periodType'];
    period_start: string;
    period_end: string;
    summary_text: string;
  }>(
    `SELECT id, department_id, period_type, period_start, period_end, summary_text
     FROM generated_reports
     WHERE id = ?`,
    reportId
  );

  if (!row) {
    throw new Error('Generated report not found.');
  }

  assertDepartmentAdminAccess(currentUser, row.department_id);

  await runStatement('DELETE FROM generated_reports WHERE id = ?', reportId);
  await writeAuditLog(Number(currentUser.id), 'delete', 'generated_report', reportId, {
    departmentId: row.department_id,
    periodType: row.period_type,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    summaryPreview: row.summary_text.slice(0, 160),
  });
}

export async function generateDepartmentReport(
  currentUser: SessionLikeUser,
  input: GenerateDepartmentReportInput
) {
  const parsed = generateDepartmentReportSchema.parse(input);
  const { start, end } = resolveReportRange(parsed.periodType, parsed.start, parsed.end);

  assertDepartmentAdminAccess(currentUser, parsed.departmentId);

  const snapshot = await buildGeneratedReportSnapshot(
    currentUser,
    parsed.departmentId,
    parsed.periodType,
    start,
    end
  );
  const summaryText = await generateExecutiveSummaryWithGroq(snapshot);

  const result = await runStatement(
    `INSERT INTO generated_reports
     (department_id, period_type, period_start, period_end, summary_text, data_snapshot_json, generated_by_user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    parsed.departmentId,
    parsed.periodType,
    start,
    end,
    summaryText,
    JSON.stringify(snapshot),
    Number(currentUser.id)
  );

  const reportId = Number(result.lastInsertRowid);

  await writeAuditLog(Number(currentUser.id), 'create', 'generated_report', reportId, {
    departmentId: parsed.departmentId,
    periodType: parsed.periodType,
    periodStart: start,
    periodEnd: end,
  });

  return {
    id: reportId,
    departmentId: parsed.departmentId,
    periodType: parsed.periodType,
    periodStart: start,
    periodEnd: end,
    summaryText,
    dataSnapshot: snapshot,
    generatedByUserId: Number(currentUser.id),
    generatedByName: currentUser.name || null,
    generatedAt: snapshot.generatedAt,
  } satisfies GeneratedReport;
}

export async function createDepartment(currentUser: SessionLikeUser, input: CreateDepartmentInput) {
  assertAdmin(currentUser);
  const parsed = createDepartmentSchema.parse({
    ...input,
    slug: normalizeSlug(input.slug || input.name),
  });

  const result = await runStatement(
    'INSERT INTO departments (name, slug, description) VALUES (?, ?, ?)',
    parsed.name,
    parsed.slug,
    parsed.description || null
  );

  const departmentId = Number(result.lastInsertRowid);
  await writeAuditLog(Number(currentUser.id), 'create', 'department', departmentId, parsed);
  return departmentId;
}

export async function createFieldDefinition(currentUser: SessionLikeUser, input: CreateFieldDefinitionInput) {
  assertAdmin(currentUser);
  const parsed = createFieldDefinitionSchema.parse(input);

  const result = await runStatement(
    `INSERT INTO department_field_defs
     (department_id, field_key, label, field_type, display_order, is_required)
     VALUES (?, ?, ?, ?, ?, ?)`,
    parsed.departmentId,
    normalizeSlug(parsed.fieldKey).replace(/-/g, '_'),
    parsed.label,
    parsed.fieldType,
    parsed.displayOrder,
    parsed.isRequired ? 1 : 0
  );

  const fieldId = Number(result.lastInsertRowid);
  await writeAuditLog(Number(currentUser.id), 'create', 'department_field_def', fieldId, parsed);
  return fieldId;
}

export async function createUser(currentUser: SessionLikeUser, input: CreateUserInput) {
  assertAdmin(currentUser);
  const parsed = createUserSchema.parse(input);
  if (parsed.systemRole === 'main_admin') {
    throw new Error('Only the seeded main admin can hold the main_admin role.');
  }

  if (parsed.systemRole === 'none' && parsed.departmentIds.length === 0) {
    throw new Error('Assign at least one department unless you are creating a chief admin.');
  }

  const status = parsed.systemRole === 'chief_admin' || parsed.departmentIds.length > 0 ? 'active' : 'pending';

  const result = await runStatement(
    `INSERT INTO users (name, email, role, password_hash, must_change_password, system_role, status)
     VALUES (?, ?, 'member', '', 0, ?, ?)`,
    parsed.name,
    parsed.email.toLowerCase(),
    parsed.systemRole,
    status
  );

  const userId = Number(result.lastInsertRowid);

  for (const departmentId of parsed.departmentIds) {
    await runStatement(
      `INSERT OR IGNORE INTO department_memberships
       (department_id, user_id, role, status, added_directly, requested_at, decided_at, decided_by_user_id)
       VALUES (?, ?, ?, 'approved', 1, datetime('now'), datetime('now'), ?)`,
      departmentId,
      userId,
      parsed.departmentRole,
      Number(currentUser.id)
    );
  }

  const assignedDepartments = (
    await Promise.all(
      parsed.departmentIds.map(async (departmentId) => {
        const department = await getDepartmentById(departmentId);
        return department ? { name: department.name, role: parsed.departmentRole } : null;
      })
    )
  ).filter(Boolean) as Array<{ name: string; role: string }>;

  await writeAuditLog(Number(currentUser.id), 'create', 'user', userId, {
    name: parsed.name,
    email: parsed.email,
    systemRole: parsed.systemRole,
    departmentIds: parsed.departmentIds,
    departmentRole: parsed.departmentRole,
  });

  await sendAdminAddedUserInviteNotification({
    recipient: {
      email: parsed.email.toLowerCase(),
      name: parsed.name,
    },
    systemRole: parsed.systemRole,
    departments: assignedDepartments,
  });

  return userId;
}

export async function createDepartmentInvite(currentUser: SessionLikeUser, input: CreateDepartmentInviteInput) {
  assertAuthenticated(currentUser);
  const parsed = createDepartmentInviteSchema.parse(input);
  assertDepartmentAdminAccess(currentUser, parsed.departmentId);

  const department = await getDepartmentById(parsed.departmentId);
  if (!department) {
    throw new Error('Department not found.');
  }

  const token = generateInviteToken();
  const expiresAt = addDays(new Date(), parsed.expiresInDays).toISOString();
  const result = await runStatement(
    `INSERT INTO department_invites
     (department_id, role, note, token_hash, expires_at, created_by_user_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    parsed.departmentId,
    parsed.role,
    parsed.note?.trim() || null,
    hashInviteToken(token),
    expiresAt,
    Number(currentUser.id)
  );

  const inviteId = Number(result.lastInsertRowid);
  await writeAuditLog(Number(currentUser.id), 'create', 'department_invite', inviteId, {
    departmentId: parsed.departmentId,
    role: parsed.role,
    expiresAt,
    note: parsed.note?.trim() || null,
  });

  return {
    id: inviteId,
    departmentId: parsed.departmentId,
    departmentName: department.name,
    role: parsed.role,
    note: parsed.note?.trim() || null,
    expiresAt,
    inviteUrl: buildInviteUrl(token),
  };
}

async function applyDepartmentInviteToUser(userId: number, currentUserId: number | null, token: string) {
  const invite = await getInviteRowByToken(token);
  if (!invite) {
    throw new Error('Invite link not found.');
  }

  if (invite.used_at) {
    throw new Error('This invite link has already been used.');
  }

  if (new Date(invite.expires_at).getTime() < Date.now()) {
    throw new Error('This invite link has expired.');
  }

  await runStatement(
    `INSERT INTO department_memberships
     (department_id, user_id, role, status, added_directly, requested_at, decided_at, decided_by_user_id)
     VALUES (?, ?, ?, 'approved', 1, datetime('now'), datetime('now'), ?)
     ON CONFLICT(department_id, user_id) DO UPDATE SET
       role = excluded.role,
       status = 'approved',
       added_directly = 1,
       requested_at = datetime('now'),
       decided_at = datetime('now'),
       decided_by_user_id = excluded.decided_by_user_id`,
    invite.department_id,
    userId,
    invite.role,
    currentUserId
  );

  await runStatement(
    `UPDATE users
     SET status = 'active',
         updated_at = datetime('now')
     WHERE id = ?`,
    userId
  );

  await runStatement(
    `UPDATE department_invites
     SET used_at = datetime('now'),
         used_by_user_id = ?
     WHERE id = ?`,
    userId,
    invite.id
  );

  await writeAuditLog(currentUserId, 'accept', 'department_invite', invite.id, {
    departmentId: invite.department_id,
    userId,
    role: invite.role,
  });

  return {
    departmentId: invite.department_id,
    departmentName: invite.department_name,
    role: invite.role,
    destinationUrl: buildDepartmentLandingUrl(invite.department_id),
  };
}

export async function createPublicUserAccessRequest(input: PublicUserAccessRequestInput) {
  const parsed = publicSignupSchema.parse(input);
  const normalizedEmail = normalizeEmail(parsed.email);
  const existingUser = await firstRow<{
    id: number;
  }>(
    `SELECT id
     FROM users
     WHERE lower(email) = lower(?)`,
    normalizedEmail
  );

  if (existingUser) {
    throw new Error('An account with this email already exists. Sign in and continue from your dashboard or profile.');
  }

  const result = await runStatement(
    `INSERT INTO users (name, email, role, password_hash, must_change_password, system_role, status)
     VALUES (?, ?, 'member', ?, 0, 'none', 'pending')`,
    parsed.name.trim(),
    normalizedEmail,
    bcrypt.hashSync(parsed.password.trim(), 10)
  );

  const userId = Number(result.lastInsertRowid);

  for (const departmentId of parsed.departmentIds) {
    await runStatement(
      `INSERT INTO department_memberships
       (department_id, user_id, role, status, added_directly, requested_at)
       VALUES (?, ?, 'member', 'pending', 0, datetime('now'))
       ON CONFLICT(department_id, user_id) DO UPDATE SET
         status = 'pending',
         role = 'member',
         added_directly = 0,
         requested_at = datetime('now'),
         decided_at = NULL,
         decided_by_user_id = NULL`,
      departmentId,
      userId
    );
  }

  await writeAuditLog(null, 'create', 'public_user_access_request', userId, {
    name: parsed.name.trim(),
    email: normalizedEmail,
    departmentIds: parsed.departmentIds,
  });

  for (const departmentId of parsed.departmentIds) {
    const department = await getDepartmentById(departmentId);
    if (!department) {
      continue;
    }

    const recipients = await getApprovalRecipientsForDepartment(departmentId);
    await sendDepartmentAccessRequestNotification({
      requesterName: parsed.name.trim(),
      requesterEmail: normalizedEmail,
      departmentName: department.name,
      recipients,
    });
  }

  return {
    userId,
    email: normalizedEmail,
    name: parsed.name.trim(),
  };
}

export async function acceptDepartmentInvite(currentUser: SessionLikeUser, input: AcceptDepartmentInviteInput) {
  assertAuthenticated(currentUser);
  const parsed = acceptDepartmentInviteSchema.parse(input);

  const result = await applyDepartmentInviteToUser(Number(currentUser.id), Number(currentUser.id), parsed.token);
  return {
    ...result,
    email: currentUser.email || null,
    name: currentUser.name || null,
  };
}

export async function acceptDepartmentInviteWithSignup(input: AcceptDepartmentInviteWithSignupInput) {
  const parsed = acceptDepartmentInviteWithSignupSchema.parse(input);
  const normalizedEmail = normalizeEmail(parsed.email);
  const existingUser = await firstRow<{ id: number }>(
    `SELECT id
     FROM users
     WHERE lower(email) = lower(?)`,
    normalizedEmail
  );

  if (existingUser) {
    throw new Error('An account with this email already exists. Sign in first, then reopen the invite link to claim access.');
  }

  const result = await runStatement(
    `INSERT INTO users (name, email, role, password_hash, must_change_password, system_role, status)
     VALUES (?, ?, 'member', ?, 0, 'none', 'pending')`,
    parsed.name.trim(),
    normalizedEmail,
    bcrypt.hashSync(parsed.password.trim(), 10)
  );

  const userId = Number(result.lastInsertRowid);
  const inviteResult = await applyDepartmentInviteToUser(userId, userId, parsed.token);

  return {
    userId,
    email: normalizedEmail,
    name: parsed.name.trim(),
    ...inviteResult,
  };
}

export async function changeOwnPassword(
  currentUser: SessionLikeUser,
  input: { currentPassword: string; newPassword: string; confirmPassword: string }
) {
  assertAuthenticated(currentUser);

  const currentPassword = input.currentPassword.trim();
  const newPassword = input.newPassword.trim();
  const confirmPassword = input.confirmPassword.trim();

  if (!currentPassword) {
    throw new Error('Current password is required.');
  }

  if (newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters long.');
  }

  if (newPassword !== confirmPassword) {
    throw new Error('New password and confirmation do not match.');
  }

  if (newPassword === currentPassword) {
    throw new Error('Choose a different password from your current one.');
  }

  const user = (await firstRow<
    | {
        id: number;
        password_hash: string;
        must_change_password: number;
      }
    >(
      `SELECT id, password_hash, must_change_password
       FROM users
       WHERE id = ?`,
      Number(currentUser.id)
    )) as
    | {
        id: number;
        password_hash: string;
        must_change_password: number;
      }
    | undefined;

  if (!user) {
    throw new Error('User not found.');
  }

  const passwordMatches = bcrypt.compareSync(currentPassword, user.password_hash);
  if (!passwordMatches) {
    throw new Error('Current password is incorrect.');
  }

  const nextPasswordHash = bcrypt.hashSync(newPassword, 10);

  await runStatement(
    `UPDATE users
     SET password_hash = ?, must_change_password = 0, updated_at = datetime('now')
     WHERE id = ?`,
    nextPasswordHash,
    user.id
  );

  await writeAuditLog(Number(currentUser.id), 'update', 'user_password', user.id, {
    mustChangePasswordCleared: fromSqliteBoolean(user.must_change_password),
  });
}

export async function updateOwnProfile(currentUser: SessionLikeUser, input: UpdateOwnProfileInput) {
  assertAuthenticated(currentUser);
  const parsed = updateOwnProfileSchema.parse(input);

  await runStatement(
    `UPDATE users
     SET name = ?, avatar_url = ?, updated_at = datetime('now')
     WHERE id = ?`,
    parsed.name.trim(),
    parsed.avatarUrl || null,
    Number(currentUser.id)
  );

  await writeAuditLog(Number(currentUser.id), 'update', 'user_profile', Number(currentUser.id), {
    name: parsed.name.trim(),
    avatarUrl: parsed.avatarUrl || null,
  });

  return {
    name: parsed.name.trim(),
    avatarUrl: parsed.avatarUrl || null,
  };
}

export async function assignDepartmentMembers(currentUser: SessionLikeUser, input: DepartmentMembershipInput) {
  assertAdmin(currentUser);

  await runStatement('DELETE FROM department_memberships WHERE department_id = ?', input.departmentId);
  for (const userId of input.userIds) {
    await runStatement(
      `INSERT OR IGNORE INTO department_memberships
       (department_id, user_id, role, status, added_directly, requested_at, decided_at, decided_by_user_id)
       VALUES (?, ?, 'member', 'approved', 1, datetime('now'), datetime('now'), ?)`,
      input.departmentId,
      userId,
      Number(currentUser.id)
    );
  }

  for (const userId of input.userIds) {
    await runStatement(
      `UPDATE users
       SET status = 'active', updated_at = datetime('now')
       WHERE id = ?`,
      userId
    );
  }

  await writeAuditLog(Number(currentUser.id), 'update', 'department_membership', input.departmentId, {
    userIds: input.userIds,
  });
}

export async function requestDepartmentAccess(
  currentUser: SessionLikeUser,
  input: DepartmentAccessRequestInput
) {
  assertAuthenticated(currentUser);
  const parsed = departmentAccessRequestSchema.parse(input);

  for (const departmentId of parsed.departmentIds) {
    await runStatement(
      `INSERT INTO department_memberships
       (department_id, user_id, role, status, added_directly, requested_at)
       VALUES (?, ?, 'member', 'pending', 0, datetime('now'))
       ON CONFLICT(department_id, user_id) DO UPDATE SET
         status = 'pending',
         role = 'member',
         added_directly = 0,
         requested_at = datetime('now'),
         decided_at = NULL,
         decided_by_user_id = NULL`,
      departmentId,
      Number(currentUser.id)
    );
  }

  const requester = await firstRow<{ name: string; email: string }>(
    'SELECT name, email FROM users WHERE id = ?',
    Number(currentUser.id)
  );

  await runStatement(
    `UPDATE users
     SET status = CASE
       WHEN EXISTS (
         SELECT 1
         FROM department_memberships
         WHERE user_id = ? AND status = 'approved'
       ) THEN 'active'
       ELSE 'pending'
     END,
     updated_at = datetime('now')
     WHERE id = ?`,
    Number(currentUser.id),
    Number(currentUser.id)
  );

  await writeAuditLog(Number(currentUser.id), 'create', 'department_access_request', Number(currentUser.id), {
    departmentIds: parsed.departmentIds,
  });

  if (requester) {
    for (const departmentId of parsed.departmentIds) {
      const department = await getDepartmentById(departmentId);
      if (!department) {
        continue;
      }

      const recipients = await getApprovalRecipientsForDepartment(departmentId);
      await sendDepartmentAccessRequestNotification({
        requesterName: requester.name,
        requesterEmail: requester.email,
        departmentName: department.name,
        recipients,
      });
    }
  }
}

export async function decideDepartmentMembership(
  currentUser: SessionLikeUser,
  input: DepartmentMembershipDecisionInput
) {
  assertAuthenticated(currentUser);
  const parsed = departmentMembershipDecisionSchema.parse(input);

  const membership = await firstRow<{
    id: number;
    department_id: number;
    user_id: number;
    role: DepartmentMembershipRole;
    status: 'pending' | 'approved' | 'rejected';
  }>(
    `SELECT id, department_id, user_id, role, status
     FROM department_memberships
     WHERE id = ?`,
    parsed.membershipId
  );

  if (!membership) {
    throw new Error('Membership request not found.');
  }

  assertDepartmentAdminAccess(currentUser, membership.department_id);

  await runStatement(
    `UPDATE department_memberships
     SET status = ?,
         role = ?,
         decided_at = datetime('now'),
         decided_by_user_id = ?
     WHERE id = ?`,
    parsed.decision,
    parsed.decision === 'approved' ? parsed.role || 'member' : membership.role,
    Number(currentUser.id),
    parsed.membershipId
  );

  await runStatement(
    `UPDATE users
     SET status = CASE
       WHEN EXISTS (
         SELECT 1
         FROM department_memberships
         WHERE user_id = ? AND status = 'approved'
       ) OR system_role IN ('main_admin', 'chief_admin')
       THEN 'active'
       ELSE 'pending'
     END,
     updated_at = datetime('now')
     WHERE id = ?`,
    membership.user_id,
    membership.user_id
  );

  await writeAuditLog(Number(currentUser.id), 'update', 'department_membership', parsed.membershipId, {
    departmentId: membership.department_id,
    userId: membership.user_id,
    decision: parsed.decision,
    role: parsed.decision === 'approved' ? parsed.role || 'member' : membership.role,
  });

  const [user, department] = await Promise.all([
    firstRow<{ email: string; name: string | null }>('SELECT email, name FROM users WHERE id = ?', membership.user_id),
    getDepartmentById(membership.department_id),
  ]);

  if (user && department) {
    await sendDepartmentMembershipDecisionNotification({
      recipient: user,
      departmentName: department.name,
      decision: parsed.decision,
      assignedRole: parsed.decision === 'approved' ? parsed.role || 'member' : undefined,
    });
  }
}

export async function createDepartmentRecord(
  currentUser: SessionLikeUser,
  input: CreateRecordInput
): Promise<CreateRecordResult> {
  assertDepartmentAccess(currentUser, input.departmentId);
  const parsed = createRecordSchema.parse(input);

  if ((currentUser.role === 'member' || currentUser.role === 'leader') && !currentUser.departmentIds.includes(parsed.departmentId)) {
    throw new Error('You cannot create records for this department.');
  }

  if (currentUser.role === 'member' && Number(currentUser.id) !== parsed.handledByUserId) {
    throw new Error('Members can only submit records for themselves.');
  }

  await assertHandledByMembership(parsed.departmentId, parsed.handledByUserId);

  const fieldDefs = await getDepartmentFieldDefinitions(parsed.departmentId);
  const values = buildRecordValues(fieldDefs, parsed.values);

  const recordResult = await runStatement(
    `INSERT INTO department_records (department_id, record_date, handled_by_user_id, values_json)
     VALUES (?, ?, ?, ?)`,
    parsed.departmentId,
    parsed.recordDate,
    parsed.handledByUserId,
    JSON.stringify(values)
  );
  const recordId = Number(recordResult.lastInsertRowid);

  for (const visitor of parsed.visitors) {
    await runStatement(
      `INSERT INTO record_visitors (record_id, name, contact)
       VALUES (?, ?, ?)`,
      recordId,
      visitor.name,
      visitor.contact || null
    );
  }

  await writeRecordMetrics(recordId, fieldDefs, values);

  await writeAuditLog(Number(currentUser.id), 'create', 'department_record', recordId, {
    departmentId: parsed.departmentId,
    recordDate: parsed.recordDate,
    handledByUserId: parsed.handledByUserId,
    values,
    visitorCount: parsed.visitors.length,
  });

  return {
    recordId,
    whatsappSummary: buildWhatsappSummary(parsed.recordDate, values, parsed.visitors.length),
  };
}

export async function updateDepartmentRecord(
  currentUser: SessionLikeUser,
  input: UpdateRecordInput
): Promise<CreateRecordResult> {
  const parsed = updateRecordSchema.parse(input);
  const existing = await getDepartmentRecordById(currentUser, parsed.recordId);

  assertDepartmentAccess(currentUser, parsed.departmentId);
  if (existing.departmentId !== parsed.departmentId) {
    assertDepartmentAccess(currentUser, existing.departmentId);
  }

  if ((currentUser.role === 'member' || currentUser.role === 'leader') && !currentUser.departmentIds.includes(parsed.departmentId)) {
    throw new Error('You cannot update records for this department.');
  }

  if (currentUser.role === 'member' && Number(currentUser.id) !== parsed.handledByUserId) {
    throw new Error('Members can only submit records for themselves.');
  }

  await assertHandledByMembership(parsed.departmentId, parsed.handledByUserId);

  const fieldDefs = await getDepartmentFieldDefinitions(parsed.departmentId);
  const values = buildRecordValues(fieldDefs, parsed.values);

  await runStatement(
    `UPDATE department_records
     SET department_id = ?, record_date = ?, handled_by_user_id = ?, values_json = ?, updated_at = datetime('now')
     WHERE id = ?`,
    parsed.departmentId,
    parsed.recordDate,
    parsed.handledByUserId,
    JSON.stringify(values),
    parsed.recordId
  );

  await runStatement('DELETE FROM record_visitors WHERE record_id = ?', parsed.recordId);
  for (const visitor of parsed.visitors) {
    await runStatement(
      `INSERT INTO record_visitors (record_id, name, contact)
       VALUES (?, ?, ?)`,
      parsed.recordId,
      visitor.name,
      visitor.contact || null
    );
  }

  await writeRecordMetrics(parsed.recordId, fieldDefs, values);

  await writeAuditLog(Number(currentUser.id), 'update', 'department_record', parsed.recordId, {
    before: {
      departmentId: existing.departmentId,
      recordDate: existing.recordDate,
      handledByUserId: existing.handledByUserId,
      values: existing.values,
      visitors: existing.visitors,
    },
    after: {
      departmentId: parsed.departmentId,
      recordDate: parsed.recordDate,
      handledByUserId: parsed.handledByUserId,
      values,
      visitors: parsed.visitors,
    },
  });

  return {
    recordId: parsed.recordId,
    whatsappSummary: buildWhatsappSummary(parsed.recordDate, values, parsed.visitors.length),
  };
}

export async function deleteDepartmentRecord(currentUser: SessionLikeUser, recordId: number) {
  const existing = await getDepartmentRecordById(currentUser, recordId);

  await runStatement('DELETE FROM department_records WHERE id = ?', recordId);
  await writeAuditLog(Number(currentUser.id), 'delete', 'department_record', recordId, {
    departmentId: existing.departmentId,
    recordDate: existing.recordDate,
    handledByUserId: existing.handledByUserId,
    values: existing.values,
    visitors: existing.visitors,
  });
}

async function createUserNotification(input: {
  userId: number;
  notificationType: string;
  title: string;
  message: string;
  actionUrl?: string | null;
  dedupeKey?: string | null;
}) {
  const result = await runStatement(
    `INSERT OR IGNORE INTO user_notifications
     (user_id, notification_type, title, message, action_url, dedupe_key)
     VALUES (?, ?, ?, ?, ?, ?)`,
    input.userId,
    input.notificationType,
    input.title,
    input.message,
    input.actionUrl || null,
    input.dedupeKey || null
  );

  return result.changes > 0;
}

async function getApprovedDepartmentRecipients(departmentId: number) {
  return allRows<{ id: number; name: string; email: string }>(
    `SELECT users.id, users.name, users.email
     FROM department_memberships
     INNER JOIN users ON users.id = department_memberships.user_id
     WHERE department_memberships.department_id = ?
       AND department_memberships.status = 'approved'
     ORDER BY users.name ASC`,
    departmentId
  );
}

async function getConnectedCalendarRecipientsForDepartment(departmentId: number) {
  return allRows<{
    id: number;
    name: string;
    email: string;
    google_refresh_token: string;
  }>(
    `SELECT users.id, users.name, users.email, calendar_connections.google_refresh_token
     FROM department_memberships
     INNER JOIN users ON users.id = department_memberships.user_id
     INNER JOIN calendar_connections ON calendar_connections.user_id = users.id
     WHERE department_memberships.department_id = ?
       AND department_memberships.status = 'approved'
     ORDER BY users.name ASC`,
    departmentId
  );
}

async function getConnectedCalendarRecipientsByUserIds(userIds: number[]) {
  if (userIds.length === 0) {
    return [] as Array<{
      id: number;
      name: string;
      email: string;
      google_refresh_token: string;
    }>;
  }

  const placeholders = userIds.map(() => '?').join(', ');
  return allRows<{
    id: number;
    name: string;
    email: string;
    google_refresh_token: string;
  }>(
    `SELECT users.id, users.name, users.email, calendar_connections.google_refresh_token
     FROM users
     INNER JOIN calendar_connections ON calendar_connections.user_id = users.id
     WHERE users.id IN (${placeholders})
     ORDER BY users.name ASC`,
    ...userIds
  );
}

async function getStoredCalendarMeetingEvents(meetingId: number) {
  return allRows<{
    user_id: number;
    meeting_id: number;
    calendar_event_id: string;
  }>(
    `SELECT user_id, meeting_id, calendar_event_id
     FROM calendar_meeting_events
     WHERE meeting_id = ?`,
    meetingId
  );
}

async function syncMeetingCalendarEvents(input: {
  meetingId: number;
  departmentId: number | null;
  title: string;
  nextMeetingDate: string | null;
  agenda?: string | null;
  decisions?: string | null;
  attendeeUserIds: number[];
}) {
  const existingMappings = await getStoredCalendarMeetingEvents(input.meetingId);
  const existingByUserId = new Map(existingMappings.map((item) => [item.user_id, item.calendar_event_id]));

  if (!isGoogleCalendarSyncConfigured()) {
    return;
  }

  const recipients =
    input.departmentId !== null
      ? await getConnectedCalendarRecipientsForDepartment(input.departmentId)
      : await getConnectedCalendarRecipientsByUserIds(input.attendeeUserIds);

  const targetUserIds = new Set(recipients.map((recipient) => recipient.id));
  const appBaseUrl = getAppBaseUrl();

  if (!input.nextMeetingDate) {
    for (const recipient of recipients) {
      const existingEventId = existingByUserId.get(recipient.id);
      if (existingEventId) {
        try {
          await deleteGoogleCalendarEvent({
            refreshToken: recipient.google_refresh_token,
            eventId: existingEventId,
          });
        } catch {
          // Local cleanup still proceeds even if Google deletion fails.
        }
      }
    }

    await runStatement('DELETE FROM calendar_meeting_events WHERE meeting_id = ?', input.meetingId);
    return;
  }

  for (const recipient of recipients) {
    try {
      const calendarEventId = await upsertGoogleCalendarEvent({
        refreshToken: recipient.google_refresh_token,
        existingEventId: existingByUserId.get(recipient.id) || null,
        title: input.title,
        nextMeetingDate: input.nextMeetingDate,
        agenda: input.agenda || null,
        decisions: input.decisions || null,
        actionUrl: `${appBaseUrl}/meetings`,
      });

      if (!calendarEventId) {
        continue;
      }

      await runStatement(
        `INSERT INTO calendar_meeting_events (user_id, meeting_id, calendar_event_id, synced_at)
         VALUES (?, ?, ?, datetime('now'))
         ON CONFLICT(user_id, meeting_id) DO UPDATE SET
           calendar_event_id = excluded.calendar_event_id,
           synced_at = datetime('now')`,
        recipient.id,
        input.meetingId,
        calendarEventId
      );
    } catch {
      // Calendar sync failures should not block meeting persistence.
    }
  }

  for (const existingMapping of existingMappings) {
    if (targetUserIds.has(existingMapping.user_id)) {
      continue;
    }

    const recipient = await firstRow<{ google_refresh_token: string }>(
      'SELECT google_refresh_token FROM calendar_connections WHERE user_id = ?',
      existingMapping.user_id
    );

    if (recipient) {
      try {
        await deleteGoogleCalendarEvent({
          refreshToken: recipient.google_refresh_token,
          eventId: existingMapping.calendar_event_id,
        });
      } catch {
        // Local cleanup still proceeds even if Google deletion fails.
      }
    }

    await runStatement(
      'DELETE FROM calendar_meeting_events WHERE user_id = ? AND meeting_id = ?',
      existingMapping.user_id,
      input.meetingId
    );
  }
}

export async function sendDueMeetingReminders(referenceDate = new Date()) {
  const reminderTargetDate = toIsoDate(addHours(referenceDate, getMeetingReminderHours()));
  const meetings = await allRows<{
    id: number;
    department_id: number | null;
    department_name: string | null;
    title: string;
    meeting_date: string;
    next_meeting_date: string | null;
  }>(
    `SELECT
      meetings.id,
      meetings.department_id,
      departments.name AS department_name,
      meetings.title,
      meetings.meeting_date,
      meetings.next_meeting_date
     FROM meetings
     LEFT JOIN departments ON departments.id = meetings.department_id
     WHERE meetings.next_meeting_date = ?`,
    reminderTargetDate
  );

  let notificationsCreated = 0;
  let emailsAttempted = 0;
  const appBaseUrl = getAppBaseUrl();

  for (const meeting of meetings) {
    if (!meeting.department_id || !meeting.next_meeting_date) {
      continue;
    }

    const recipients = await getApprovedDepartmentRecipients(meeting.department_id);
    for (const recipient of recipients) {
      const dedupeKey = `meeting-reminder:${meeting.id}:${recipient.id}:${meeting.next_meeting_date}`;
      const created = await createUserNotification({
        userId: recipient.id,
        notificationType: 'meeting_reminder',
        title: `Upcoming ${meeting.department_name || 'department'} meeting`,
        message: `${meeting.title} has a next meeting date of ${meeting.next_meeting_date}.`,
        actionUrl: `/meetings`,
        dedupeKey,
      });
      if (!created) {
        continue;
      }

      notificationsCreated += 1;

      try {
        await sendMeetingReminderNotification({
          recipient,
          meetingTitle: meeting.title,
          departmentName: meeting.department_name || 'Cross-department',
          meetingDate: meeting.meeting_date,
          nextMeetingDate: meeting.next_meeting_date,
          actionUrl: `${appBaseUrl}/meetings`,
        });
        emailsAttempted += 1;
      } catch {
        // Email delivery should never stop in-app reminders from being stored.
      }
    }

    await writeAuditLog(0, 'send', 'meeting_reminder', meeting.id, {
      nextMeetingDate: meeting.next_meeting_date,
      recipientCount: recipients.length,
      reminderTargetDate,
    });
  }

  return {
    reminderTargetDate,
    meetingsMatched: meetings.length,
    notificationsCreated,
    emailsAttempted,
  };
}

export async function listMeetings(currentUser: SessionLikeUser) {
  const meetings = await mapMeetingRows();
  if (currentUser.role === 'admin') {
    return meetings;
  }

  return meetings.filter((meeting) =>
    meeting.departmentId === null
      ? currentUser.role === 'leader'
      : currentUser.departmentIds.includes(meeting.departmentId)
  );
}

export async function processMeetingMinutes(
  currentUser: SessionLikeUser,
  notes: string
): Promise<MeetingMinutesSuggestion> {
  assertAuthenticated(currentUser);
  const parsed = processMeetingMinutesSchema.parse({ notes });
  return extractMeetingMinutesWithGroq(parsed.notes);
}

export async function getMeetingById(currentUser: SessionLikeUser, meetingId: number) {
  const meeting = (await mapMeetingRows()).find((item) => item.id === meetingId);

  if (!meeting) {
    throw new Error('Meeting not found.');
  }

  if (meeting.departmentId !== null) {
    assertDepartmentAccess(currentUser, meeting.departmentId);
  } else if (currentUser.role === 'member') {
    throw new Error('Members cannot access cross-department meetings.');
  }

  return meeting;
}

export async function createMeeting(currentUser: SessionLikeUser, input: CreateMeetingInput) {
  const parsed = createMeetingSchema.parse(input);
  if (parsed.departmentId) {
    assertDepartmentAccess(currentUser, parsed.departmentId);
  } else {
    assertAuthenticated(currentUser);
    if (currentUser.role === 'member') {
      throw new Error('Members cannot create cross-department meetings.');
    }
  }

  const meetingResult = await runStatement(
    `INSERT INTO meetings
     (department_id, title, meeting_date, agenda, decisions, ai_summary, source_document_r2_key, next_meeting_date, created_by_user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    parsed.departmentId || null,
    parsed.title,
    parsed.meetingDate,
    parsed.agenda || null,
    parsed.decisions || null,
    parsed.aiSummary || null,
    parsed.sourceDocumentR2Key || null,
    parsed.nextMeetingDate || null,
    Number(currentUser.id)
  );
  const meetingId = Number(meetingResult.lastInsertRowid);

  for (const attendeeUserId of parsed.attendeeUserIds) {
    await runStatement(
      'INSERT OR IGNORE INTO meeting_attendees (meeting_id, user_id) VALUES (?, ?)',
      meetingId,
      attendeeUserId
    );
  }

  for (const actionItem of parsed.actionItems) {
    await runStatement(
      `INSERT INTO meeting_action_items (meeting_id, description, owner_user_id, status, due_date)
       VALUES (?, ?, ?, 'open', ?)`,
      meetingId,
      actionItem.description,
      actionItem.ownerUserId || null,
      actionItem.dueDate || null
    );
  }

  await syncMeetingCalendarEvents({
    meetingId,
    departmentId: parsed.departmentId || null,
    title: parsed.title,
    nextMeetingDate: parsed.nextMeetingDate || null,
    agenda: parsed.agenda || null,
    decisions: parsed.decisions || null,
    attendeeUserIds: parsed.attendeeUserIds,
  });

  await writeAuditLog(Number(currentUser.id), 'create', 'meeting', meetingId, parsed);
  return meetingId;
}

export async function updateMeeting(currentUser: SessionLikeUser, input: UpdateMeetingInput) {
  const parsed = updateMeetingSchema.parse(input);
  const existing = await getMeetingById(currentUser, parsed.meetingId);

  if (parsed.departmentId) {
    assertDepartmentAccess(currentUser, parsed.departmentId);
  } else {
    assertAuthenticated(currentUser);
    if (currentUser.role === 'member') {
      throw new Error('Members cannot move meetings to cross-department scope.');
    }
  }

  await runStatement(
    `UPDATE meetings
     SET department_id = ?, title = ?, meeting_date = ?, agenda = ?, decisions = ?, ai_summary = ?, source_document_r2_key = ?, next_meeting_date = ?
     WHERE id = ?`,
    parsed.departmentId || null,
    parsed.title,
    parsed.meetingDate,
    parsed.agenda || null,
    parsed.decisions || null,
    parsed.aiSummary || null,
    parsed.sourceDocumentR2Key || null,
    parsed.nextMeetingDate || null,
    parsed.meetingId
  );

  await runStatement('DELETE FROM meeting_attendees WHERE meeting_id = ?', parsed.meetingId);
  for (const attendeeUserId of parsed.attendeeUserIds) {
    await runStatement(
      'INSERT OR IGNORE INTO meeting_attendees (meeting_id, user_id) VALUES (?, ?)',
      parsed.meetingId,
      attendeeUserId
    );
  }

  const existingActionItems = await allRows<{ id: number }>(
    `SELECT id
     FROM meeting_action_items
     WHERE meeting_id = ?`,
    parsed.meetingId
  );
  const retainedActionItemIds = new Set<number>();

  for (const actionItem of parsed.actionItems) {
    if (actionItem.id) {
      await runStatement(
        `UPDATE meeting_action_items
         SET description = ?, owner_user_id = ?, status = ?, due_date = ?
         WHERE id = ? AND meeting_id = ?`,
        actionItem.description,
        actionItem.ownerUserId || null,
        actionItem.status || 'open',
        actionItem.dueDate || null,
        actionItem.id,
        parsed.meetingId
      );
      retainedActionItemIds.add(actionItem.id);
    } else {
      const result = await runStatement(
        `INSERT INTO meeting_action_items (meeting_id, description, owner_user_id, status, due_date)
         VALUES (?, ?, ?, ?, ?)`,
        parsed.meetingId,
        actionItem.description,
        actionItem.ownerUserId || null,
        actionItem.status || 'open',
        actionItem.dueDate || null
      );
      retainedActionItemIds.add(Number(result.lastInsertRowid));
    }
  }

  for (const existingActionItem of existingActionItems) {
    if (!retainedActionItemIds.has(existingActionItem.id)) {
      await runStatement('DELETE FROM meeting_action_items WHERE id = ?', existingActionItem.id);
    }
  }

  await syncMeetingCalendarEvents({
    meetingId: parsed.meetingId,
    departmentId: parsed.departmentId || null,
    title: parsed.title,
    nextMeetingDate: parsed.nextMeetingDate || null,
    agenda: parsed.agenda || null,
    decisions: parsed.decisions || null,
    attendeeUserIds: parsed.attendeeUserIds,
  });

  await writeAuditLog(Number(currentUser.id), 'update', 'meeting', parsed.meetingId, {
    before: {
      departmentId: existing.departmentId,
      title: existing.title,
      meetingDate: existing.meetingDate,
      agenda: existing.agenda,
      decisions: existing.decisions,
      aiSummary: existing.aiSummary,
      sourceDocumentR2Key: existing.sourceDocumentR2Key,
      nextMeetingDate: existing.nextMeetingDate,
      attendeeUserIds: existing.attendees.map((attendee) => attendee.id),
      actionItems: existing.actionItems.map((item) => ({
        description: item.description,
        ownerUserId: item.ownerUserId,
        dueDate: item.dueDate,
        status: item.status,
      })),
    },
    after: parsed,
  });
  return parsed.meetingId;
}

export async function deleteMeeting(currentUser: SessionLikeUser, meetingId: number) {
  assertAuthenticated(currentUser);

  const existing = (await firstRow<{ id: number; department_id: number | null; title: string }>(
    'SELECT id, department_id, title FROM meetings WHERE id = ?',
    meetingId
  )) as { id: number; department_id: number | null; title: string } | undefined;

  if (!existing) {
    throw new Error('Meeting not found.');
  }

  if (existing.department_id) {
    assertDepartmentAccess(currentUser, existing.department_id);
  } else if (currentUser.role === 'member') {
    throw new Error('Members cannot delete cross-department meetings.');
  }

  const existingMappings = await getStoredCalendarMeetingEvents(meetingId);
  for (const existingMapping of existingMappings) {
    const recipient = await firstRow<{ google_refresh_token: string }>(
      'SELECT google_refresh_token FROM calendar_connections WHERE user_id = ?',
      existingMapping.user_id
    );

    if (recipient) {
      try {
        await deleteGoogleCalendarEvent({
          refreshToken: recipient.google_refresh_token,
          eventId: existingMapping.calendar_event_id,
        });
      } catch {
        // Calendar cleanup should not block meeting deletion.
      }
    }
  }

  await runStatement('DELETE FROM meetings WHERE id = ?', meetingId);
  await writeAuditLog(Number(currentUser.id), 'delete', 'meeting', meetingId, {
    title: existing.title,
    departmentId: existing.department_id,
  });
}

export async function toggleActionItemStatus(currentUser: SessionLikeUser, actionItemId: number) {
  assertAuthenticated(currentUser);
  const existing = (await firstRow<{ id: number; status: 'open' | 'done'; department_id: number | null }>(
    `SELECT
      meeting_action_items.id,
      meeting_action_items.status,
      meetings.department_id
     FROM meeting_action_items
     INNER JOIN meetings ON meetings.id = meeting_action_items.meeting_id
     WHERE meeting_action_items.id = ?`,
    actionItemId
  )) as { id: number; status: 'open' | 'done'; department_id: number | null } | undefined;

  if (!existing) {
    throw new Error('Action item not found.');
  }

  if (existing.department_id) {
    assertDepartmentAccess(currentUser, existing.department_id);
  }

  const nextStatus = existing.status === 'open' ? 'done' : 'open';
  await runStatement('UPDATE meeting_action_items SET status = ? WHERE id = ?', nextStatus, actionItemId);
  await writeAuditLog(Number(currentUser.id), 'update', 'meeting_action_item', actionItemId, { status: nextStatus });
}

export async function registerAttachment(
  currentUser: SessionLikeUser,
  payload: { meetingId?: number | null; recordId?: number | null; r2Key: string; filename: string }
) {
  assertAuthenticated(currentUser);

  if (payload.meetingId) {
    const meeting = (await firstRow<{ department_id: number | null }>(
      'SELECT department_id FROM meetings WHERE id = ?',
      payload.meetingId
    )) as { department_id: number | null } | undefined;
    if (!meeting) {
      throw new Error('Meeting not found.');
    }
    if (meeting.department_id) {
      assertDepartmentAccess(currentUser, meeting.department_id);
    }
  }

  if (payload.recordId) {
    const record = (await firstRow<{ department_id: number }>(
      'SELECT department_id FROM department_records WHERE id = ?',
      payload.recordId
    )) as { department_id: number } | undefined;
    if (!record) {
      throw new Error('Record not found.');
    }

    assertDepartmentAccess(currentUser, record.department_id);
  }

  const result = await runStatement(
    `INSERT INTO attachments (meeting_id, record_id, r2_key, filename, uploaded_by_user_id)
     VALUES (?, ?, ?, ?, ?)`,
    payload.meetingId || null,
    payload.recordId || null,
    payload.r2Key,
    payload.filename,
    Number(currentUser.id)
  );

  const attachmentId = Number(result.lastInsertRowid);
  await writeAuditLog(Number(currentUser.id), 'create', 'attachment', attachmentId, payload);
  return attachmentId;
}

export async function deleteAttachment(currentUser: SessionLikeUser, attachmentId: number) {
  assertAuthenticated(currentUser);

  const existing = (await firstRow<
    | {
        id: number;
        meeting_id: number | null;
        record_id: number | null;
        r2_key: string;
        filename: string;
      }
    >(
      `SELECT id, meeting_id, record_id, r2_key, filename
       FROM attachments
       WHERE id = ?`,
      attachmentId
    )) as
    | {
        id: number;
        meeting_id: number | null;
        record_id: number | null;
        r2_key: string;
        filename: string;
      }
    | undefined;

  if (!existing) {
    throw new Error('Attachment not found.');
  }

  if (existing.meeting_id) {
    const meeting = (await firstRow<{ department_id: number | null }>(
      'SELECT department_id FROM meetings WHERE id = ?',
      existing.meeting_id
    )) as { department_id: number | null } | undefined;

    if (!meeting) {
      throw new Error('Meeting not found.');
    }

    if (meeting.department_id) {
      assertDepartmentAccess(currentUser, meeting.department_id);
    }
  }

  if (existing.record_id) {
    const record = (await firstRow<{ department_id: number }>(
      'SELECT department_id FROM department_records WHERE id = ?',
      existing.record_id
    )) as { department_id: number } | undefined;

    if (!record) {
      throw new Error('Record not found.');
    }

    assertDepartmentAccess(currentUser, record.department_id);
  }

  await deleteAttachmentObject(existing.r2_key);
  await runStatement('DELETE FROM attachments WHERE id = ?', attachmentId);

  await writeAuditLog(Number(currentUser.id), 'delete', 'attachment', attachmentId, {
    meetingId: existing.meeting_id,
    recordId: existing.record_id,
    r2Key: existing.r2_key,
    filename: existing.filename,
  });
}
