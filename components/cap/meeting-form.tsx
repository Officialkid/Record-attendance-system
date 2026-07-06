'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';

import {
  createAttachmentUploadAction,
  createMeetingAction,
  processMeetingMinutesAction,
  updateMeetingAction,
} from '@/app/actions/cap';
import { processMeetingMinutesFileAction } from '@/app/actions/meeting-minutes';
import type { ActionStatus, Department, MeetingSummary, UserRecord } from '@/lib/cap/types';

type ActionItemDraft = {
  id: number;
  description: string;
  ownerUserId: string;
  status: ActionStatus;
  dueDate: string;
};

interface MeetingFormProps {
  departments: Department[];
  users: UserRecord[];
  defaultMeetingDate: string;
  canCreateCrossDepartment?: boolean;
  defaultDepartmentId?: number | null;
  existingMeeting?: MeetingSummary;
}

function buildActionItemDrafts(existingMeeting?: MeetingSummary): ActionItemDraft[] {
  if (!existingMeeting) {
    return [];
  }

  return existingMeeting.actionItems.map((item, index) => ({
    id: item.id || Date.now() + index,
    description: item.description,
    ownerUserId: item.ownerUserId ? String(item.ownerUserId) : '',
    status: item.status,
    dueDate: item.dueDate || '',
  }));
}

