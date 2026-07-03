import 'server-only';

import bcrypt from 'bcryptjs';
import type { Account, NextAuthOptions, Profile } from 'next-auth';
import { getServerSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

import type { DepartmentMembershipRole, GlobalRole, SystemRole } from './types';
import { getDb } from './db';

type AuthRow = {
  id: number;
  name: string;
  email: string;
  role: GlobalRole;
  system_role: SystemRole;
  status: 'pending' | 'approved' | 'rejected' | 'active';
  avatar_url: string | null;
  password_hash: string;
  google_sub: string | null;
  must_change_password: number;
};

function hasCalendarScope(scope?: string | null) {
  return typeof scope === 'string' && scope.split(/\s+/).includes('https://www.googleapis.com/auth/calendar.events');
}

async function upsertCalendarConnection(userId: number, refreshToken: string) {
  const db = await getDb();
  await db
    .prepare(
      `INSERT INTO calendar_connections (user_id, google_refresh_token, connected_at)
       VALUES (?, ?, datetime('now'))
       ON CONFLICT(user_id) DO UPDATE SET
         google_refresh_token = excluded.google_refresh_token,
         connected_at = datetime('now')`
    )
    .run(userId, refreshToken);
}

function deriveUiRole(
  systemRole: SystemRole,
  departmentRoles: Record<number, DepartmentMembershipRole>
): GlobalRole {
  if (systemRole === 'main_admin' || systemRole === 'chief_admin') {
    return 'admin';
  }

  if (Object.values(departmentRoles).some((role) => role === 'department_admin')) {
    return 'leader';
  }

  return 'member';
}

async function getApprovedDepartmentAccess(userId: number) {
  const db = await getDb();
  const membershipRows = (await db
    .prepare(
      `SELECT department_id, role
       FROM department_memberships
       WHERE user_id = ? AND status = 'approved'
       ORDER BY department_id ASC`
    )
    .all(userId)) as Array<{ department_id: number; role: DepartmentMembershipRole }>;

  if (membershipRows.length > 0) {
    return {
      departmentIds: membershipRows.map((row) => row.department_id),
      departmentRoles: Object.fromEntries(
        membershipRows.map((row) => [row.department_id, row.role])
      ) as Record<number, DepartmentMembershipRole>,
    };
  }

  let legacyRows: Array<{ department_id: number }> = [];
  try {
    legacyRows = (await db
      .prepare('SELECT department_id FROM department_members WHERE user_id = ? ORDER BY department_id ASC')
      .all(userId)) as Array<{ department_id: number }>;
  } catch {
    legacyRows = [];
  }

  return {
    departmentIds: legacyRows.map((row) => row.department_id),
    departmentRoles: Object.fromEntries(
      legacyRows.map((row) => [row.department_id, 'member'])
    ) as Record<number, DepartmentMembershipRole>,
  };
}

async function getAuthRowById(userId: number) {
  const db = await getDb();
  return (await db
    .prepare(
      `SELECT
        id,
        name,
        email,
        role,
        system_role,
        status,
        avatar_url,
        password_hash,
        google_sub,
        must_change_password
       FROM users
       WHERE id = ?`
    )
    .get(userId)) as AuthRow | undefined;
}

async function getAuthRowByEmail(email: string) {
  const db = await getDb();
  return (await db
    .prepare(
      `SELECT
        id,
        name,
        email,
        role,
        system_role,
        status,
        avatar_url,
        password_hash,
        google_sub,
        must_change_password
       FROM users
       WHERE lower(email) = lower(?)`
    )
    .get(email)) as AuthRow | undefined;
}

async function buildSessionUser(user: AuthRow) {
  const access = await getApprovedDepartmentAccess(user.id);

  return {
    id: String(user.id),
    name: user.name,
    email: user.email,
    role: deriveUiRole(user.system_role, access.departmentRoles),
    systemRole: user.system_role,
    status: user.status,
    departmentIds: access.departmentIds,
    departmentRoles: access.departmentRoles,
    avatarUrl: user.avatar_url,
    mustChangePassword: user.must_change_password === 1,
  };
}

async function syncGoogleUser({
  profile,
  account,
}: {
  profile?: Profile;
  account?: Account | null;
}) {
  const googleProfile = (profile || {}) as Profile & { picture?: string };
  const email = typeof profile?.email === 'string' ? profile.email.trim().toLowerCase() : '';
  const googleSub = typeof account?.providerAccountId === 'string' ? account.providerAccountId : '';
  const avatarUrl = typeof googleProfile.picture === 'string' ? googleProfile.picture : null;
  const displayName =
    typeof profile?.name === 'string' && profile.name.trim().length > 0 ? profile.name.trim() : email || 'CAP User';

  if (!email || !googleSub) {
    return null;
  }

  const db = await getDb();
  const existingByGoogle = (await db
    .prepare('SELECT id FROM users WHERE google_sub = ?')
    .get(googleSub)) as { id: number } | undefined;

  if (existingByGoogle) {
    await db
      .prepare(
        `UPDATE users
         SET name = ?, avatar_url = ?, updated_at = datetime('now')
         WHERE id = ?`
      )
      .run(displayName, avatarUrl, existingByGoogle.id);
    return existingByGoogle.id;
  }

  const existingByEmail = (await db
    .prepare('SELECT id, system_role, status FROM users WHERE lower(email) = lower(?)')
    .get(email)) as { id: number; system_role: SystemRole; status: string } | undefined;

  if (existingByEmail) {
    await db
      .prepare(
        `UPDATE users
         SET google_sub = ?, avatar_url = ?, name = ?, updated_at = datetime('now')
         WHERE id = ?`
      )
      .run(googleSub, avatarUrl, displayName, existingByEmail.id);
    return existingByEmail.id;
  }

  const inserted = await db
    .prepare(
      `INSERT INTO users
       (name, email, role, password_hash, must_change_password, google_sub, avatar_url, status, system_role)
       VALUES (?, ?, 'member', '', 0, ?, ?, 'pending', 'none')`
    )
    .run(displayName, email, googleSub, avatarUrl);

  return Number(inserted.lastInsertRowid);
}

export function isGoogleAuthConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function isCredentialsFallbackEnabled() {
  return true;
}

const providers: NextAuthOptions['providers'] = [];

if (isGoogleAuthConfigured()) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'select_account consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    })
  );
}

