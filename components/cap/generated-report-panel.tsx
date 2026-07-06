'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';

import { deleteGeneratedReportAction, generateDepartmentReportAction } from '@/app/actions/cap';
import type { GeneratedReport, ReportPeriodType } from '@/lib/cap/types';
import { formatDisplayDate } from '@/lib/cap/utils';

const periodOptions: Array<{ value: ReportPeriodType; label: string }> = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'custom', label: 'Custom range' },
];

export function GeneratedReportPanel({
  departmentId,
  initialStart,
  initialEnd,
  reports,
  canManageReports = false,
}: {
  departmentId: number;
  initialStart?: string;
  initialEnd?: string;
  reports: GeneratedReport[];
  canManageReports?: boolean;
}) {
  const [periodType, setPeriodType] = useState<ReportPeriodType>('monthly');
  const [start, setStart] = useState(initialStart || '');
  const [end, setEnd] = useState(initialEnd || '');
  const [feedback, setFeedback] = useState('');
  const [activeReport, setActiveReport] = useState<GeneratedReport | null>(reports[0] || null);
  const [localReports, setLocalReports] = useState(reports);
  const [pending, startTransition] = useTransition();
  const [copying, startCopyTransition] = useTransition();
  const [deleting, startDeleteTransition] = useTransition();

  const reportCards = useMemo(() => localReports.slice(0, 6), [localReports]);

  return (
    <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Groq reporting</p>
          <h3 className="mt-2 text-2xl font-semibold text-[#241c33]">Generate executive summary</h3>
          <p className="mt-2 text-sm text-[#5f5673]">
            CIOM Portal computes the numbers first, then turns them into a leadership-ready summary that can be saved,
            reopened, printed, or downloaded again as a Word document.
          </p>
        </div>

        <div className="mt-5 grid gap-4">
          <label className="space-y-2">
            <span className="text-sm font-medium text-[#241c33]">Period</span>
            <select
              value={periodType}
              onChange={(event) => setPeriodType(event.target.value as ReportPeriodType)}
              className="w-full rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33] outline-none"
            >
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {periodType === 'custom' ? (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-[#241c33]">Start date</span>
                <input
                  type="date"
                  value={start}
                  onChange={(event) => setStart(event.target.value)}
                  className="w-full rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33] outline-none"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-[#241c33]">End date</span>
                <input
                  type="date"
                  value={end}
                  onChange={(event) => setEnd(event.target.value)}
                  className="w-full rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33] outline-none"
                />
              </label>
            </div>
          ) : null}

          {feedback ? (
            <p className="rounded-2xl bg-[#f4effb] px-4 py-3 text-sm text-[#4B248C]">{feedback}</p>
          ) : null}

          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setFeedback('');
              startTransition(async () => {
                const result = await generateDepartmentReportAction({
                  departmentId,
                  periodType,
                  start,
                  end,
                });

                setFeedback(result.message);
                if (!result.success || !result.report) {
                  return;
                }

                setActiveReport(result.report);
                setLocalReports((current) => [result.report, ...current.filter((item) => item.id !== result.report!.id)]);
              });
            }}
            className="rounded-2xl bg-[#4B248C] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? 'Generating report...' : 'Generate report'}
          </button>
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8a7ca7]">Recent reports</h4>
            <Link
              href={`/insights/reports?departmentId=${departmentId}`}
              className="text-xs font-semibold uppercase tracking-[0.2em] text-[#4B248C]"
            >
              View archive
            </Link>
          </div>
          {reportCards.length === 0 ? (
            <p className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] px-4 py-4 text-sm text-[#5f5673]">
              No reports generated yet for this department. Create the first one above, then use the archive to reopen
              or export it again later.
            </p>
          ) : (
            reportCards.map((report) => (
              <button
                key={report.id}
                type="button"
                onClick={() => setActiveReport(report)}
                className={`w-full rounded-2xl border px-4 py-3 text-left text-sm ${
                  activeReport?.id === report.id
                    ? 'border-[#c9a461] bg-[#fff8eb]'
                    : 'border-[#e6def4] bg-[#fbf9fe]'
                }`}
              >
                <span className="block font-medium text-[#241c33]">
                  {report.periodType} report: {report.periodStart} to {report.periodEnd}
                </span>
                <span className="mt-1 block text-xs text-[#5f5673]">
                  Generated {report.generatedAt.slice(0, 10)}
                </span>
              </button>
            ))
          )}
        </div>
      </article>

      <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Executive output</p>
            <h3 className="mt-2 text-2xl font-semibold text-[#241c33]">Leadership report</h3>
            <p className="mt-2 text-sm text-[#5f5673]">
              This panel is for record-based leadership summaries. Meeting source files and minutes attachments stay in
              the Meetings workflow, while report DOCX export is handled here.
            </p>
          </div>
          {activeReport ? (
            <span className="rounded-full bg-[#ede7f7] px-3 py-1 text-xs font-medium text-[#4B248C]">
              {activeReport.periodStart} to {activeReport.periodEnd}
            </span>
          ) : null}
        </div>

        {activeReport ? (
          <div className="mt-5 space-y-5">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={copying}
                onClick={() => {
                  setFeedback('');
                  startCopyTransition(async () => {
                    try {
                      await navigator.clipboard.writeText(activeReport.summaryText);
                      setFeedback('Executive summary copied to clipboard.');
                    } catch {
                      setFeedback('Clipboard copy failed on this browser.');
                    }
                  });
                }}
                className="rounded-2xl border border-[#d9cfee] px-4 py-2 text-sm font-semibold text-[#241c33] disabled:opacity-60"
              >
                {copying ? 'Copying...' : 'Copy summary'}
              </button>
              <a
                href={`/api/reports/${activeReport.id}/docx`}
                className="rounded-2xl bg-[#4B248C] px-4 py-2 text-sm font-semibold text-white"
              >
                Download DOCX
              </a>
              <details className="group relative">
                <summary className="list-none rounded-2xl border border-[#d9cfee] px-4 py-2 text-sm font-semibold text-[#241c33] cursor-pointer">
                  More actions
                </summary>
                <div className="absolute right-0 top-[calc(100%+0.5rem)] z-10 min-w-[220px] rounded-2xl border border-[#e6def4] bg-white p-2 shadow-lg">
                  <Link
                    href={`/insights/reports/${activeReport.id}`}
                    className="block rounded-xl px-3 py-2 text-sm text-[#241c33] hover:bg-[#fbf9fe]"
                  >
                    Open Print View
                  </Link>
                  {canManageReports ? (
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={() => {
                        setFeedback('');
                        startDeleteTransition(async () => {
                          const result = await deleteGeneratedReportAction(activeReport.id);
                          setFeedback(result.message);
                          if (!result.success) {
                            return;
                          }

                          setLocalReports((current) => {
                            const next = current.filter((item) => item.id !== activeReport.id);
                            setActiveReport(next[0] || null);
                            return next;
                          });
                        });
                      }}
                      className="mt-1 block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-[#8c2436] hover:bg-[#fff6f6] disabled:opacity-60"
                    >
                      {deleting ? 'Deleting...' : 'Delete report'}
                    </button>
                  ) : null}
                </div>
              </details>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4 text-sm text-[#5f5673]">
                <p className="text-xs uppercase tracking-[0.2em] text-[#8a7ca7]">Generated by</p>
                <p className="mt-2 font-medium text-[#241c33]">
                  {activeReport.generatedByName || 'CIOM Portal leadership workflow'}
                </p>
                <p className="mt-1">
                  {formatDisplayDate(activeReport.periodStart)} to {formatDisplayDate(activeReport.periodEnd)}
                </p>
              </div>
              <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4 text-sm text-[#5f5673]">
                <p className="text-xs uppercase tracking-[0.2em] text-[#8a7ca7]">Comparison window</p>
                <p className="mt-2 font-medium text-[#241c33]">
                  {formatDisplayDate(activeReport.dataSnapshot.previousPeriodStart)} to{' '}
                  {formatDisplayDate(activeReport.dataSnapshot.previousPeriodEnd)}
                </p>
                <p className="mt-1">Previous period baseline used for change detection and anomaly context.</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-[#fbf9fe] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[#8a7ca7]">Records</p>
                <p className="mt-2 text-2xl font-semibold text-[#241c33]">{activeReport.dataSnapshot.recordCount}</p>
              </div>
              <div className="rounded-2xl bg-[#fbf9fe] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[#8a7ca7]">Visitors</p>
                <p className="mt-2 text-2xl font-semibold text-[#241c33]">{activeReport.dataSnapshot.totalVisitors}</p>
              </div>
              <div className="rounded-2xl bg-[#fbf9fe] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[#8a7ca7]">Anomalies</p>
                <p className="mt-2 text-2xl font-semibold text-[#241c33]">{activeReport.dataSnapshot.anomalyCount}</p>
              </div>
            </div>

            <div className="rounded-3xl bg-[#fffaf0] p-5">
              <p className="whitespace-pre-wrap text-sm leading-7 text-[#3d3452]">{activeReport.summaryText}</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {activeReport.dataSnapshot.totals.map((metric) => (
                <div key={metric.fieldKey} className="rounded-2xl border border-[#efe5c5] bg-[#fffdfa] p-4">
                  <p className="text-sm font-semibold text-[#241c33]">{metric.label}</p>
                  <p className="mt-2 text-xl font-semibold text-[#241c33]">{metric.total.toFixed(2)}</p>
                  <p className="mt-1 text-xs text-[#5f5673]">
                    Previous: {metric.previousTotal.toFixed(2)}
                    {metric.changePercent === null ? ' | New period comparison' : ` | ${metric.changePercent >= 0 ? '+' : ''}${metric.changePercent.toFixed(1)}%`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-[#e6def4] bg-[#fbf9fe] px-4 py-8 text-sm text-[#5f5673]">
            Generate a report to see the executive summary here, then open the print view or download the DOCX copy for
            leadership sharing.
          </div>
        )}
      </article>
    </section>
  );
}
