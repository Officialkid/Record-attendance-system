import 'server-only';

import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import postgres, { type Sql } from 'postgres';

import { getEnvValue } from './env';
import { normalizeSlug, toSqliteBoolean } from './utils';

export type SqlValue = string | number | null;

export type MutationResult = {
  changes: number;
  lastInsertRowid?: number;
};

export interface CapPreparedStatement {
  all(...params: SqlValue[]): Promise<unknown[]>;
  get(...params: SqlValue[]): Promise<unknown | undefined>;
  run(...params: SqlValue[]): Promise<MutationResult>;
}

export interface CapDatabase {
  readonly driver: 'sqlite' | 'd1-remote' | 'postgres';
  prepare(sql: string): CapPreparedStatement;
  exec(sql: string): Promise<void>;
}

declare global {
  var __capDbPromise__: Promise<CapDatabase> | undefined;
}

const dataDirectory = path.join(process.cwd(), 'data');
const databasePath = path.join(dataDirectory, 'cap.db');

const schemaStatements = splitSqlStatements(`
  CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'member',
    password_hash TEXT NOT NULL,
    must_change_password INTEGER NOT NULL DEFAULT 0,
    google_sub TEXT UNIQUE,
    avatar_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    system_role TEXT NOT NULL DEFAULT 'none',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS department_memberships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    status TEXT NOT NULL DEFAULT 'pending',
    added_directly INTEGER NOT NULL DEFAULT 0,
    requested_at TEXT DEFAULT (datetime('now')),
    decided_at TEXT,
    decided_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE (department_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS department_field_defs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    field_key TEXT NOT NULL,
    label TEXT NOT NULL,
    field_type TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_required INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE (department_id, field_key)
  );

  CREATE TABLE IF NOT EXISTS department_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    record_date TEXT NOT NULL,
    handled_by_user_id INTEGER NOT NULL REFERENCES users(id),
    values_json TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS record_visitors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    record_id INTEGER NOT NULL REFERENCES department_records(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS record_metrics (
    record_id INTEGER NOT NULL REFERENCES department_records(id) ON DELETE CASCADE,
    field_key TEXT NOT NULL,
    numeric_value REAL,
    PRIMARY KEY (record_id, field_key)
  );

  CREATE TABLE IF NOT EXISTS meetings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    meeting_date TEXT NOT NULL,
    agenda TEXT,
    decisions TEXT,
    ai_summary TEXT,
    source_document_r2_key TEXT,
    next_meeting_date TEXT,
    created_by_user_id INTEGER NOT NULL REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS meeting_attendees (
    meeting_id INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (meeting_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS meeting_action_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meeting_id INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    owner_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'open',
    due_date TEXT
  );

  CREATE TABLE IF NOT EXISTS attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meeting_id INTEGER REFERENCES meetings(id) ON DELETE CASCADE,
    record_id INTEGER REFERENCES department_records(id) ON DELETE CASCADE,
    r2_key TEXT NOT NULL,
    filename TEXT NOT NULL,
    uploaded_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id INTEGER NOT NULL,
    details_json TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS calendar_connections (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    google_refresh_token TEXT NOT NULL,
    connected_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS calendar_meeting_events (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    meeting_id INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    calendar_event_id TEXT NOT NULL,
    synced_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, meeting_id)
  );

  CREATE TABLE IF NOT EXISTS user_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    dedupe_key TEXT UNIQUE,
    read_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS department_invites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    note TEXT,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    used_at TEXT,
    used_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS generated_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    period_type TEXT NOT NULL,
    period_start TEXT NOT NULL,
    period_end TEXT NOT NULL,
    summary_text TEXT NOT NULL,
    data_snapshot_json TEXT NOT NULL,
    generated_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    generated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_department_records_department_date
    ON department_records(department_id, record_date DESC);
  CREATE INDEX IF NOT EXISTS idx_record_metrics_field_key
    ON record_metrics(field_key);
  CREATE INDEX IF NOT EXISTS idx_meetings_department_date
    ON meetings(department_id, meeting_date DESC);
  CREATE INDEX IF NOT EXISTS idx_generated_reports_department_period
    ON generated_reports(department_id, period_start DESC, period_end DESC);
  CREATE INDEX IF NOT EXISTS idx_user_notifications_user_created
    ON user_notifications(user_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_department_invites_department_created
    ON department_invites(department_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_calendar_meeting_events_meeting
    ON calendar_meeting_events(meeting_id);
`);

