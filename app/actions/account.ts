'use server';

import { revalidatePath } from 'next/cache';

import { getSession } from '@/lib/cap/auth';
import { getDb } from '@/lib/cap/db';
import type { SystemRole } from '@/lib/cap/types';

type AccountActionResult = {
  success: boolean;
  message: string;
};

type AccountRow = {
  id: number;
  system_role: SystemRole;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'deactivated';
};

async function requireSessionUser() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('You must be signed in.');
  }

  return session.user;
}

function isProtectedSystemRole(systemRole: SystemRole) {
  return systemRole === 'main_admin' || systemRole === 'chief_admin';
}

async function getCurrentAccount(userId: number) {
  const db = await getDb();
  return (await db
    .prepare(
      `SELECT id, system_role, status
       FROM users
       WHERE id = ?`
    )
    .get(userId)) as AccountRow | undefined;
}

async function runOptionalCleanupStatements(userId: number) {
  const db = await getDb();
  const statements = [
    'DELETE FROM department_memberships WHERE user_id = ?',
    'DELETE FROM calendar_connections WHERE user_id = ?',
    'DELETE FROM calendar_meeting_events WHERE user_id = ?',
    'DELETE FROM user_notifications WHERE user_id = ?',
    'DELETE FROM event_memberships WHERE user_id = ?',
    'DELETE FROM user_context_state WHERE user_id = ?',
  ];

  for (const statement of statements) {
    try {
      await db.prepare(statement).run(userId);
    } catch {
      // Ignore optional tables so permanent removal never fails on cleanup-only paths.
    }
  }
}

function revalidateAccountViews() {
  revalidatePath('/dashboard');
  revalidatePath('/settings/profile');
  revalidatePath('/admin');
}

export async function deactivateOwnAccountAction(): Promise<AccountActionResult> {
  try {
    const user = await requireSessionUser();
    const userId = Number(user.id);
    const account = await getCurrentAccount(userId);

    if (!account) {
      throw new Error('Account not found.');
    }

    if (isProtectedSystemRole(account.system_role)) {
      throw new Error('Super admin accounts cannot deactivate themselves from Profile. Use a second protected admin account for that handoff.');
    }

    if (account.status === 'deactivated') {
      return {
        success: true,
        message: 'This account is already deactivated.',
      };
    }

    const db = await getDb();
    await db
      .prepare(
        `UPDATE users
         SET status = 'deactivated', updated_at = datetime('now')
         WHERE id = ?`
      )
      .run(userId);

    revalidateAccountViews();

    return {
      success: true,
      message: 'Account deactivated. An admin can restore access later if needed.',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to deactivate account.',
    };
  }
}

export async function deleteOwnAccountAction(): Promise<AccountActionResult> {
  try {
    const user = await requireSessionUser();
    const userId = Number(user.id);
    const account = await getCurrentAccount(userId);

    if (!account) {
      throw new Error('Account not found.');
    }

    if (isProtectedSystemRole(account.system_role)) {
      throw new Error('Super admin accounts cannot permanently remove themselves from Profile. Use a second protected admin account for that handoff.');
    }

    const db = await getDb();
    await runOptionalCleanupStatements(userId);

    await db
      .prepare(
        `UPDATE users
         SET
           name = ?,
           email = ?,
           status = 'deactivated',
           avatar_url = NULL,
           google_sub = NULL,
           password_hash = '',
           must_change_password = 0,
           updated_at = datetime('now')
         WHERE id = ?`
      )
      .run(`Deleted user ${userId}`, `deleted+${userId}@ciom-portal.local`, userId);

    revalidateAccountViews();

    return {
      success: true,
      message: 'Account permanently removed from active access. Historical records were kept and anonymized safely.',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to remove account permanently.',
    };
  }
}
