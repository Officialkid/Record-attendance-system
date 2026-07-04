import { redirect } from 'next/navigation';

import { PortalShell } from '@/components/cap/portal-shell';
import { getSession } from '@/lib/cap/auth';
import { getTimeBasedGreeting } from '@/lib/cap/utils';

export const dynamic = 'force-dynamic';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user) {
    redirect('/login');
  }

  return (
    <PortalShell
      role={session.user.role}
      systemRole={session.user.systemRole}
      greeting={getTimeBasedGreeting()}
      name={session.user.name || 'friend'}
      email={session.user.email || 'Unknown email'}
      departmentCount={session.user.departmentIds.length}
      unreadNotificationsCount={0}
      pendingApprovalsCount={0}
      avatarUrl={session.user.avatarUrl}
    >
      {session.user.status === 'pending' && session.user.departmentIds.length === 0 && session.user.systemRole === 'none' ? (
        <div className="mb-6 rounded-[24px] border border-[#eadfb8] bg-[#fffbf0] px-5 py-4 text-sm text-[#5f5673]">
          Your account is signed in, but your ministry workspace is still locked until a department invite is claimed.
          Open your profile for the next steps, or ask a department admin to send you the shared department access link.
        </div>
      ) : null}
      {children}
    </PortalShell>
  );
}
