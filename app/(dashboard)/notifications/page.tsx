import { NotificationsCenter } from '@/components/cap/notifications-center';
import { getSession } from '@/lib/cap/auth';
import { listNotificationsForUser } from '@/lib/cap/services';

export default async function NotificationsPage() {
  const session = await getSession();
  const notifications = await listNotificationsForUser(session!.user);
  const canRunReminderJob =
    session!.user.systemRole === 'main_admin' ||
    session!.user.systemRole === 'chief_admin' ||
    session!.user.role === 'admin';

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Notifications</p>
        <h2 className="mt-2 text-3xl font-semibold text-[#241c33]">Ministry reminders and alerts</h2>
        <p className="mt-2 text-sm text-[#5f5673]">
          CIOM Portal stores in-app reminders here so department members can follow upcoming meetings, action items,
          and accountability follow-up without guessing what needs attention next.
        </p>
      </div>

      <NotificationsCenter
        notifications={notifications}
        canRunReminderJob={canRunReminderJob}
      />
    </section>
  );
}
