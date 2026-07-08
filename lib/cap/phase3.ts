import 'server-only';

import { getDb, type SqlValue } from './db';
import {
  addContributionParticipantSchema,
  addEventMembershipSchema,
  addExpenseCategorySchema,
  addExpenseItemSchema,
  createEventSchema,
  importCampBudgetWorkbookSchema,
  createStandaloneContributionLedgerSchema,
  createStandaloneExpenseLedgerSchema,
  deleteEventSchema,
  endEventSchema,
  recordContributionPaymentSchema,
  setActiveUserContextSchema,
  setEventVisibilitySchema,
  updateEventSchema,
} from './validation';
import type {
  ActiveUserContext,
  AddContributionParticipantInput,
  AddEventMembershipInput,
  AddExpenseCategoryInput,
  AddExpenseItemInput,
  ContributionLedger,
  ContributionParticipant,
  ContributionPayment,
  CreateEventInput,
  CreateStandaloneContributionLedgerInput,
  CreateStandaloneExpenseLedgerInput,
  DepartmentLeadershipSnapshot,
  EventDetail,
  EventLeadershipSnapshot,
  EventListItem,
  EventMembershipSide,
  EventRecord,
  ExpenseCategory,
  ExpenseItem,
  ImportCampBudgetWorkbookInput,
  PaymentStatus,
  RecordContributionPaymentInput,
  SetActiveUserContextInput,
  SetEventVisibilityInput,
  UpdateEventInput,
  UserContextOption,
} from './types';
import { parseCampBudgetWorkbook } from './program-budget-import';

type SessionLikeUser = {
  id: string;
  role: 'admin' | 'leader' | 'member';
  systemRole?: 'main_admin' | 'chief_admin' | 'none';
  departmentIds: number[];
  departmentRoles?: Record<number, 'department_admin' | 'member'>;
};

let programsSchemaPromise: Promise<void> | null = null;

async function ensureProgramsSchema() {
  if (!programsSchemaPromise) {
    programsSchemaPromise = (async () => {
      const db = await getDb();
      await db.exec(`
        CREATE TABLE IF NOT EXISTS events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'active',
          created_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          ended_at TEXT,
          created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS event_memberships (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          side TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'approved',
          joined_at TEXT DEFAULT (datetime('now')),
          left_or_ended_at TEXT,
          remain_visible INTEGER NOT NULL DEFAULT 1,
          UNIQUE (event_id, user_id, side)
        );

        CREATE TABLE IF NOT EXISTS contribution_ledgers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          owner_department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
          event_id INTEGER REFERENCES events(id) ON DELETE SET NULL,
          default_expected_amount REAL NOT NULL,
          status TEXT NOT NULL DEFAULT 'active',
          created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS contribution_participants (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ledger_id INTEGER NOT NULL REFERENCES contribution_ledgers(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          expected_amount REAL NOT NULL,
          created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS contribution_payments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          participant_id INTEGER NOT NULL REFERENCES contribution_participants(id) ON DELETE CASCADE,
          amount REAL NOT NULL,
          payment_date TEXT NOT NULL DEFAULT (date('now')),
          recorded_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS expense_ledgers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          owner_department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
          event_id INTEGER REFERENCES events(id) ON DELETE SET NULL,
          status TEXT NOT NULL DEFAULT 'active',
          created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS expense_categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ledger_id INTEGER NOT NULL REFERENCES expense_ledgers(id) ON DELETE CASCADE,
          name TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS expense_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          category_id INTEGER NOT NULL REFERENCES expense_categories(id) ON DELETE CASCADE,
          description TEXT NOT NULL,
          expected_amount REAL,
          actual_amount REAL,
          paid_by TEXT,
          payment_status TEXT NOT NULL DEFAULT 'paid',
          recorded_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS user_context_state (
          user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          last_context_type TEXT,
          last_context_id INTEGER,
          updated_at TEXT DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_events_department_status
          ON events(department_id, status, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_event_memberships_user_status
          ON event_memberships(user_id, status, remain_visible);
        CREATE INDEX IF NOT EXISTS idx_contribution_ledgers_event
          ON contribution_ledgers(event_id);
        CREATE INDEX IF NOT EXISTS idx_expense_ledgers_event
          ON expense_ledgers(event_id);
      `);
    })().catch((error) => {
      programsSchemaPromise = null;
      throw error;
    });
  }

  await programsSchemaPromise;
}

async function allRows<T>(sql: string, ...params: SqlValue[]) {
  await ensureProgramsSchema();
  const db = await getDb();
  return (await db.prepare(sql).all(...params)) as T[];
}

async function firstRow<T>(sql: string, ...params: SqlValue[]) {
  await ensureProgramsSchema();
  const db = await getDb();
  return (await db.prepare(sql).get(...params)) as T | undefined;
}

async function runStatement(sql: string, ...params: SqlValue[]) {
  await ensureProgramsSchema();
  const db = await getDb();
  return db.prepare(sql).run(...params);
}

function assertAuthenticated(user: SessionLikeUser | null | undefined): asserts user is SessionLikeUser {
  if (!user?.id) {
    throw new Error('You must be signed in to continue.');
  }
}

function isSystemAdmin(user: SessionLikeUser) {
  return user.systemRole === 'main_admin' || user.systemRole === 'chief_admin' || user.role === 'admin';
}

function buildEventHref(eventId: number, side: EventMembershipSide) {
  return `/programs/events/${eventId}?side=${side}`;
}

function encodeEventContextTarget(eventId: number, side: EventMembershipSide) {
  const sideCode = side === 'organizer' ? 1 : side === 'finance' ? 2 : 3;
  return eventId * 10 + sideCode;
}

async function getDepartmentBySlug(slug: string) {
  return firstRow<{ id: number; name: string }>(
    'SELECT id, name FROM departments WHERE slug = ?',
    slug
  );
}