const postMigrationStatements = splitSqlStatements(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_one_main_admin
    ON users(system_role) WHERE system_role = 'main_admin';
`);

const insertIdTables = new Set([
  'departments',
  'users',
  'department_memberships',
  'department_field_defs',
  'department_records',
  'record_visitors',
  'meetings',
  'meeting_action_items',
  'attachments',
  'audit_logs',
  'user_notifications',
  'department_invites',
  'generated_reports',
]);

class SqlitePreparedStatement implements CapPreparedStatement {
  constructor(
    private readonly database: Database.Database,
    private readonly sql: string
  ) {}

  async all(...params: SqlValue[]) {
    return this.database.prepare(this.sql).all(...params);
  }

  async get(...params: SqlValue[]) {
    return this.database.prepare(this.sql).get(...params) as unknown | undefined;
  }

  async run(...params: SqlValue[]) {
    const result = this.database.prepare(this.sql).run(...params);
    return {
      changes: result.changes,
      lastInsertRowid: Number(result.lastInsertRowid || 0) || undefined,
    };
  }
}

class SqliteCapDatabase implements CapDatabase {
  readonly driver = 'sqlite' as const;

  constructor(private readonly database: Database.Database) {}

  prepare(sql: string) {
    return new SqlitePreparedStatement(this.database, sql);
  }

  async exec(sql: string) {
    this.database.exec(sql);
  }
}

class D1RemotePreparedStatement implements CapPreparedStatement {
  constructor(
    private readonly database: D1RemoteDatabase,
    private readonly sql: string
  ) {}

  async all(...params: SqlValue[]) {
    const result = await this.database.execute(this.sql, params);
    return extractRows(result);
  }

  async get(...params: SqlValue[]) {
    const rows = await this.all(...params);
    return rows[0];
  }

  async run(...params: SqlValue[]) {
    const result = await this.database.execute(this.sql, params);
    const meta = extractMeta(result);
    return {
      changes: Number(meta.changes ?? meta.rows_written ?? 0) || 0,
      lastInsertRowid: Number(meta.last_row_id ?? meta.lastRowId ?? 0) || undefined,
    };
  }
}

class D1RemoteDatabase implements CapDatabase {
  readonly driver = 'd1-remote' as const;

  constructor(
    private readonly accountId: string,
    private readonly databaseId: string,
    private readonly apiToken: string
  ) {}

  prepare(sql: string) {
    return new D1RemotePreparedStatement(this, sql);
  }

  async exec(sql: string) {
    for (const statement of splitSqlStatements(sql)) {
      await this.execute(statement, []);
    }
  }

  async execute(sql: string, params: SqlValue[]) {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/d1/database/${this.databaseId}/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql,
          params,
        }),
        cache: 'no-store',
      }
    );

    const payload = (await response.json()) as Record<string, unknown>;
    if (!response.ok || payload.success === false) {
      const message =
        (typeof payload.errors === 'object' && payload.errors !== null
          ? JSON.stringify(payload.errors)
          : null) || `D1 request failed with status ${response.status}.`;
      throw new Error(message);
    }

    return payload;
  }
}

class PostgresPreparedStatement implements CapPreparedStatement {
  constructor(
    private readonly database: PostgresCapDatabase,
    private readonly sql: string
  ) {}

  async all(...params: SqlValue[]) {
    const { text } = normalizePostgresQuery(this.sql);
    return this.database.execute(text, params);
  }

  async get(...params: SqlValue[]) {
    const rows = await this.all(...params);
    return rows[0];
  }

  async run(...params: SqlValue[]) {
    const { text, insertIdTable } = normalizePostgresQuery(this.sql);
    const finalText =
      insertIdTable && !/\breturning\b/i.test(text) ? `${text} RETURNING id` : text;
    const rows = (await this.database.execute(finalText, params)) as Array<Record<string, unknown>>;
    const lastInsertRowid =
      insertIdTable && rows[0] && typeof rows[0]?.id === 'number' ? Number(rows[0].id) : undefined;

    return {
      changes: this.database.getLastCount(),
      lastInsertRowid,
    };
  }
}

class PostgresCapDatabase implements CapDatabase {
  readonly driver = 'postgres' as const;
  private lastCount = 0;

  constructor(private readonly client: Sql) {}

  prepare(sql: string) {
    return new PostgresPreparedStatement(this, sql);
  }

  async exec(sql: string) {
    for (const statement of splitSqlStatements(sql)) {
      await this.execute(convertSchemaStatementForPostgres(statement), []);
    }
  }

  async execute(sql: string, params: SqlValue[]) {
    const result = await this.client.unsafe<Record<string, unknown>[]>(sql, params, {
      prepare: false,
    });
    this.lastCount = result.count ?? 0;
    return result as unknown[];
  }

  getLastCount() {
    return this.lastCount;
  }
}

function splitSqlStatements(sql: string) {
  return sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);
}

function convertSchemaStatementForPostgres(sql: string) {
  return sql
    .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/g, 'INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY')
    .replace(/\(datetime\('now'\)\)/g, 'CURRENT_TIMESTAMP::text');
}

function normalizePostgresQuery(sql: string) {
  let normalized = sql
    .replace(/datetime\('now'\)/g, 'CURRENT_TIMESTAMP::text')
    .replace(/\(datetime\('now'\)\)/g, 'CURRENT_TIMESTAMP::text');

  normalized = normalized.replace(/INSERT OR IGNORE INTO\s+([a-z_]+)/i, 'INSERT INTO $1');
  if (/INSERT OR IGNORE INTO/i.test(sql) || /\bON CONFLICT\(/i.test(normalized)) {
    normalized = normalized.replace(/INSERT OR IGNORE INTO/i, 'INSERT INTO');
    if (!/\bON CONFLICT\b/i.test(normalized)) {
      normalized = `${normalized} ON CONFLICT DO NOTHING`;
    }
  }

  let parameterIndex = 0;
  normalized = normalized.replace(/\?/g, () => `$${++parameterIndex}`);

  const insertMatch = normalized.match(/^\s*INSERT\s+INTO\s+([a-z_]+)/i);
  const insertIdTable = insertMatch?.[1]?.toLowerCase();

  return {
    text: normalized,
    insertIdTable: insertIdTable && insertIdTables.has(insertIdTable) ? insertIdTable : null,
  };
}

function extractResult(payload: Record<string, unknown>) {
  const rawResult = payload.result;
  if (Array.isArray(rawResult)) {
    return (rawResult[0] ?? {}) as Record<string, unknown>;
  }

  if (rawResult && typeof rawResult === 'object') {
    return rawResult as Record<string, unknown>;
  }

  return {};
}

function extractRows(payload: Record<string, unknown>) {
  const result = extractResult(payload);
  return Array.isArray(result.results) ? result.results : [];
}

function extractMeta(payload: Record<string, unknown>) {
  const result = extractResult(payload);
  return result.meta && typeof result.meta === 'object'
    ? (result.meta as Record<string, unknown>)
    : {};
}

function createSqliteDatabase() {
  fs.mkdirSync(dataDirectory, { recursive: true });
  const database = new Database(databasePath);
  database.pragma('journal_mode = WAL');
  database.pragma('foreign_keys = ON');

  for (const statement of schemaStatements) {
    database.exec(statement);
  }

  migrateLegacySqliteSchema(database);

  for (const statement of postMigrationStatements) {
    database.exec(statement);
  }

  return new SqliteCapDatabase(database);
}

function migrateLegacySqliteSchema(database: Database.Database) {
  const userColumns = new Set(
    (database.prepare("PRAGMA table_info('users')").all() as Array<{ name: string }>).map((column) => column.name)
  );

  if (!userColumns.has('google_sub')) {
    database.exec('ALTER TABLE users ADD COLUMN google_sub TEXT');
  }

  if (!userColumns.has('avatar_url')) {
    database.exec('ALTER TABLE users ADD COLUMN avatar_url TEXT');
  }

  if (!userColumns.has('status')) {
    database.exec("ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'");
  }

  if (!userColumns.has('system_role')) {
    database.exec("ALTER TABLE users ADD COLUMN system_role TEXT NOT NULL DEFAULT 'none'");
  }

  database.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_sub ON users(google_sub)');

  database.exec(
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_one_main_admin
     ON users(system_role) WHERE system_role = 'main_admin'`
  );

  database.exec(`
    CREATE TABLE IF NOT EXISTS department_memberships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'member',
      status TEXT NOT NULL DEFAULT 'pending',
      added_directly INTEGER NOT NULL DEFAULT 0,
      requested_at TEXT DEFAULT (datetime('now')),
      decided_at TEXT,
      decided_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      UNIQUE (department_id, user_id)
    )
  `);

  const meetingColumns = new Set(
    (database.prepare("PRAGMA table_info('meetings')").all() as Array<{ name: string }>).map(
      (column) => column.name
    )
  );

  if (!meetingColumns.has('ai_summary')) {
    database.exec('ALTER TABLE meetings ADD COLUMN ai_summary TEXT');
  }

  if (!meetingColumns.has('source_document_r2_key')) {
    database.exec('ALTER TABLE meetings ADD COLUMN source_document_r2_key TEXT');
  }

  const legacyTableExists = Boolean(
    database
      .prepare("SELECT 1 AS value FROM sqlite_master WHERE type = 'table' AND name = 'department_members'")
      .get() as { value: number } | undefined
  );

  if (legacyTableExists) {
    database.exec(`
      INSERT OR IGNORE INTO department_memberships
      (department_id, user_id, role, status, added_directly, requested_at, decided_at, decided_by_user_id)
      SELECT
        department_members.department_id,
        department_members.user_id,
        CASE WHEN users.role IN ('admin', 'leader') THEN 'department_admin' ELSE 'member' END,
        'approved',
        1,
        datetime('now'),
        datetime('now'),
        NULL
      FROM department_members
      INNER JOIN users ON users.id = department_members.user_id
    `);
  }
}

