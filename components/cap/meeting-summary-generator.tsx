'use client';

import { useState, useTransition } from 'react';

import { generateMeetingSummaryDocumentAction } from '@/app/actions/cap';
import type { Department, GeneratedMeetingDocument } from '@/lib/cap/types';

export function MeetingSummaryGenerator({
  departments,
  documents,
}: {
  departments: Department[];
  documents: GeneratedMeetingDocument[];
}) {
  const firstDepartmentId = departments[0]?.id ?? null;
  const [departmentId, setDepartmentId] = useState<number | null>(firstDepartmentId);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [feedback, setFeedback] = useState('');
  const [items, setItems] = useState(documents);
  const [pending, startTransition] = useTransition();

  const visibleItems = departmentId === null ? [] : items.filter((item) => item.departmentId === departmentId);

  if (departments.length === 0) {
    return (
      <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">AI document summary</p>
        <h3 className="mt-2 text-2xl font-semibold text-[#241c33]">Summarize multiple meetings into one document</h3>
        <p className="mt-3 rounded-2xl border border-[#e6def4] bg-[#fbf9fe] px-4 py-3 text-sm text-[#5f5673]">
          Meeting summary documents will appear once at least one department is available in your account context.
        </p>
      </article>
    );
  }

  return (
    <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">
            AI document summary
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-[#241c33]">
            Summarize multiple meetings into one document
          </h3>
          <p className="mt-2 max-w-3xl text-sm text-[#5f5673]">
            Pick a department and period, and CIOM Portal will summarize the meetings in that range
            into one leadership-ready DOCX file, then store it in R2 for reuse.
          </p>
        </div>
        <div className="rounded-full bg-[#ede7f7] px-3 py-1 text-xs font-medium text-[#4B248C]">
          {items.length} stored document{items.length === 1 ? '' : 's'}
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4 rounded-3xl border border-[#e6def4] bg-[#fbf9fe] p-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-[#241c33]">Department</span>
            <select
              value={departmentId ?? ''}
              onChange={(event) => setDepartmentId(Number(event.target.value))}
              className="w-full rounded-2xl border border-[#d9cfee] bg-white px-4 py-3 text-sm text-[#241c33] outline-none"
            >
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-[#241c33]">Start date</span>
              <input
                type="date"
                value={start}
                onChange={(event) => setStart(event.target.value)}
                className="w-full rounded-2xl border border-[#d9cfee] bg-white px-4 py-3 text-sm text-[#241c33] outline-none"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-[#241c33]">End date</span>
              <input
                type="date"
                value={end}
                onChange={(event) => setEnd(event.target.value)}
                className="w-full rounded-2xl border border-[#d9cfee] bg-white px-4 py-3 text-sm text-[#241c33] outline-none"
              />
            </label>
          </div>

          <button
            type="button"
            disabled={pending || departmentId === null}
            onClick={() => {
              setFeedback('');
              startTransition(async () => {
                try {
                  const result = await generateMeetingSummaryDocumentAction({
                    departmentId: departmentId!,
                    start,
                    end,
                  });
                  setFeedback(result.message);
                  if (!result.success || !result.document) {
                    return;
                  }

                  setItems((current) => [result.document, ...current]);
                } catch (error) {
                  setFeedback(error instanceof Error ? error.message : 'Meeting summary generation failed unexpectedly.');
                }
              });
            }}
            className="rounded-2xl bg-[#4B248C] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? 'Generating summary document...' : 'Generate meeting summary DOCX'}
          </button>

          {feedback ? (
            <p className="rounded-2xl bg-white px-4 py-3 text-sm text-[#4B248C]">{feedback}</p>
          ) : null}
        </div>

        <div className="space-y-3">
          {visibleItems.length === 0 ? (
            <div className="rounded-3xl border border-[#e6def4] bg-[#fbf9fe] p-5 text-sm text-[#5f5673]">
              No generated meeting-summary documents yet for this department.
            </div>
          ) : (
            visibleItems.map((item) => (
              <div key={item.id} className="rounded-3xl border border-[#e6def4] bg-[#fbf9fe] p-4">
                <p className="text-sm font-semibold text-[#241c33]">{item.filename}</p>
                <p className="mt-1 text-xs text-[#7a7190]">
                  Stored {item.uploadedAt}
                  {item.uploadedByName ? ` by ${item.uploadedByName}` : ''}
                </p>
                {item.publicUrl ? (
                  <a
                    href={item.publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex rounded-2xl border border-[#d9cfee] px-4 py-2 text-sm font-medium text-[#4B248C]"
                  >
                    Open stored document
                  </a>
                ) : (
                  <p className="mt-3 text-xs text-[#5f5673]">
                    Stored in R2, but no public base URL is configured for direct browser opening yet.
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </article>
  );
}