async function getProgramsDepartment() {
  const department = await getDepartmentBySlug('programs');
  if (!department) {
    throw new Error('Programs department is not configured yet.');
  }
  return department;
}

async function getFinanceDepartment() {
  const department = await getDepartmentBySlug('finance');
  if (!department) {
    throw new Error('Finance department is not configured yet.');
  }
  return department;
}

async function getLeadershipDepartment() {
  const department = await getDepartmentBySlug('leadership');
  if (!department) {
    throw new Error('Leadership department is not configured yet.');
  }
  return department;
}

async function hasApprovedDepartmentMembership(userId: number, departmentId: number) {
  const membership = await firstRow<{ role: 'department_admin' | 'member' }>(
    `SELECT role
     FROM department_memberships
     WHERE user_id = ? AND department_id = ? AND status = 'approved'`,
    userId,
    departmentId
  );

  return membership || null;
}

async function assertProgramsAdminAccess(user: SessionLikeUser) {
  assertAuthenticated(user);
  if (isSystemAdmin(user)) {
    return;
  }

  const programs = await getProgramsDepartment();
  const membership = await hasApprovedDepartmentMembership(Number(user.id), programs.id);
  if (membership?.role === 'department_admin') {
    return;
  }

  throw new Error('You do not have Programs admin access.');
}

async function assertFinanceAccess(user: SessionLikeUser) {
  assertAuthenticated(user);
  if (isSystemAdmin(user)) {
    return;
  }

  const finance = await getFinanceDepartment();
  const membership = await hasApprovedDepartmentMembership(Number(user.id), finance.id);
  if (!membership) {
    throw new Error('You do not have Finance access.');
  }
}

async function assertLeadershipAccess(user: SessionLikeUser) {
  assertAuthenticated(user);
  if (isSystemAdmin(user)) {
    return;
  }

  const leadership = await getLeadershipDepartment();
  const membership = await hasApprovedDepartmentMembership(Number(user.id), leadership.id);
  if (!membership) {
    throw new Error('You do not have Leadership access.');
  }
}

async function getStoredContext(userId: number) {
  return firstRow<{
    last_context_type: 'department' | 'event_side' | 'leadership' | null;
    last_context_id: number | null;
  }>(
    `SELECT last_context_type, last_context_id
     FROM user_context_state
     WHERE user_id = ?`,
    userId
  );
}

function mapContributionLedger(row: {
  id: number;
  name: string;
  owner_department_id: number | null;
  event_id: number | null;
  default_expected_amount: number;
  status: 'active' | 'closed';
  created_at: string;
}): ContributionLedger {
  return {
    id: row.id,
    name: row.name,
    ownerDepartmentId: row.owner_department_id,
    eventId: row.event_id,
    defaultExpectedAmount: row.default_expected_amount,
    status: row.status,
    createdAt: row.created_at,
  };
}

function mapEvent(row: {
  id: number;
  department_id: number;
  name: string;
  status: 'active' | 'ended';
  created_by_user_id: number;
  ended_at: string | null;
  created_at: string;
}): EventRecord {
  return {
    id: row.id,
    departmentId: row.department_id,
    name: row.name,
    status: row.status,
    createdByUserId: row.created_by_user_id,
    endedAt: row.ended_at,
    createdAt: row.created_at,
  };
}

function normalizeEventSide(side: string | null | undefined): EventMembershipSide {
  if (side === 'organizer' || side === 'finance' || side === 'admin') {
    return side;
  }
  return 'admin';
}

async function getEventMembershipSides(userId: number, eventId: number) {
  const rows = await allRows<{ side: EventMembershipSide }>(
    `SELECT side
     FROM event_memberships
     WHERE user_id = ?
       AND event_id = ?
       AND status = 'approved'
       AND (remain_visible = 1 OR left_or_ended_at IS NULL)`,
    userId,
    eventId
  );

  return rows.map((row) => row.side);
}

async function resolveEventAccess(user: SessionLikeUser, eventId: number, requestedSide?: string | null) {
  assertAuthenticated(user);
  const eventRow = await firstRow<{
    id: number;
    department_id: number;
    name: string;
    status: 'active' | 'ended';
    created_by_user_id: number;
    ended_at: string | null;
    created_at: string;
  }>(
    `SELECT id, department_id, name, status, created_by_user_id, ended_at, created_at
     FROM events
     WHERE id = ?`,
    eventId
  );

  if (!eventRow) {
    throw new Error('Event not found.');
  }

  const event = mapEvent(eventRow);
  let sides = await getEventMembershipSides(Number(user.id), eventId);

  if (isSystemAdmin(user)) {
    sides = Array.from(new Set<EventMembershipSide>(['admin', 'organizer', 'finance', ...sides]));
  } else {
    const programs = await getProgramsDepartment();
    const programsMembership = await hasApprovedDepartmentMembership(Number(user.id), programs.id);
    if (programsMembership?.role === 'department_admin') {
      sides = Array.from(new Set<EventMembershipSide>(['admin', 'organizer', 'finance', ...sides]));
    }
  }

  if (sides.length === 0) {
    throw new Error('You do not have access to this event.');
  }

  const activeSide =
    requestedSide && sides.includes(requestedSide as EventMembershipSide)
      ? (requestedSide as EventMembershipSide)
      : sides.includes('admin')
        ? 'admin'
        : sides[0];

  return {
    event,
    sides,
    activeSide,
    canManageEvent: sides.includes('admin'),
    canViewReconciliation: sides.includes('admin') || sides.includes('finance'),
  };
}

async function assertLedgerActiveByEvent(eventId: number, table: 'contribution_ledgers' | 'expense_ledgers') {
  const ledger = await firstRow<{ status: 'active' | 'closed' }>(
    `SELECT status FROM ${table} WHERE event_id = ?`,
    eventId
  );
  if (ledger?.status === 'closed') {
    throw new Error('This event has ended, so its ledger is closed to further edits.');
  }
}

