import { ActionItemToggle } from '@/components/cap/action-item-toggle';
import { AttachmentUpload } from '@/components/cap/attachment-upload';
import { DeleteAttachmentButton } from '@/components/cap/delete-attachment-button';
import { DeleteMeetingButton } from '@/components/cap/delete-meeting-button';
import { EditMeetingLink } from '@/components/cap/edit-meeting-link';
import { MeetingForm } from '@/components/cap/meeting-form';
import { MeetingSummaryGenerator } from '@/components/cap/meeting-summary-generator';
import { getSession } from '@/lib/cap/auth';
import { getAttachmentPublicUrl } from '@/lib/cap/r2';
import {
  listGeneratedMeetingSummaryDocuments,
  listDepartmentsForUser,
  listMeetings,
  listUsersVisibleTo,
} from '@/lib/cap/services';
import { formatDisplayDate } from '@/lib/cap/utils';

export default async function MeetingsPage({
  searchParams,
}: {
  searchParams: Promise<{ departmentId?: string }>;
}) {
  const session = await getSession();
  const params = await searchParams;
  const departments = await listDepartmentsForUser(session!.user);
  const requestedDepartmentId = Number(params.departmentId || '');
  const hasRequestedDepartment =
    Number.isFinite(requestedDepartmentId) &&
    departments.some((department) => department.id === requestedDepartmentId);
  const defaultDepartmentId =
    hasRequestedDepartment
      ? requestedDepartmentId
      : departments[0]?.id || null;
  const meetings = (await listMeetings(session!.user)).filter((meeting) =>
    hasRequestedDepartment ? meeting.departmentId === requestedDepartmentId : true
  );
  const selectedDepartment = hasRequestedDepartment
    ? departments.find((department) => department.id === requestedDepartmentId) || null
    : null;
  const users = await listUsersVisibleTo(session!.user);
  const meetingSummaryDocuments = await listGeneratedMeetingSummaryDocuments(session!.user);

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Phase 2</p>
        <h2 className="mt-2 text-3xl font-semibold text-[#241c33]">Meetings and minutes</h2>
        <p className="mt-2 max-w-3xl text-sm text-[#5f5673]">
          Capture point-form notes, upload a `.txt`, `.docx`, or `.pdf` minutes file, let CIOM Portal suggest the
          summary and action items, then keep both the source document and the generated minutes DOCX in R2 so
          ministry teams can return to them later.
        </p>
        {selectedDepartment ? (
          <p className="mt-3 inline-flex rounded-full bg-[#ede7f7] px-3 py-1 text-xs font-semibold text-[#4B248C]">
            Viewing {selectedDepartment.name} meetings
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <article className="rounded-[24px] border border-[#eadfb8] bg-[#fffaf0] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b6841a]">Step 1</p>
          <h3 className="mt-2 text-xl font-semibold text-[#241c33]">Bring your notes in any practical form</h3>
          <p className="mt-2 text-sm text-[#5f5673]">
            Raw point form works. Full minutes work too. If you already have a file, upload it directly and process it
            inside the meeting form.
          </p>
        </article>

        <article className="rounded-[24px] border border-[#ddd3f0] bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#4B248C]">Step 2</p>
          <h3 className="mt-2 text-xl font-semibold text-[#241c33]">Let the AI draft the follow-up</h3>
          <p className="mt-2 text-sm text-[#5f5673]">
            The assistant can now prefill the title, dates, agenda, summary, decisions, and action-item suggestions so
            you mainly review and adjust the ministry details instead of typing everything from scratch.
          </p>
        </article>

        <article className="rounded-[24px] border border-[#ddd3f0] bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#4B248C]">Step 3</p>
          <h3 className="mt-2 text-xl font-semibold text-[#241c33]">Store the source minutes safely</h3>
          <p className="mt-2 text-sm text-[#5f5673]">
            Source minutes files and bulky attachments live in R2, while the database keeps the searchable meeting
            details, summaries, action items, and metadata clean.
          </p>
        </article>
      </div>

      <MeetingForm
        departments={departments}
        users={users}
        defaultMeetingDate={new Date().toISOString().slice(0, 10)}
        canCreateCrossDepartment={session!.user.role !== 'member'}
        defaultDepartmentId={defaultDepartmentId}
      />

      <MeetingSummaryGenerator departments={departments} documents={meetingSummaryDocuments} />

      <div className="space-y-4">
        {meetings.length === 0 ? (
          <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-[#241c33]">No meetings recorded yet</h3>
            <p className="mt-2 max-w-3xl text-sm text-[#5f5673]">
              Start with the meeting form above. You can paste point-form notes, upload the source minutes file, let
              CIOM Portal suggest the summary and action items, then save the meeting so this page becomes your clear
              archive for ministry follow-up.
            </p>
          </article>
        ) : null}

        {meetings.map((meeting) => (
          <article key={meeting.id} className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">
                  {meeting.departmentName || 'Cross-department'}
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-[#241c33]">{meeting.title}</h3>
                <p className="mt-2 text-sm text-[#5f5673]">
                  {formatDisplayDate(meeting.meetingDate)} - created by {meeting.createdByName}
                </p>
              </div>
              <div className="space-y-2">
                <AttachmentUpload meetingId={meeting.id} />
                <EditMeetingLink meetingId={meeting.id} />
                <DeleteMeetingButton meetingId={meeting.id} />
              </div>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              <div className="rounded-2xl bg-[#fffaf0] p-4 xl:col-span-2">
                <h4 className="text-sm font-semibold text-[#241c33]">AI summary</h4>
                <p className="mt-2 text-sm text-[#5f5673]">
                  {meeting.aiSummary || 'No AI-generated summary captured yet.'}
                </p>
                {meeting.sourceDocumentR2Key ? (
                  <div className="mt-3">
                    {getAttachmentPublicUrl(meeting.sourceDocumentR2Key) ? (
                      <a
                        href={getAttachmentPublicUrl(meeting.sourceDocumentR2Key)!}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium text-[#4B248C] underline-offset-2 hover:underline"
                      >
                        Open source minutes document
                      </a>
                    ) : (
                      <p className="text-xs text-[#5f5673]">Source minutes document linked in storage.</p>
                    )}
                  </div>
                ) : null}
              </div>
              <div className="rounded-2xl bg-[#fbf9fe] p-4">
                <h4 className="text-sm font-semibold text-[#241c33]">Agenda</h4>
                <p className="mt-2 text-sm text-[#5f5673]">{meeting.agenda || 'No agenda supplied.'}</p>
              </div>
              <div className="rounded-2xl bg-[#fbf9fe] p-4">
                <h4 className="text-sm font-semibold text-[#241c33]">Decisions</h4>
                <p className="mt-2 text-sm text-[#5f5673]">{meeting.decisions || 'No decisions captured yet.'}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              <div className="rounded-2xl border border-[#e6def4] p-4">
                <h4 className="text-sm font-semibold text-[#241c33]">Attendees</h4>
                <p className="mt-2 text-sm text-[#5f5673]">
                  {meeting.attendees.length > 0
                    ? meeting.attendees.map((attendee) => attendee.name).join(', ')
                    : 'No attendees added.'}
                </p>
              </div>
              <div className="rounded-2xl border border-[#e6def4] p-4">
                <h4 className="text-sm font-semibold text-[#241c33]">Attachments</h4>
                {meeting.attachments.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {meeting.attachments.map((attachment) => {
                      const href = getAttachmentPublicUrl(attachment.r2Key);

                      if (!href) {
                        return (
                          <div key={attachment.id} className="flex items-center gap-2 rounded-full bg-white px-3 py-1">
                            <span className="text-xs text-[#5f5673]">{attachment.filename}</span>
                            <DeleteAttachmentButton attachmentId={attachment.id} />
                          </div>
                        );
                      }

                      return (
                        <div key={attachment.id} className="flex items-center gap-2 rounded-full bg-white px-3 py-1">
                          <a
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-medium text-[#4B248C] underline-offset-2 hover:underline"
                          >
                            {attachment.filename}
                          </a>
                          <DeleteAttachmentButton attachmentId={attachment.id} />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-[#5f5673]">No attachments registered yet.</p>
                )}
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <h4 className="text-sm font-semibold text-[#241c33]">Action items</h4>
              {meeting.actionItems.length === 0 ? (
                <p className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] px-4 py-3 text-sm text-[#5f5673]">
                  No action items for this meeting.
                </p>
              ) : (
                meeting.actionItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#241c33]">{item.description}</p>
                      <p className="mt-1 text-xs text-[#5f5673]">
                        {item.ownerName ? `Owner: ${item.ownerName}` : 'Owner unassigned'}
                        {item.dueDate ? ` - Due ${item.dueDate}` : ''}
                      </p>
                    </div>
                    <ActionItemToggle actionItemId={item.id} status={item.status} />
                  </div>
                ))
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