if (isCredentialsFallbackEnabled()) {
  providers.push(
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const user = await getAuthRowByEmail(credentials.email);
        if (!user || !user.password_hash) {
          return null;
        }

        const passwordMatches = await bcrypt.compare(credentials.password, user.password_hash);
        if (!passwordMatches) {
          return null;
        }

        return buildSessionUser(user);
      },
    })
  );
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  pages: {
    signIn: '/login',
  },
  providers,
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== 'google') {
        return true;
      }

      const userId = await syncGoogleUser({ profile, account });
      return Boolean(userId);
    },
    async jwt({ token, user, account, profile, trigger, session }) {
      let resolvedUser = user;

      if (trigger === 'update' && session && typeof session.mustChangePassword === 'boolean') {
        token.mustChangePassword = session.mustChangePassword;
      }

      if (account?.provider === 'google') {
        const googleUserId = await syncGoogleUser({ profile, account });
        if (googleUserId) {
          if (account.refresh_token && hasCalendarScope(account.scope)) {
            await upsertCalendarConnection(googleUserId, account.refresh_token);
          }

          const authRow = await getAuthRowById(googleUserId);
          if (authRow) {
            resolvedUser = await buildSessionUser(authRow);
            token.sub = String(googleUserId);
          }
        }
      } else if (!resolvedUser && token.sub) {
        const authRow = await getAuthRowById(Number(token.sub));
        if (authRow) {
          resolvedUser = await buildSessionUser(authRow);
        }
      }

      if (resolvedUser) {
        token.role = resolvedUser.role;
        token.systemRole = resolvedUser.systemRole;
        token.status = resolvedUser.status;
        token.departmentIds = resolvedUser.departmentIds;
        token.departmentRoles = resolvedUser.departmentRoles;
        token.avatarUrl = resolvedUser.avatarUrl;
        token.mustChangePassword = resolvedUser.mustChangePassword;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || '';
        session.user.role = token.role || 'member';
        session.user.systemRole = token.systemRole || 'none';
        session.user.status = token.status || 'pending';
        session.user.departmentIds = token.departmentIds || [];
        session.user.departmentRoles = token.departmentRoles || {};
        session.user.avatarUrl = token.avatarUrl || null;
        session.user.mustChangePassword = Boolean(token.mustChangePassword);
      }

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'cap-development-secret',
};

export function getSession() {
  return getServerSession(authOptions);
}