async function createEventWithLedgers(
  user: SessionLikeUser,
  input: { name: string; defaultExpectedAmount: number }
) {
  const programs = await getProgramsDepartment();

  const eventResult = await runStatement(
    `INSERT INTO events (department_id, name, created_by_user_id)
     VALUES (?, ?, ?)`,
    programs.id,
    input.name,
    Number(user.id)
  );
  const eventId = Number(eventResult.lastInsertRowid);

  await runStatement(
    `INSERT OR IGNORE INTO event_memberships
     (event_id, user_id, side, status, joined_at)
     VALUES (?, ?, 'admin', 'approved', datetime('now'))`,
    eventId,
    Number(user.id)
  );

  const contributionLedgerResult = await runStatement(
    `INSERT INTO contribution_ledgers
     (name, owner_department_id, event_id, default_expected_amount, status)
     VALUES (?, ?, ?, ?, 'active')`,
    `${input.name} - Contributions`,
    programs.id,
    eventId,
    input.defaultExpectedAmount
  );

  const expenseLedgerResult = await runStatement(
    `INSERT INTO expense_ledgers
     (name, owner_department_id, event_id, status)
     VALUES (?, ?, ?, 'active')`,
    `${input.name} - Expenses`,
    programs.id,
    eventId
  );

  return {
    eventId,
    contributionLedgerId: Number(contributionLedgerResult.lastInsertRowid),
    expenseLedgerId: Number(expenseLedgerResult.lastInsertRowid),
  };
}

export async function listUserContextOptions(user: SessionLikeUser): Promise<UserContextOption[]> {
  assertAuthenticated(user);
  const stored = await getStoredContext(Number(user.id));
  const activeKey = stored?.last_context_type && stored.last_context_id
    ? `${stored.last_context_type}:${stored.last_context_id}`
    : null;

  const departmentRows = isSystemAdmin(user)
    ? await allRows<{ id: number; name: string }>('SELECT id, name FROM departments ORDER BY name ASC')
    : await allRows<{ id: number; name: string }>(
        `SELECT departments.id, departments.name
         FROM departments
         INNER JOIN department_memberships ON department_memberships.department_id = departments.id
         WHERE department_memberships.user_id = ?
           AND department_memberships.status = 'approved'
         ORDER BY departments.name ASC`,
        Number(user.id)
      );

  const eventRows = await allRows<{
    event_id: number;
    event_name: string;
    side: EventMembershipSide;
  }>(
    `SELECT events.id AS event_id, events.name AS event_name, event_memberships.side
     FROM event_memberships
     INNER JOIN events ON events.id = event_memberships.event_id
     WHERE event_memberships.user_id = ?
       AND event_memberships.status = 'approved'
       AND (event_memberships.remain_visible = 1 OR events.status = 'active')
     ORDER BY events.created_at DESC, event_memberships.side ASC`,
    Number(user.id)
  );

  const eventOptions = eventRows.map((row) => ({
    key: `event_side:${encodeEventContextTarget(row.event_id, row.side)}`,
    label: `${row.event_name} - ${row.side === 'admin' ? 'Admin' : row.side === 'organizer' ? 'Organizer' : 'Finance'}`,
    description: row.side === 'admin' ? 'Full event visibility' : `Programs event ${row.side} workspace`,
    departmentLabel: 'Programs',
    contextType: 'event_side' as const,
    targetId: encodeEventContextTarget(row.event_id, row.side),
    href: buildEventHref(row.event_id, row.side),
    isActive: activeKey === `event_side:${encodeEventContextTarget(row.event_id, row.side)}`,
  }));

  const departmentOptions = departmentRows.map((row) => {
    const contextType = row.name === 'Leadership' ? 'leadership' : 'department';
    const href = row.name === 'Leadership' ? '/leadership' : '/dashboard';
    const key = `${contextType}:${row.id}`;

    return {
      key,
      label: row.name,
      description:
        row.name === 'Leadership'
          ? 'Cross-platform reporting visibility'
          : `Department workspace for ${row.name}`,
      departmentLabel: row.name === 'Leadership' ? 'Leadership' : row.name,
      contextType,
      targetId: row.id,
      href,
      isActive: activeKey === key || (!activeKey && href === '/dashboard' && row.name !== 'Leadership'),
    } as UserContextOption;
  });

  return [...departmentOptions, ...eventOptions];
}

export async function getActiveUserContext(user: SessionLikeUser): Promise<ActiveUserContext> {
  const options = await listUserContextOptions(user);
  const active = options.find((option) => option.isActive) || options[0];

  if (!active) {
    return {
      contextType: 'department',
      targetId: null,
      label: 'Workspace',
      href: '/dashboard',
    };
  }

  return {
    contextType: active.contextType,
    targetId: active.targetId,
    label: active.label,
    href: active.href,
  };
}

export async function setActiveUserContext(user: SessionLikeUser, input: SetActiveUserContextInput) {
  assertAuthenticated(user);
  const parsed = setActiveUserContextSchema.parse(input);
  const options = await listUserContextOptions(user);
  const isAllowed = options.some(
    (option) => option.contextType === parsed.contextType && option.targetId === parsed.targetId
  );

  if (!isAllowed) {
    throw new Error('You cannot switch into that context.');
  }

  await runStatement(
    `INSERT INTO user_context_state (user_id, last_context_type, last_context_id, updated_at)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(user_id) DO UPDATE SET
       last_context_type = excluded.last_context_type,
       last_context_id = excluded.last_context_id,
       updated_at = datetime('now')`,
    Number(user.id),
    parsed.contextType,
    parsed.targetId
  );
}