function getD1Config() {
  const explicitDriver = (process.env.CAP_DATABASE_DRIVER || '').trim().toLowerCase();
  if (explicitDriver === 'sqlite' || explicitDriver === 'postgres') {
    return null;
  }

  const accountId = getEnvValue('CLOUDFLARE_ACCOUNT_ID', 'R2_ACCOUNT_ID');
  const databaseId = getEnvValue('D1_DATABASE_ID', 'CLOUDFLARE_D1_DATABASE_ID');
  const apiToken = getEnvValue('CLOUDFLARE_API_TOKEN');

  if (!accountId || !databaseId || !apiToken) {
    return null;
  }

  return {
    accountId,
    databaseId,
    apiToken,
  };
}

function getPostgresConfig() {
  const explicitDriver = (process.env.CAP_DATABASE_DRIVER || '').trim().toLowerCase();
  if (explicitDriver !== 'postgres') {
    return null;
  }

  const databaseUrl = getEnvValue('DATABASE_URL');
  if (!databaseUrl) {
    return null;
  }

  return { databaseUrl };
}

async function ensureDatabase(database: CapDatabase) {
  for (const statement of schemaStatements) {
    await database.exec(statement);
  }

  for (const statement of postMigrationStatements) {
    await database.exec(statement);
  }

  await seedDatabase(database);
  return database;
}