export function MeetingForm({
  departments,
  users,
  defaultMeetingDate,
  canCreateCrossDepartment = false,
  defaultDepartmentId = null,
  existingMeeting,
}: MeetingFormProps) {
  const router = useRouter();
  const isEditing = Boolean(existingMeeting);
  const [departmentId, setDepartmentId] = useState(
    existingMeeting?.departmentId
      ? String(existingMeeting.departmentId)
      : defaultDepartmentId
        ? String(defaultDepartmentId)
        : ''
  );
  const [title, setTitle] = useState(existingMeeting?.title || '');
  const [meetingDate, setMeetingDate] = useState(existingMeeting?.meetingDate || defaultMeetingDate);
  const [agenda, setAgenda] = useState(existingMeeting?.agenda || '');
  const [decisions, setDecisions] = useState(existingMeeting?.decisions || '');
  const [aiSummary, setAiSummary] = useState(existingMeeting?.aiSummary || '');
  const [sourceNotes, setSourceNotes] = useState('');
  const [sourceDocumentFile, setSourceDocumentFile] = useState<File | null>(null);
  const [sourceDocumentKey, setSourceDocumentKey] = useState(existingMeeting?.sourceDocumentR2Key || '');
  const [nextMeetingDate, setNextMeetingDate] = useState(existingMeeting?.nextMeetingDate || '');
  const [attendeeUserIds, setAttendeeUserIds] = useState<number[]>(
    existingMeeting?.attendees.map((attendee) => attendee.id) || []
  );
  const [actionItems, setActionItems] = useState<ActionItemDraft[]>(
    buildActionItemDrafts(existingMeeting)
  );
  const [feedback, setFeedback] = useState('');
  const [pending, startTransition] = useTransition();
  const [processingMinutes, startMinutesTransition] = useTransition();
  const [processingFileMinutes, startFileMinutesTransition] = useTransition();
  const visibleUsers = useMemo(() => {
    const selectedDepartmentId = departmentId ? Number(departmentId) : null;
    if (!selectedDepartmentId) {
      return users;
    }

    return users.filter((user) => user.departmentIds.includes(selectedDepartmentId));
  }, [departmentId, users]);

  const applyMinutesSuggestion = (
    suggestion: NonNullable<Awaited<ReturnType<typeof processMeetingMinutesAction>>['suggestion']>
  ) => {
    if (suggestion.title?.trim() && !title.trim()) {
      setTitle(suggestion.title.trim());
    }

    if (suggestion.meetingDate?.trim() && /^\d{4}-\d{2}-\d{2}$/.test(suggestion.meetingDate.trim())) {
      setMeetingDate(suggestion.meetingDate.trim());
    }

    if (
      suggestion.nextMeetingDate?.trim() &&
      /^\d{4}-\d{2}-\d{2}$/.test(suggestion.nextMeetingDate.trim()) &&
      !nextMeetingDate.trim()
    ) {
      setNextMeetingDate(suggestion.nextMeetingDate.trim());
    }

    if (suggestion.agenda?.trim() && !agenda.trim()) {
      setAgenda(suggestion.agenda.trim());
    }

    setAiSummary(suggestion.summary || '');
    setDecisions((current) => current || suggestion.decisions || '');
    setActionItems((current) => {
      const suggestions = suggestion.actionItems.map((item, index) => {
        const matchingUser = item.ownerName
          ? users.find((user) => user.name.toLowerCase() === item.ownerName!.toLowerCase())
          : null;

        return {
          id: Date.now() + index,
          description: item.description,
          ownerUserId: matchingUser ? String(matchingUser.id) : '',
          status: 'open' as const,
          dueDate: item.dueDate || '',
        };
      });

      return [...current, ...suggestions.filter((item) => item.description.trim())];
    });
  };

  const toggleAttendee = (userId: number) => {
    setAttendeeUserIds((current) =>
      current.includes(userId) ? current.filter((value) => value !== userId) : [...current, userId]
    );
  };

  const addActionItem = () => {
    setActionItems((current) => [
      ...current,
      {
        id: Date.now(),
        description: '',
        ownerUserId: '',
        status: 'open',
        dueDate: '',
      },
    ]);
  };

  const updateActionItem = (id: number, key: keyof ActionItemDraft, value: string) => {
    setActionItems((current) =>
      current.map((item) => (item.id === id ? { ...item, [key]: value } : item))
    );
  };

  const removeActionItem = (id: number) => {
    setActionItems((current) => current.filter((item) => item.id !== id));
  };

  const handleMinutesExtraction = () => {
    setFeedback('');

    startMinutesTransition(async () => {
      try {
        const result = await processMeetingMinutesAction(sourceNotes);
        if (!result.success || !result.suggestion) {
          setFeedback(result.message);
          return;
        }

        applyMinutesSuggestion(result.suggestion);
        setFeedback(result.message);
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : 'Minutes extraction failed unexpectedly.');
      }
    });
  };

  const handleMinutesFileExtraction = () => {
    if (!sourceDocumentFile) {
      setFeedback('Choose a .txt, .docx, or .pdf meeting minutes file first.');
      return;
    }

    setFeedback('');
    startFileMinutesTransition(async () => {
      try {
        const uploadPlan = await createAttachmentUploadAction({
          filename: sourceDocumentFile.name,
          contentType: sourceDocumentFile.type || 'application/octet-stream',
        });

        if (!uploadPlan.success || !uploadPlan.uploadUrl || !uploadPlan.key) {
          setFeedback(uploadPlan.message);
          return;
        }

        const uploadResponse = await fetch(uploadPlan.uploadUrl, {
          method: 'PUT',
          body: sourceDocumentFile,
          headers: {
            'Content-Type': sourceDocumentFile.type || 'application/octet-stream',
          },
        });

        if (!uploadResponse.ok) {
          setFeedback('Minutes file upload failed before processing.');
          return;
        }

        setSourceDocumentKey(uploadPlan.key);

        const formData = new FormData();
        formData.append('file', sourceDocumentFile);
        const result = await processMeetingMinutesFileAction(formData);
        if (!result.success || !result.suggestion) {
          setFeedback(result.message);
          return;
        }

        setSourceNotes(result.extractedText || '');
        applyMinutesSuggestion(result.suggestion);
        setFeedback(result.message);
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : 'Minutes file processing failed unexpectedly.');
      }
    });
  };

  const resetForm = () => {
    setDepartmentId(defaultDepartmentId ? String(defaultDepartmentId) : '');
    setTitle('');
    setMeetingDate(defaultMeetingDate);
    setAgenda('');
    setDecisions('');
    setAiSummary('');
    setSourceNotes('');
    setSourceDocumentFile(null);
    setSourceDocumentKey('');
    setNextMeetingDate('');
    setAttendeeUserIds([]);
    setActionItems([]);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback('');

    startTransition(async () => {
      try {
        const payload = {
          departmentId: departmentId ? Number(departmentId) : null,
          title,
          meetingDate,
          agenda,
          decisions,
          aiSummary,
          sourceDocumentR2Key: sourceDocumentKey,
          nextMeetingDate,
          attendeeUserIds,
          actionItems: actionItems
            .filter((item) => item.description.trim())
            .map((item) => ({
              id: item.id,
              description: item.description.trim(),
              ownerUserId: item.ownerUserId ? Number(item.ownerUserId) : null,
              status: item.status,
              dueDate: item.dueDate,
            })),
        };

        const result = isEditing
          ? await updateMeetingAction({
              meetingId: existingMeeting!.id,
              ...payload,
            })
          : await createMeetingAction(payload);

        setFeedback(result.message);

        if (!result.success) {
          return;
        }

        if (!isEditing) {
          resetForm();
        }

        router.refresh();
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : 'Meeting save failed unexpectedly.');
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm xl:grid-cols-2"
    >
      <div className="rounded-[24px] border border-[#e6def4] bg-[#fbf9fe] p-5 xl:col-span-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#4B248C]">Meeting flow</p>
        <h3 className="mt-2 text-xl font-semibold text-[#241c33]">
          Capture the meeting once, then let the archive and generated documents carry the rest.
        </h3>
        <p className="mt-2 text-sm text-[#5f5673]">
          Keep the title, agenda, AI summary, and decisions short enough to be readable in leadership review, then add
          action items only where true follow-up is needed.
        </p>
      </div>

      <label className="space-y-2">
        <span className="text-sm font-medium text-[#241c33]">Meeting title</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          className="w-full rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33] outline-none"
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-medium text-[#241c33]">Meeting date</span>
        <input
          type="date"
          value={meetingDate}
          onChange={(event) => setMeetingDate(event.target.value)}
          required
          className="w-full rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33] outline-none"
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-medium text-[#241c33]">Department</span>
        <select
          value={departmentId}
          onChange={(event) => setDepartmentId(event.target.value)}
          className="w-full rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33] outline-none"
        >
          {canCreateCrossDepartment ? <option value="">Cross-department</option> : null}
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-2">
        <span className="text-sm font-medium text-[#241c33]">Next meeting date</span>
        <input
          type="date"
          value={nextMeetingDate}
          onChange={(event) => setNextMeetingDate(event.target.value)}
          className="w-full rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33] outline-none"
        />
      </label>

      <label className="space-y-2 xl:col-span-2">
        <span className="text-sm font-medium text-[#241c33]">Agenda</span>
        <textarea
          value={agenda}
          onChange={(event) => setAgenda(event.target.value)}
          rows={3}
          className="w-full rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33] outline-none"
        />
      </label>

      <div className="space-y-3 rounded-[28px] border border-[#e2d2ae] bg-[#fffaf0] p-5 xl:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-[#241c33]">AI minutes assistant</h3>
            <p className="text-sm text-[#5f5673]">
              Paste raw point-form notes or fuller minutes and CIOM Portal will try to prefill the title, dates,
              agenda, summary, decisions, and action items from the minutes.
            </p>
          </div>
          <button
            type="button"
            onClick={handleMinutesExtraction}
            disabled={processingMinutes || sourceNotes.trim().length < 20}
            className="rounded-2xl bg-[#C9A461] px-4 py-2 text-sm font-semibold text-[#241c33] disabled:opacity-60"
          >
            {processingMinutes ? 'Processing notes...' : 'Extract suggestions'}
          </button>
        </div>

        <textarea
          value={sourceNotes}
          onChange={(event) => setSourceNotes(event.target.value)}
          rows={6}
          placeholder="Paste meeting minutes, notes, or raw text here..."
          className="w-full rounded-2xl border border-[#ecdcb6] bg-white px-4 py-3 text-sm text-[#241c33] outline-none"
        />

        <div className="rounded-2xl border border-[#ecdcb6] bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-[#241c33]">Upload minutes file</p>
              <p className="mt-1 text-xs text-[#5f5673]">
                Supported: `.txt`, `.docx`, and `.pdf`. CIOM Portal uploads the source file to storage first, then
                extracts the text for review and action-item drafting.
              </p>
            </div>
            <button
              type="button"
              onClick={handleMinutesFileExtraction}
              disabled={processingFileMinutes || !sourceDocumentFile}
              className="rounded-2xl border border-[#d9cfee] px-4 py-2 text-sm font-semibold text-[#241c33] disabled:opacity-60"
            >
              {processingFileMinutes ? 'Processing file...' : 'Process uploaded file'}
            </button>
          </div>

          <input
            type="file"
            accept=".txt,.docx,.pdf,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(event) => setSourceDocumentFile(event.target.files?.[0] || null)}
            className="mt-4 text-sm"
          />

          {sourceDocumentKey ? (
            <p className="mt-3 text-xs text-[#5f5673]">
              Source document uploaded and linked to this meeting draft.
            </p>
          ) : null}
        </div>
      </div>

      <label className="space-y-2 xl:col-span-2">
        <span className="text-sm font-medium text-[#241c33]">AI summary</span>
        <textarea
          value={aiSummary}
          onChange={(event) => setAiSummary(event.target.value)}
          rows={3}
          className="w-full rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33] outline-none"
        />
      </label>

      <label className="space-y-2 xl:col-span-2">
        <span className="text-sm font-medium text-[#241c33]">Decisions</span>
        <textarea
          value={decisions}
          onChange={(event) => setDecisions(event.target.value)}
          rows={3}
          className="w-full rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33] outline-none"
        />
      </label>

      <div className="space-y-3 xl:col-span-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-[#241c33]">Attendees</h3>
            <p className="text-sm text-[#5f5673]">Choose ministry users who were present.</p>
          </div>
          <p className="rounded-full bg-[#ede7f7] px-3 py-1 text-xs font-medium text-[#4B248C]">
            {attendeeUserIds.length} selected
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visibleUsers.map((user) => {
            const checked = attendeeUserIds.includes(user.id);
            return (
              <label
                key={user.id}
                className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
                  checked ? 'border-[#c9a461] bg-[#fff8eb]' : 'border-[#e6def4] bg-[#fbf9fe]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleAttendee(user.id)}
                  className="mt-1"
                />
                <span className="text-[#241c33]">
                  <span className="block font-medium">{user.name}</span>
                  <span className="text-xs text-[#5f5673]">
                    {user.role} - {user.email}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
        {visibleUsers.length === 0 ? (
          <p className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] px-4 py-3 text-sm text-[#5f5673]">
            No visible users are available for the current department selection yet.
          </p>
        ) : null}
      </div>

      <div className="space-y-4 xl:col-span-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-[#241c33]">Action items</h3>
            <p className="text-sm text-[#5f5673]">Capture follow-up, owners, and due dates.</p>
          </div>
          <button
            type="button"
            onClick={addActionItem}
            className="inline-flex items-center gap-2 rounded-xl bg-[#4B248C] px-3 py-2 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" />
            <span>Add action item</span>
          </button>
        </div>

        {actionItems.length === 0 ? (
          <p className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] px-4 py-4 text-sm text-[#5f5673]">
            No action items added yet.
          </p>
        ) : (
          <div className="space-y-3">
            {actionItems.map((item) => (
              <div
                key={item.id}
                className="grid gap-3 rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4 md:grid-cols-[1.4fr_1fr_1fr_auto]"
              >
                <input
                  value={item.description}
                  onChange={(event) => updateActionItem(item.id, 'description', event.target.value)}
                  placeholder="Action item description"
                  className="rounded-2xl border border-[#d9cfee] bg-white px-4 py-3 text-sm text-[#241c33] outline-none"
                />
                <select
                  value={item.ownerUserId}
                  onChange={(event) => updateActionItem(item.id, 'ownerUserId', event.target.value)}
                  className="rounded-2xl border border-[#d9cfee] bg-white px-4 py-3 text-sm text-[#241c33] outline-none"
                >
                  <option value="">Owner</option>
                  {visibleUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={item.dueDate}
                  onChange={(event) => updateActionItem(item.id, 'dueDate', event.target.value)}
                  className="rounded-2xl border border-[#d9cfee] bg-white px-4 py-3 text-sm text-[#241c33] outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeActionItem(item.id)}
                  className="inline-flex items-center justify-center rounded-2xl border border-[#e2d2ae] bg-white px-4 py-3 text-[#c9a461]"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {feedback ? (
        <p className="xl:col-span-2 rounded-2xl bg-[#f4effb] px-4 py-3 text-sm text-[#4B248C]">
          {feedback}
        </p>
      ) : null}

      <div className="xl:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-2xl bg-[#4B248C] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending
            ? isEditing
              ? 'Updating meeting...'
              : 'Saving meeting...'
            : isEditing
              ? 'Update meeting'
              : 'Save meeting'}
        </button>
      </div>
    </form>
  );
}