export async function listProgramEventsForUser(user: SessionLikeUser): Promise<EventListItem[]> {
  assertAuthenticated(user);
  const rows = isSystemAdmin(user)
    ? await allRows<{
        id: number;
        department_id: number;
        name: string;
        status: 'active' | 'ended';
        created_by_user_id: number;
        ended_at: string | null;
        created_at: string;
      }>(
        `SELECT id, department_id, name, status, created_by_user_id, ended_at, created_at
         FROM events
         ORDER BY created_at DESC`
      )
    : await allRows<{
        id: number;
        department_id: number;
        name: string;
        status: 'active' | 'ended';
        created_by_user_id: number;
        ended_at: string | null;
        created_at: string;
      }>(
        `SELECT DISTINCT events.id, events.department_id, events.name, events.status, events.created_by_user_id, events.ended_at, events.created_at
         FROM events
         LEFT JOIN event_memberships ON event_memberships.event_id = events.id
         LEFT JOIN department_memberships ON department_memberships.department_id = events.department_id
         WHERE (event_memberships.user_id = ?
            AND event_memberships.status = 'approved'
            AND (event_memberships.remain_visible = 1 OR events.status = 'active'))
            OR (department_memberships.user_id = ?
            AND department_memberships.status = 'approved'
            AND department_memberships.role = 'department_admin')
         ORDER BY events.created_at DESC`,
        Number(user.id),
        Number(user.id)
      );

  const items: EventListItem[] = [];
  for (const row of rows) {
    const sides = await getEventMembershipSides(Number(user.id), row.id);
    const contributionLedger = await firstRow<{ status: 'active' | 'closed' }>(
      'SELECT status FROM contribution_ledgers WHERE event_id = ?',
      row.id
    );
    const expenseLedger = await firstRow<{ status: 'active' | 'closed' }>(
      'SELECT status FROM expense_ledgers WHERE event_id = ?',
      row.id
    );
    const contributionTotals = await firstRow<{
      total_collected: number | null;
      participant_count: number | null;
    }>(
      `SELECT
        COALESCE(SUM(contribution_payments.amount), 0) AS total_collected,
        COUNT(DISTINCT contribution_participants.id) AS participant_count
       FROM contribution_ledgers
       LEFT JOIN contribution_participants ON contribution_participants.ledger_id = contribution_ledgers.id
       LEFT JOIN contribution_payments ON contribution_payments.participant_id = contribution_participants.id
       WHERE contribution_ledgers.event_id = ?`,
      row.id
    );
    const expenseTotals = await firstRow<{
      total_spent: number | null;
      expense_item_count: number | null;
    }>(
      `SELECT
        COALESCE(SUM(COALESCE(expense_items.actual_amount, 0)), 0) AS total_spent,
        COUNT(DISTINCT expense_items.id) AS expense_item_count
       FROM expense_ledgers
       LEFT JOIN expense_categories ON expense_categories.ledger_id = expense_ledgers.id
       LEFT JOIN expense_items ON expense_items.category_id = expense_categories.id
       WHERE expense_ledgers.event_id = ?`,
      row.id
    );
    const totalCollected = contributionTotals?.total_collected || 0;
    const totalSpent = expenseTotals?.total_spent || 0;

    items.push({
      ...mapEvent(row),
      userSides: isSystemAdmin(user) ? ['admin', 'organizer', 'finance'] : sides,
      contributionLedgerStatus: contributionLedger?.status || null,
      expenseLedgerStatus: expenseLedger?.status || null,
      totalCollected,
      totalSpent,
      balanceRetained: totalCollected - totalSpent,
      participantCount: contributionTotals?.participant_count || 0,
      expenseItemCount: expenseTotals?.expense_item_count || 0,
    });
  }

  return items;
}

export async function createEvent(user: SessionLikeUser, input: CreateEventInput) {
  await assertProgramsAdminAccess(user);
  const parsed = createEventSchema.parse(input);
  const result = await createEventWithLedgers(user, parsed);
  return result.eventId;
}

export async function importCampBudgetWorkbook(
  user: SessionLikeUser,
  input: ImportCampBudgetWorkbookInput & { workbook: File }
) {
  await assertProgramsAdminAccess(user);
  const parsed = importCampBudgetWorkbookSchema.parse(input);

  const existingEvent = await firstRow<{ id: number }>(
    'SELECT id FROM events WHERE lower(name) = lower(?)',
    parsed.name
  );
  if (existingEvent) {
    throw new Error(`An event named "${parsed.name}" already exists. Choose a different event name first.`);
  }

  const workbookBuffer = Buffer.from(await input.workbook.arrayBuffer());
  const importedBudget = await parseCampBudgetWorkbook(workbookBuffer, parsed.sheetPrefix);
  const { eventId, expenseLedgerId } = await createEventWithLedgers(user, parsed);

  const categoryIds = new Map<string, number>();
  for (const categoryName of importedBudget.categories) {
    const result = await runStatement(
      `INSERT INTO expense_categories (ledger_id, name)
       VALUES (?, ?)`,
      expenseLedgerId,
      categoryName
    );
    categoryIds.set(categoryName, Number(result.lastInsertRowid));
  }

  for (const item of importedBudget.items) {
    const categoryId = categoryIds.get(item.categoryName);
    if (!categoryId) {
      continue;
    }

    await runStatement(
      `INSERT INTO expense_items
       (category_id, description, expected_amount, actual_amount, paid_by, payment_status, recorded_by_user_id)
       VALUES (?, ?, ?, ?, ?, 'paid', ?)`,
      categoryId,
      item.description,
      item.expectedAmount,
      item.actualAmount,
      `${parsed.sheetPrefix} workbook import`,
      Number(user.id)
    );
  }

  return {
    eventId,
    importedItemCount: importedBudget.items.length,
    importedCategoryCount: importedBudget.categories.length,
    expectedTotal: importedBudget.expectedTotal,
    actualTotal: importedBudget.actualTotal,
  };
}