async function seedDatabase(database: CapDatabase) {
  const adminEmail = (getEnvValue('CAP_ADMIN_EMAIL', 'MAIN_ADMIN_EMAIL') || 'danielmwalili1@gmail.com').toLowerCase();
  const adminName = process.env.CAP_ADMIN_NAME || 'CIOM Portal Administrator';
  const adminPassword = process.env.CAP_ADMIN_PASSWORD || 'ChangeMe123!';

  const existingAdmin = (await database
    .prepare('SELECT id, system_role FROM users WHERE lower(email) = lower(?)')
    .get(adminEmail)) as { id: number; system_role: string } | undefined;
  const existingMainAdmin = (await database
    .prepare("SELECT id, email FROM users WHERE system_role = 'main_admin'")
    .get()) as { id: number; email: string } | undefined;

  let adminId = existingAdmin?.id;

    if (existingAdmin && existingMainAdmin && existingAdmin.id !== existingMainAdmin.id) {
      await database
        .prepare(
        `UPDATE users
         SET system_role = 'chief_admin',
             role = 'admin',
             status = 'active',
             updated_at = datetime('now')
         WHERE id = ?`
      )
      .run(existingMainAdmin.id);
    adminId = existingAdmin.id;
    } else if (!existingAdmin && existingMainAdmin) {
      await database
        .prepare(
          `UPDATE users
           SET email = ?,
               name = CASE
                 WHEN google_sub IS NOT NULL AND trim(COALESCE(name, '')) <> '' THEN name
                 ELSE ?
               END,
               role = 'admin',
               status = 'active',
               updated_at = datetime('now')
           WHERE id = ?`
        )
      .run(adminEmail, adminName, existingMainAdmin.id);
    adminId = existingMainAdmin.id;
  }

  if (!adminId) {
    const hash = bcrypt.hashSync(adminPassword, 10);
    const result = await database
      .prepare(
        `INSERT INTO users (name, email, role, password_hash, must_change_password, status, system_role)
         VALUES (?, ?, 'admin', ?, 1, 'active', 'main_admin')`
      )
      .run(adminName, adminEmail, hash);
    adminId = result.lastInsertRowid;
  }

  if (!adminId) {
    throw new Error('Failed to seed the initial CIOM Portal admin user.');
  }

  await database
    .prepare(
      `UPDATE users
       SET email = ?,
           name = CASE
             WHEN google_sub IS NOT NULL AND trim(COALESCE(name, '')) <> '' THEN name
             ELSE ?
           END,
           role = 'admin',
           status = 'active',
           system_role = 'main_admin',
           updated_at = datetime('now')
       WHERE id = ?`
    )
    .run(adminEmail, adminName, adminId);

  const protocolSlug = normalizeSlug('Protocol & Admin');
  const existingDepartment = (await database
    .prepare('SELECT id FROM departments WHERE slug = ?')
    .get(protocolSlug)) as { id: number } | undefined;

  let protocolDepartmentId = existingDepartment?.id;
  if (!protocolDepartmentId) {
    const result = await database
      .prepare('INSERT INTO departments (name, slug, description) VALUES (?, ?, ?)')
      .run(
        'Protocol & Admin',
        protocolSlug,
        'Weekly records, visitors, and accountability tracking for the Protocol & Admin team.'
      );
    protocolDepartmentId = result.lastInsertRowid;
  }

  if (!protocolDepartmentId) {
    throw new Error('Failed to seed the Protocol & Admin department.');
  }

  await database
    .prepare(
      `INSERT OR IGNORE INTO department_memberships
       (department_id, user_id, role, status, added_directly, requested_at, decided_at)
       VALUES (?, ?, 'department_admin', 'approved', 1, datetime('now'), datetime('now'))`
    )
    .run(protocolDepartmentId, adminId);

  const fieldDefinitions = [
    ['tithe', 'Tithe', 'currency', 1, true],
    ['offering', 'Offering', 'currency', 2, true],
    ['expenses', 'Expenses', 'currency', 3, true],
    ['headcount', 'Headcount', 'number', 4, true],
  ] as const;

  for (const [fieldKey, label, fieldType, displayOrder, isRequired] of fieldDefinitions) {
    await database
      .prepare(
        `INSERT OR IGNORE INTO department_field_defs
         (department_id, field_key, label, field_type, display_order, is_required)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(
        protocolDepartmentId,
        fieldKey,
        label,
        fieldType,
        displayOrder,
        toSqliteBoolean(isRequired)
      );
  }
}

async function createDatabase() {
  const postgresConfig = getPostgresConfig();
  const d1Config = getD1Config();
  const database = postgresConfig
    ? new PostgresCapDatabase(
        postgres(postgresConfig.databaseUrl, {
          max: 1,
          prepare: false,
        })
      )
    : d1Config
      ? new D1RemoteDatabase(d1Config.accountId, d1Config.databaseId, d1Config.apiToken)
      : createSqliteDatabase();

  return ensureDatabase(database);
}

export async function getDb() {
  if (!global.__capDbPromise__) {
    global.__capDbPromise__ = createDatabase().catch((error) => {
      global.__capDbPromise__ = undefined;
      throw error;
    });
  }

  try {
    return await global.__capDbPromise__;
  } catch (error) {
    global.__capDbPromise__ = undefined;
    throw error;
  }
}

export function getConfiguredDatabaseDriver() {
  const explicitDriver = (process.env.CAP_DATABASE_DRIVER || '').trim().toLowerCase();
  if (explicitDriver === 'postgres') {
    return 'postgres';
  }
  if (explicitDriver === 'd1-remote' || explicitDriver === 'd1') {
    return 'd1-remote';
  }

  return getD1Config() ? 'd1-remote' : 'sqlite';
}
