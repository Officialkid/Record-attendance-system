import { CalendarConnectionCard } from '@/components/cap/calendar-connection-card';
import { ChangePasswordForm } from '@/components/cap/change-password-form';
import { InviteAccessGuidanceCard } from '@/components/cap/invite-access-guidance-card';
import { ProfileCard } from '@/components/cap/profile-card';
import { getSession } from '@/lib/cap/auth';
import {
  getCalendarConnectionForUser,
  listAllDepartments,
  listDepartmentMembershipsForUser,
  listUsers,
} from '@/lib/cap/services';

export default async function ProfilePage() {
  const session = await getSession();
  const users = await listUsers();
  const user = users.find((item) => String(item.id) === session!.user.id);
  const departments = await listAllDepartments();
  const memberships = await listDepartmentMembershipsForUser(Number(session!.user.id));
  const calendarConnection = await getCalendarConnectionForUser(Number(session!.user.id));
  const assignedDepartments = departments
    .filter((department) => user?.departmentIds.includes(department.id))
    .map((department) => ({ id: department.id, name: department.name }));

  if (!user) {
    return (
      <section className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-[#241c33]">Profile not available</h2>
        <p className="mt-2 text-sm text-[#5f5673]">
          CIOM Portal could not load your profile yet. Refresh the page or sign in again if the issue continues.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <ProfileCard user={user} assignedDepartments={assignedDepartments} />

      <div className="rounded-2xl border border-[#ddd3f0] bg-white p-4 text-sm text-[#5f5673] shadow-sm">
        This page is your personal control panel. Use it to confirm department access, connect your own Google
        Calendar if you want personal event mirroring, update your avatar, and check what CIOM Portal thinks your
        current role is.
      </div>

      {user.status === 'pending' && assignedDepartments.length === 0 ? (
        <div className="rounded-2xl border border-[#eadfb8] bg-[#fffbf0] p-4 text-sm text-[#5f5673]">
          Your account is signed in successfully, but your ministry workspace still needs a department invite link.
          Ask the relevant department head, chief admin, or main admin to share the department access link so your
          tools open automatically.
        </div>
      ) : null}

      <CalendarConnectionCard connectedAt={calendarConnection?.connectedAt || null} />

      <InviteAccessGuidanceCard email={session!.user.email} compact />

      <ChangePasswordForm mustChangePassword={Boolean(user.mustChangePassword)} />
    </section>
  );
}