export async function createStandaloneContributionLedger(
  user: SessionLikeUser,
  input: CreateStandaloneContributionLedgerInput
) {
  await assertFinanceAccess(user);
  const parsed = createStandaloneContributionLedgerSchema.parse(input);
  const finance = await getFinanceDepartment();
  const result = await runStatement(
    `INSERT INTO contribution_ledgers
     (name, owner_department_id, event_id, default_expected_amount, status)
     VALUES (?, ?, NULL, ?, 'active')`,
    parsed.name,
    finance.id,
    parsed.defaultExpectedAmount
  );
  return Number(result.lastInsertRowid);
}

export async function createStandaloneExpenseLedger(
  user: SessionLikeUser,
  input: CreateStandaloneExpenseLedgerInput
) {
  await assertFinanceAccess(user);
  const parsed = createStandaloneExpenseLedgerSchema.parse(input);
  const finance = await getFinanceDepartment();
  const result = await runStatement(
    `INSERT INTO expense_ledgers
     (name, owner_department_id, event_id, status)
     VALUES (?, ?, NULL, 'active')`,
    parsed.name,
    finance.id
  );
  return Number(result.lastInsertRowid);
}

export async function listStandaloneFinanceLedgers(user: SessionLikeUser) {
  await assertFinanceAccess(user);
  const contributionLedgers = await allRows<{
    id: number;
    name: string;
    owner_department_id: number | null;
    event_id: number | null;
    default_expected_amount: number;
    status: 'active' | 'closed';
    created_at: string;
  }>(
    `SELECT id, name, owner_department_id, event_id, default_expected_amount, status, created_at
     FROM contribution_ledgers
     WHERE event_id IS NULL
     ORDER BY created_at DESC`
  );

  const expenseLedgers = await allRows<{
    id: number;
    name: string;
    owner_department_id: number | null;
    event_id: number | null;
    status: 'active' | 'closed';
    created_at: string;
  }>(
    `SELECT id, name, owner_department_id, event_id, status, created_at
     FROM expense_ledgers
     WHERE event_id IS NULL
     ORDER BY created_at DESC`
  );

  return {
    contributionLedgers: contributionLedgers.map(mapContributionLedger),
    expenseLedgers: expenseLedgers.map((row) => ({
      id: row.id,
      name: row.name,
      ownerDepartmentId: row.owner_department_id,
      eventId: row.event_id,
      status: row.status,
      createdAt: row.created_at,
    })),
  };
}

export async function addEventMembership(user: SessionLikeUser, input: AddEventMembershipInput) {
  await assertProgramsAdminAccess(user);
  const parsed = addEventMembershipSchema.parse(input);

  await runStatement(
    `INSERT INTO event_memberships
     (event_id, user_id, side, status, joined_at, remain_visible)
     VALUES (?, ?, ?, 'approved', datetime('now'), 1)
     ON CONFLICT(event_id, user_id, side) DO UPDATE SET
       status = 'approved',
       left_or_ended_at = NULL,
       remain_visible = 1`,
    parsed.eventId,
    parsed.userId,
    parsed.side
  );
}

