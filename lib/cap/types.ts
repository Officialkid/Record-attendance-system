export type GlobalRole = 'admin' | 'leader' | 'member';
export type SystemRole = 'main_admin' | 'chief_admin' | 'none';
export type DepartmentMembershipRole = 'department_admin' | 'member';
export type MembershipStatus = 'pending' | 'approved' | 'rejected';
export type FieldType = 'number' | 'text' | 'date' | 'currency' | 'list';
export type ActionStatus = 'open' | 'done';
export type ReportPeriodType = 'monthly' | 'quarterly' | 'yearly' | 'custom';

export interface Department {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
}

export interface UserRecord {
  id: number;
  name: string;
  email: string;
  role: GlobalRole;
  systemRole: SystemRole;
  status: MembershipStatus | 'active';
  departmentIds: number[];
  departmentRoles: Record<number, DepartmentMembershipRole>;
  avatarUrl: string | null;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentMembership {
  id: number;
  departmentId: number;
  userId: number;
  role: DepartmentMembershipRole;
  status: MembershipStatus;
  addedDirectly: boolean;
  requestedAt: string | null;
  decidedAt: string | null;
  decidedByUserId: number | null;
}

export interface MembershipReviewItem extends DepartmentMembership {
  departmentName: string;
  userName: string;
  userEmail: string;
}

export interface DepartmentInvite {
  id: number;
  departmentId: number;
  departmentName: string;
  role: DepartmentMembershipRole;
  inviteUrl: string | null;
  note: string | null;
  expiresAt: string;
  usedAt: string | null;
  usedByUserId: number | null;
  usedByName: string | null;
  createdAt: string;
  createdByUserId: number | null;
  createdByName: string | null;
}

export interface DepartmentFieldDefinition {
  id: number;
  departmentId: number;
  fieldKey: string;
  label: string;
  fieldType: FieldType;
  displayOrder: number;
  isRequired: boolean;
  createdAt: string;
}

export interface VisitorInput {
  name: string;
  contact?: string;
}

export interface RecordVisitor {
  id?: number;
  name: string;
  contact?: string | null;
}

export interface DepartmentRecord {
  id: number;
  departmentId: number;
  departmentName: string;
  recordDate: string;
  handledByUserId: number;
  handledByName: string;
  values: Record<string, unknown>;
  visitorCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentRecordDetail extends DepartmentRecord {
  visitors: RecordVisitor[];
}

export interface RecordMetricPoint {
  recordId: number;
  fieldKey: string;
  label: string;
  numericValue: number;
  recordDate: string;
}

export interface DashboardSummary {
  departmentCount: number;
  recordCount: number;
  openActionItemCount: number;
  visitorCount: number;
  latestRecords: DepartmentRecord[];
  upcomingMeetings: MeetingSummary[];
}

export interface HandlerSummaryRow {
  handledByUserId: number;
  handledByName: string;
  weeksHandled: number;
  metricTotals: Array<{
    fieldKey: string;
    label: string;
    value: number;
  }>;
  totalVisitors: number;
}

export interface InsightSeries {
  fieldKey: string;
  label: string;
  points: Array<{
    recordId: number;
    recordDate: string;
    value: number;
    anomaly: boolean;
  }>;
}

export interface NetPositionPoint {
  recordId: number;
  recordDate: string;
  weeklyNet: number;
  cumulativeNet: number;
}

export interface InsightsPayload {
  department: Department;
  records: DepartmentRecord[];
  series: InsightSeries[];
  netPositions: NetPositionPoint[];
  hasNetPosition: boolean;
  handlerSummary: HandlerSummaryRow[];
}

export interface GeneratedReportSnapshot {
  departmentId: number;
  departmentName: string;
  periodType: ReportPeriodType;
  periodStart: string;
  periodEnd: string;
  previousPeriodStart: string;
  previousPeriodEnd: string;
  generatedAt: string;
  recordCount: number;
  previousRecordCount: number;
  totalVisitors: number;
  previousTotalVisitors: number;
  totals: Array<{
    fieldKey: string;
    label: string;
    total: number;
    average: number;
    previousTotal: number;
    changePercent: number | null;
  }>;
  anomalyCount: number;
  anomalyFields: string[];
  netPosition:
    | {
        total: number;
        previousTotal: number;
        changePercent: number | null;
      }
    | null;
  handlerSummary: HandlerSummaryRow[];
}

export interface GeneratedReport {
  id: number;
  departmentId: number;
  periodType: ReportPeriodType;
  periodStart: string;
  periodEnd: string;
  summaryText: string;
  dataSnapshot: GeneratedReportSnapshot;
  generatedByUserId: number | null;
  generatedByName: string | null;
  generatedAt: string;
}

export interface MeetingActionItem {
  id: number;
  meetingId: number;
  description: string;
  ownerUserId: number | null;
  ownerName: string | null;
  status: ActionStatus;
  dueDate: string | null;
}

export interface AttachmentRecord {
  id: number;
  meetingId: number | null;
  recordId: number | null;
  r2Key: string;
  filename: string;
  uploadedByUserId: number | null;
  uploadedAt: string;
}

export interface MeetingMinutesSuggestion {
  summary: string;
  decisions: string;
  actionItems: Array<{
    description: string;
    ownerName: string | null;
    dueDate: string | null;
  }>;
}

export interface CalendarConnection {
  userId: number;
  connectedAt: string;
}

export interface UserNotification {
  id: number;
  userId: number;
  notificationType: string;
  title: string;
  message: string;
  actionUrl: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface MeetingSummary {
  id: number;
  departmentId: number | null;
  departmentName: string | null;
  title: string;
  meetingDate: string;
  agenda: string | null;
  decisions: string | null;
  aiSummary: string | null;
  sourceDocumentR2Key: string | null;
  nextMeetingDate: string | null;
  createdByUserId: number;
  createdByName: string;
  createdAt: string;
  attendees: Array<{ id: number; name: string }>;
  actionItems: MeetingActionItem[];
  attachments: AttachmentRecord[];
}

export interface CreateUserInput {
  name: string;
  email: string;
  systemRole: SystemRole;
  departmentIds: number[];
  departmentRole: DepartmentMembershipRole;
}

export interface DepartmentMembershipInput {
  departmentId: number;
  userIds: number[];
}

export interface DepartmentAccessRequestInput {
  departmentIds: number[];
}

export interface PublicUserAccessRequestInput {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  departmentIds: number[];
}

export interface DepartmentMembershipDecisionInput {
  membershipId: number;
  decision: 'approved' | 'rejected';
  role?: DepartmentMembershipRole;
}

export interface CreateDepartmentInviteInput {
  departmentId: number;
  role?: DepartmentMembershipRole;
  note?: string;
  expiresInDays?: number;
}

export interface AcceptDepartmentInviteInput {
  token: string;
}

export interface AcceptDepartmentInviteWithSignupInput extends AcceptDepartmentInviteInput {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface CreateDepartmentInput {
  name: string;
  slug: string;
  description?: string;
}

export interface CreateFieldDefinitionInput {
  departmentId: number;
  fieldKey: string;
  label: string;
  fieldType: FieldType;
  displayOrder: number;
  isRequired: boolean;
}

export interface CreateRecordInput {
  departmentId: number;
  recordDate: string;
  handledByUserId: number;
  values: Record<string, unknown>;
  visitors: VisitorInput[];
}

export interface UpdateRecordInput extends CreateRecordInput {
  recordId: number;
}

export interface CreateMeetingInput {
  departmentId?: number | null;
  title: string;
  meetingDate: string;
  agenda?: string;
  decisions?: string;
  aiSummary?: string;
  sourceDocumentR2Key?: string;
  nextMeetingDate?: string;
  attendeeUserIds: number[];
  actionItems: Array<{
    id?: number;
    description: string;
    ownerUserId?: number | null;
    status?: ActionStatus;
    dueDate?: string;
  }>;
}

export interface UpdateMeetingInput extends CreateMeetingInput {
  meetingId: number;
}

export interface CreateRecordResult {
  recordId: number;
  whatsappSummary: string;
}

export interface GenerateDepartmentReportInput {
  departmentId: number;
  periodType: ReportPeriodType;
  start?: string;
  end?: string;
}

export interface ProcessMeetingMinutesInput {
  notes: string;
}

export interface UpdateOwnProfileInput {
  name: string;
  avatarUrl?: string | null;
}
