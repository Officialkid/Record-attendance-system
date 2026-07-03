import { notFound } from 'next/navigation';

import { MeetingForm } from '@/components/cap/meeting-form';
import { getSession } from '@/lib/cap/auth';
import { getMeetingById, listDepartmentsForUser, listUsers } from '@/lib/cap/services';

export default async function EditMeetingPage({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;
  const numericMeetingId = Number(meetingId);

  if (!Number.isFinite(numericMeetingId) || numericMeetingId <= 0) {
    notFound();
  }

  const session = await getSession();
  const departments = await listDepartmentsForUser(session!.user);
  const users = await listUsers();

  let meeting;
  try {
    meeting = await getMeetingById(session!.user, numericMeetingId);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === 'Meeting not found.' ||
        error.message === 'You do not have access to this department.' ||
        error.message === 'Members cannot access cross-department meetings.')
    ) {
      notFound();
    }

    throw error;
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Phase 2</p>
        <h2 className="mt-2 text-3xl font-semibold text-[#241c33]">Edit meeting and minutes</h2>
        <p className="mt-2 text-sm text-[#5f5673]">
          Update the meeting details, attendees, and action items for this ministry session.
        </p>
      </div>

      <MeetingForm
        departments={departments}
        users={users}
        defaultMeetingDate={meeting.meetingDate}
        canCreateCrossDepartment={session!.user.role !== 'member'}
        existingMeeting={meeting}
      />
    </section>
  );
}