export async function getEventDetail(
  user: SessionLikeUser,
  eventId: number,
  requestedSide?: string | null
): Promise<EventDetail> {
  const access = await resolveEventAccess(user, eventId, requestedSide);

  const contributionLedgerRow = await firstRow<{
    id: number;
    name: string;
    owner_department_id: number | null;
    event_id: number | null;
    default_expected_amount: number;
    status: 'active' | 'closed';
    created_at: string;
  }>(
    `SELECT id, name, owner_department_id, event_id, default_expected_amount, status, created_at
     FROM contribution_ledgers
     WHERE event_id = ?`,
    eventId
  );
  const expenseLedgerRow = await firstRow<{
    id: number;
    name: string;
    owner_department_id: number | null;
    event_id: number | null;
    status: 'active' | 'closed';
    created_at: string;
  }>(
    `SELECT id, name, owner_department_id, event_id, status, created_at
     FROM expense_ledgers
     WHERE event_id = ?`,
    eventId
  );

  const participants = contributionLedgerRow
    ? await allRows<{
        id: number;
        ledger_id: number;
        name: string;
        expected_amount: number;
        amount_paid: number | null;
        created_at: string;
      }>(
        `SELECT
          contribution_participants.id,
          contribution_participants.ledger_id,
          contribution_participants.name,
          contribution_participants.expected_amount,
          COALESCE(SUM(contribution_payments.amount), 0) AS amount_paid,
          contribution_participants.created_at
         FROM contribution_participants
         LEFT JOIN contribution_payments
           ON contribution_payments.participant_id = contribution_participants.id
         WHERE contribution_participants.ledger_id = ?
         GROUP BY contribution_participants.id
         ORDER BY contribution_participants.created_at ASC, contribution_participants.id ASC`,
        contributionLedgerRow.id
      )
    : [];

  const payments = contributionLedgerRow
    ? await allRows<{
        id: number;
        participant_id: number;
        amount: number;
        payment_date: string;
        recorded_by_user_id: number;
        recorded_by_name: string;
        created_at: string;
      }>(
        `SELECT
          contribution_payments.id,
          contribution_payments.participant_id,
          contribution_payments.amount,
          contribution_payments.payment_date,
          contribution_payments.recorded_by_user_id,
          users.name AS recorded_by_name,
          contribution_payments.created_at
         FROM contribution_payments
         INNER JOIN users ON users.id = contribution_payments.recorded_by_user_id
         INNER JOIN contribution_participants
           ON contribution_participants.id = contribution_payments.participant_id
         WHERE contribution_participants.ledger_id = ?
         ORDER BY contribution_payments.payment_date DESC, contribution_payments.id DESC`,
        contributionLedgerRow.id
      )
    : [];

  const categories = expenseLedgerRow
    ? await allRows<{ id: number; ledger_id: number; name: string }>(
        `SELECT id, ledger_id, name
         FROM expense_categories
         WHERE ledger_id = ?
         ORDER BY name ASC`,
        expenseLedgerRow.id
      )
    : [];

  const expenseItems = expenseLedgerRow
    ? await allRows<{
        id: number;
        category_id: number;
        description: string;
        expected_amount: number | null;
        actual_amount: number | null;
        paid_by: string | null;
        payment_status: PaymentStatus;
        recorded_by_user_id: number;
        recorded_by_name: string;
        created_at: string;
      }>(
        `SELECT
          expense_items.id,
          expense_items.category_id,
          expense_items.description,
          expense_items.expected_amount,
          expense_items.actual_amount,
          expense_items.paid_by,
          expense_items.payment_status,
          expense_items.recorded_by_user_id,
          users.name AS recorded_by_name,
          expense_items.created_at
         FROM expense_items
         INNER JOIN users ON users.id = expense_items.recorded_by_user_id
         INNER JOIN expense_categories ON expense_categories.id = expense_items.category_id
         WHERE expense_categories.ledger_id = ?
         ORDER BY expense_items.created_at DESC, expense_items.id DESC`,
        expenseLedgerRow.id
      )
    : [];

  const totalCollected = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalSpent = expenseItems.reduce((sum, item) => sum + (item.actual_amount || 0), 0);

  const mappedParticipants: ContributionParticipant[] = participants.map((row) => {
    const amountPaid = row.amount_paid || 0;
    const balance = row.expected_amount - amountPaid;
    return {
      id: row.id,
      ledgerId: row.ledger_id,
      name: row.name,
      expectedAmount: row.expected_amount,
      amountPaid,
      balance,
      paidInFull: balance <= 0,
      createdAt: row.created_at,
    };
  });

  return {
    event: access.event,
    activeSide: access.activeSide,
    canManageEvent: access.canManageEvent,
    canViewReconciliation: access.canViewReconciliation,
    contributionLedger: contributionLedgerRow ? mapContributionLedger(contributionLedgerRow) : null,
    expenseLedger: expenseLedgerRow
      ? {
          id: expenseLedgerRow.id,
          name: expenseLedgerRow.name,
          ownerDepartmentId: expenseLedgerRow.owner_department_id,
          eventId: expenseLedgerRow.event_id,
          status: expenseLedgerRow.status,
          createdAt: expenseLedgerRow.created_at,
        }
      : null,
    participants: mappedParticipants,
    payments: payments.map((row) => ({
      id: row.id,
      participantId: row.participant_id,
      amount: row.amount,
      paymentDate: row.payment_date,
      recordedByUserId: row.recorded_by_user_id,
      recordedByName: row.recorded_by_name,
      createdAt: row.created_at,
    })),
    categories: categories.map((row) => ({
      id: row.id,
      ledgerId: row.ledger_id,
      name: row.name,
    })),
    expenseItems: expenseItems.map((row) => ({
      id: row.id,
      categoryId: row.category_id,
      description: row.description,
      expectedAmount: row.expected_amount,
      actualAmount: row.actual_amount,
      variance:
        row.expected_amount === null || row.actual_amount === null
          ? null
          : row.actual_amount - row.expected_amount,
      paidBy: row.paid_by,
      paymentStatus: row.payment_status,
      recordedByUserId: row.recorded_by_user_id,
      recordedByName: row.recorded_by_name,
      createdAt: row.created_at,
    })),
    financialSummary: access.canViewReconciliation
      ? {
          totalCollected,
          totalSpent,
          balanceRetained: totalCollected - totalSpent,
        }
      : null,
  };
}

export async function addContributionParticipant(user: SessionLikeUser, input: AddContributionParticipantInput) {
  assertAuthenticated(user);
  const parsed = addContributionParticipantSchema.parse(input);
  const ledger = await firstRow<{
    id: number;
    event_id: number | null;
    default_expected_amount: number;
  }>(
    `SELECT id, event_id, default_expected_amount
     FROM contribution_ledgers
     WHERE id = ?`,
    parsed.ledgerId
  );

  if (!ledger) {
    throw new Error('Contribution ledger not found.');
  }

  if (ledger.event_id) {
    const access = await resolveEventAccess(user, ledger.event_id);
    if (!access.sides.includes('organizer') && !access.sides.includes('admin')) {
      throw new Error('Only organizer-side or admin event members can add participants.');
    }
    await assertLedgerActiveByEvent(ledger.event_id, 'contribution_ledgers');
  } else {
    await assertFinanceAccess(user);
  }

  const result = await runStatement(
    `INSERT INTO contribution_participants (ledger_id, name, expected_amount)
     VALUES (?, ?, ?)`,
    parsed.ledgerId,
    parsed.name,
    parsed.expectedAmount ?? ledger.default_expected_amount
  );

  return Number(result.lastInsertRowid);
}

export async function recordContributionPayment(
  user: SessionLikeUser,
  input: RecordContributionPaymentInput
) {
  assertAuthenticated(user);
  const parsed = recordContributionPaymentSchema.parse(input);
  const participant = await firstRow<{
    id: number;
    event_id: number | null;
  }>(
    `SELECT contribution_participants.id, contribution_ledgers.event_id
     FROM contribution_participants
     INNER JOIN contribution_ledgers ON contribution_ledgers.id = contribution_participants.ledger_id
     WHERE contribution_participants.id = ?`,
    parsed.participantId
  );

  if (!participant) {
    throw new Error('Participant not found.');
  }

  if (participant.event_id) {
    const access = await resolveEventAccess(user, participant.event_id);
    if (!access.sides.includes('organizer') && !access.sides.includes('admin')) {
      throw new Error('Only organizer-side or admin event members can record payments.');
    }
    await assertLedgerActiveByEvent(participant.event_id, 'contribution_ledgers');
  } else {
    await assertFinanceAccess(user);
  }

  const result = await runStatement(
    `INSERT INTO contribution_payments
     (participant_id, amount, payment_date, recorded_by_user_id)
     VALUES (?, ?, ?, ?)`,
    parsed.participantId,
    parsed.amount,
    parsed.paymentDate || new Date().toISOString().slice(0, 10),
    Number(user.id)
  );

  return Number(result.lastInsertRowid);
}

export async function addExpenseCategory(user: SessionLikeUser, input: AddExpenseCategoryInput) {
  assertAuthenticated(user);
  const parsed = addExpenseCategorySchema.parse(input);
  const ledger = await firstRow<{ event_id: number | null }>(
    'SELECT event_id FROM expense_ledgers WHERE id = ?',
    parsed.ledgerId
  );

  if (!ledger) {
    throw new Error('Expense ledger not found.');
  }

  if (ledger.event_id) {
    const access = await resolveEventAccess(user, ledger.event_id);
    if (!access.sides.includes('finance') && !access.sides.includes('admin')) {
      throw new Error('Only finance-side or admin event members can add categories.');
    }
    await assertLedgerActiveByEvent(ledger.event_id, 'expense_ledgers');
  } else {
    await assertFinanceAccess(user);
  }

  const result = await runStatement(
    `INSERT INTO expense_categories (ledger_id, name)
     VALUES (?, ?)`,
    parsed.ledgerId,
    parsed.name
  );

  return Number(result.lastInsertRowid);
}

export async function addExpenseItem(user: SessionLikeUser, input: AddExpenseItemInput) {
  assertAuthenticated(user);
  const parsed = addExpenseItemSchema.parse(input);
  const category = await firstRow<{ event_id: number | null }>(
    `SELECT expense_ledgers.event_id
     FROM expense_categories
     INNER JOIN expense_ledgers ON expense_ledgers.id = expense_categories.ledger_id
     WHERE expense_categories.id = ?`,
    parsed.categoryId
  );

  if (!category) {
    throw new Error('Expense category not found.');
  }

  if (category.event_id) {
    const access = await resolveEventAccess(user, category.event_id);
    if (!access.sides.includes('finance') && !access.sides.includes('admin')) {
      throw new Error('Only finance-side or admin event members can log expenses.');
    }
    await assertLedgerActiveByEvent(category.event_id, 'expense_ledgers');
  } else {
    await assertFinanceAccess(user);
  }

  const normalizedDescription = parsed.description?.trim() || 'Planned expense item';

  const result = await runStatement(
    `INSERT INTO expense_items
     (category_id, description, expected_amount, actual_amount, paid_by, payment_status, recorded_by_user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    parsed.categoryId,
    normalizedDescription,
    parsed.expectedAmount ?? null,
    parsed.actualAmount ?? null,
    parsed.paidBy || null,
    parsed.paymentStatus,
    Number(user.id)
  );

  return Number(result.lastInsertRowid);
}

export async function endEvent(user: SessionLikeUser, eventId: number) {
  assertAuthenticated(user);
  const parsed = endEventSchema.parse({ eventId });
  const access = await resolveEventAccess(user, parsed.eventId);

  if (!access.canManageEvent) {
    throw new Error('Only event admins can end this event.');
  }

  await runStatement(
    `UPDATE events
     SET status = 'ended', ended_at = datetime('now')
     WHERE id = ?`,
    parsed.eventId
  );
  await runStatement(`UPDATE contribution_ledgers SET status = 'closed' WHERE event_id = ?`, parsed.eventId);
  await runStatement(`UPDATE expense_ledgers SET status = 'closed' WHERE event_id = ?`, parsed.eventId);
  await runStatement(
    `UPDATE event_memberships
     SET left_or_ended_at = COALESCE(left_or_ended_at, datetime('now'))
     WHERE event_id = ?`,
    parsed.eventId
  );
}

export async function updateEvent(user: SessionLikeUser, input: UpdateEventInput) {
  assertAuthenticated(user);
  const parsed = updateEventSchema.parse(input);
  const access = await resolveEventAccess(user, parsed.eventId);

  if (!access.canManageEvent) {
    throw new Error('Only event admins can update this event.');
  }

  const endedAt =
    parsed.status === 'ended'
      ? parsed.endedAt || access.event.endedAt || new Date().toISOString().slice(0, 10)
      : null;

  await runStatement(
    `UPDATE events
     SET name = ?, status = ?, ended_at = ?
     WHERE id = ?`,
    parsed.name,
    parsed.status,
    endedAt,
    parsed.eventId
  );

  const ledgerStatus = parsed.status === 'ended' ? 'closed' : 'active';
  await runStatement(`UPDATE contribution_ledgers SET status = ? WHERE event_id = ?`, ledgerStatus, parsed.eventId);
  await runStatement(`UPDATE expense_ledgers SET status = ? WHERE event_id = ?`, ledgerStatus, parsed.eventId);

  if (parsed.status === 'active') {
    await runStatement(
      `UPDATE event_memberships
       SET left_or_ended_at = NULL
       WHERE event_id = ?`,
      parsed.eventId
    );
  } else {
    await runStatement(
      `UPDATE event_memberships
       SET left_or_ended_at = COALESCE(left_or_ended_at, ?)
       WHERE event_id = ?`,
      endedAt,
      parsed.eventId
    );
  }
}

export async function deleteEvent(user: SessionLikeUser, eventId: number) {
  assertAuthenticated(user);
  const parsed = deleteEventSchema.parse({ eventId });
  const access = await resolveEventAccess(user, parsed.eventId);

  if (!access.canManageEvent) {
    throw new Error('Only event admins can delete this event.');
  }

  const event = await firstRow<{ id: number }>('SELECT id FROM events WHERE id = ?', parsed.eventId);
  if (!event) {
    throw new Error('Event not found.');
  }

  await runStatement('DELETE FROM events WHERE id = ?', parsed.eventId);
}

export async function setEventVisibility(user: SessionLikeUser, input: SetEventVisibilityInput) {
  assertAuthenticated(user);
  const parsed = setEventVisibilitySchema.parse(input);
  const membership = await firstRow<{ id: number }>(
    `SELECT id
     FROM event_memberships
     WHERE id = ? AND user_id = ?`,
    parsed.membershipId,
    Number(user.id)
  );

  if (!membership) {
    throw new Error('Event membership not found.');
  }

  await runStatement(
    `UPDATE event_memberships
     SET remain_visible = ?
     WHERE id = ?`,
    parsed.remainVisible ? 1 : 0,
    parsed.membershipId
  );
}

export async function listUserEventMemberships(user: SessionLikeUser) {
  assertAuthenticated(user);
  return allRows<{
    id: number;
    event_id: number;
    event_name: string;
    side: EventMembershipSide;
    remain_visible: number;
    status: 'active' | 'ended';
  }>(
    `SELECT
      event_memberships.id,
      event_memberships.event_id,
      events.name AS event_name,
      event_memberships.side,
      event_memberships.remain_visible,
      events.status
     FROM event_memberships
     INNER JOIN events ON events.id = event_memberships.event_id
     WHERE event_memberships.user_id = ?
       AND event_memberships.status = 'approved'
     ORDER BY events.created_at DESC, event_memberships.side ASC`,
    Number(user.id)
  );
}

export async function getLeadershipSnapshots(user: SessionLikeUser): Promise<{
  departments: DepartmentLeadershipSnapshot[];
  events: EventLeadershipSnapshot[];
}> {
  await assertLeadershipAccess(user);

  const departmentRows = await allRows<{
    department_id: number;
    department_name: string;
    record_count: number | null;
    latest_record_date: string | null;
    open_action_item_count: number | null;
    latest_meeting_date: string | null;
  }>(
    `SELECT
      departments.id AS department_id,
      departments.name AS department_name,
      COALESCE(record_counts.record_count, 0) AS record_count,
      record_counts.latest_record_date AS latest_record_date,
      COALESCE(action_counts.open_action_item_count, 0) AS open_action_item_count,
      action_counts.latest_meeting_date AS latest_meeting_date
     FROM departments
     LEFT JOIN (
       SELECT department_id, COUNT(*) AS record_count, MAX(record_date) AS latest_record_date
       FROM department_records
       GROUP BY department_id
     ) AS record_counts ON record_counts.department_id = departments.id
     LEFT JOIN (
       SELECT meetings.department_id, COUNT(meeting_action_items.id) AS open_action_item_count, MAX(meetings.meeting_date) AS latest_meeting_date
       FROM meetings
       LEFT JOIN meeting_action_items
         ON meeting_action_items.meeting_id = meetings.id
        AND meeting_action_items.status = 'open'
       GROUP BY meetings.department_id
     ) AS action_counts ON action_counts.department_id = departments.id
     ORDER BY departments.name ASC`
  );

  const eventRows = await allRows<{
    event_id: number;
    event_name: string;
    status: 'active' | 'ended';
    ended_at: string | null;
    total_collected: number | null;
    total_spent: number | null;
    balance_retained: number | null;
    organizer_count: number | null;
    finance_count: number | null;
  }>(
    `SELECT
      events.id AS event_id,
      events.name AS event_name,
      events.status AS status,
      events.ended_at AS ended_at,
      COALESCE(contribution_totals.total_collected, 0) AS total_collected,
      COALESCE(expense_totals.total_spent, 0) AS total_spent,
      COALESCE(contribution_totals.total_collected, 0) - COALESCE(expense_totals.total_spent, 0) AS balance_retained,
      COALESCE(member_totals.organizer_count, 0) AS organizer_count,
      COALESCE(member_totals.finance_count, 0) AS finance_count
     FROM events
     LEFT JOIN (
       SELECT contribution_ledgers.event_id, SUM(contribution_payments.amount) AS total_collected
       FROM contribution_ledgers
       LEFT JOIN contribution_participants ON contribution_participants.ledger_id = contribution_ledgers.id
       LEFT JOIN contribution_payments ON contribution_payments.participant_id = contribution_participants.id
       GROUP BY contribution_ledgers.event_id
     ) AS contribution_totals ON contribution_totals.event_id = events.id
     LEFT JOIN (
       SELECT expense_ledgers.event_id, SUM(COALESCE(expense_items.actual_amount, 0)) AS total_spent
       FROM expense_ledgers
       LEFT JOIN expense_categories ON expense_categories.ledger_id = expense_ledgers.id
       LEFT JOIN expense_items ON expense_items.category_id = expense_categories.id
       GROUP BY expense_ledgers.event_id
     ) AS expense_totals ON expense_totals.event_id = events.id
     LEFT JOIN (
       SELECT
         event_id,
         SUM(CASE WHEN side = 'organizer' THEN 1 ELSE 0 END) AS organizer_count,
         SUM(CASE WHEN side = 'finance' THEN 1 ELSE 0 END) AS finance_count
       FROM event_memberships
       WHERE status = 'approved'
       GROUP BY event_id
     ) AS member_totals ON member_totals.event_id = events.id
     ORDER BY events.created_at DESC`
  );

  const departments = departmentRows.map((row) => ({
    departmentId: row.department_id,
    departmentName: row.department_name,
    recordCount: row.record_count || 0,
    latestRecordDate: row.latest_record_date,
    openActionItemCount: row.open_action_item_count || 0,
    latestMeetingDate: row.latest_meeting_date,
  }));

  const events = eventRows.map((row) => ({
    eventId: row.event_id,
    eventName: row.event_name,
    status: row.status,
    endedAt: row.ended_at,
    totalCollected: row.total_collected || 0,
    totalSpent: row.total_spent || 0,
    balanceRetained: row.balance_retained || 0,
    organizerCount: row.organizer_count || 0,
    financeCount: row.finance_count || 0,
  }));

  return { departments, events };
}
