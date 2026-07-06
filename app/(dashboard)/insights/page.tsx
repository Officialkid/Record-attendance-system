import { notFound } from 'next/navigation';

import { getSession } from '@/lib/cap/auth';
import {
  getDepartmentFieldDefinitions,
  getInsightsForDepartment,
  listRecordWorkflowDepartmentsForUser,
  listGeneratedReportsForDepartment,
} from '@/lib/cap/services';
import { GeneratedReportPanel } from '@/components/cap/generated-report-panel';
import { InsightsCharts } from '@/components/cap/insights-charts';

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ departmentId?: string; start?: string; end?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();
  const allDepartments = await listRecordWorkflowDepartmentsForUser(session!.user);
  const fieldDefinitionsByDepartment = Object.fromEntries(
    await Promise.all(
      allDepartments.map(async (department) => [department.id, await getDepartmentFieldDefinitions(department.id)])
    )
  );
  const departments = allDepartments.filter(
    (department) => (fieldDefinitionsByDepartment[department.id] || []).length > 0
  );
  const isSystemAdmin =
    session!.user.systemRole === 'main_admin' || session!.user.systemRole === 'chief_admin';

  if (departments.length === 0) {
    return (
      <section className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Insight engine</p>
          <h2 className="mt-2 text-3xl font-semibold text-[#241c33]">Department trends</h2>
          <p className="mt-2 text-sm text-[#5f5673]">
            Insight reporting is currently driven by departments that use the weekly record workflow.
          </p>
        </div>

        <div className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 text-sm text-[#5f5673] shadow-sm">
          Your current access does not include a records-enabled department. Programs analysis happens inside Programs
          events, while Leadership uses its own workspace.
        </div>
      </section>
    );
  }

  const selectedDepartmentId = Number(params.departmentId || departments[0]?.id || 1);
  if (!departments.some((department) => department.id === selectedDepartmentId)) {
    notFound();
  }
  const insights = await getInsightsForDepartment(session!.user, selectedDepartmentId, {
    start: params.start,
    end: params.end,
  });
  const generatedReports = await listGeneratedReportsForDepartment(session!.user, selectedDepartmentId);
  const metricColumns = insights.series.filter((series) => series.fieldKey !== 'visitor_count');

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Insight engine</p>
          <h2 className="mt-2 text-3xl font-semibold text-[#241c33]">{insights.department.name} trends</h2>
          <p className="mt-2 text-sm text-[#5f5673]">
            Track department metrics over time, review anomaly flags, and generate leadership-ready summaries from the
            selected records range.
          </p>
        </div>

        <form className="flex flex-wrap gap-3 rounded-2xl border border-[#ddd3f0] bg-white p-3 shadow-sm">
          {isSystemAdmin ? (
            <select name="departmentId" defaultValue={String(selectedDepartmentId)} className="rounded-xl border border-[#d9d0ec] bg-[#faf8ff] px-3 py-2 text-sm text-[#241c33]">
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          ) : (
            <>
              <input type="hidden" name="departmentId" value={String(selectedDepartmentId)} />
              <div className="rounded-xl border border-[#d9d0ec] bg-[#faf8ff] px-3 py-2 text-sm font-medium text-[#241c33]">
                {departments.find((department) => department.id === selectedDepartmentId)?.name || 'Department'}
              </div>
            </>
          )}
          <input type="date" name="start" defaultValue={params.start} className="rounded-xl border border-[#d9d0ec] bg-[#faf8ff] px-3 py-2 text-sm text-[#241c33]" />
          <input type="date" name="end" defaultValue={params.end} className="rounded-xl border border-[#d9d0ec] bg-[#faf8ff] px-3 py-2 text-sm text-[#241c33]" />
          <button type="submit" className="rounded-xl bg-[#4B248C] px-4 py-2 text-sm font-medium text-white">
            Refresh
          </button>
        </form>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <article className="rounded-[24px] border border-[#eadfb8] bg-[#fffaf0] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b6841a]">What this page does</p>
          <h3 className="mt-2 text-xl font-semibold text-[#241c33]">Turns saved records into trends</h3>
          <p className="mt-2 text-sm text-[#5f5673]">
            Insights reads the department records already submitted in Weekly Record and Records. It does not invent
            figures. It summarizes what has been saved for the chosen period.
          </p>
        </article>

        <article className="rounded-[24px] border border-[#ddd3f0] bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#4B248C]">What the AI report uses</p>
          <h3 className="mt-2 text-xl font-semibold text-[#241c33]">Leadership summaries come from this range</h3>
          <p className="mt-2 text-sm text-[#5f5673]">
            When you generate a report, CIOM Portal passes this date range, totals, anomalies, and handler summary into
            the report engine, then stores the resulting summary for later review and DOCX export.
          </p>
        </article>

        <article className="rounded-[24px] border border-[#ddd3f0] bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#4B248C]">Current scope</p>
          <h3 className="mt-2 text-xl font-semibold text-[#241c33]">This report flow is record-based today</h3>
          <p className="mt-2 text-sm text-[#5f5673]">
            Meeting minutes, decisions, and action items live under Meetings. The current leadership report flow is
            driven by records and trends first, while meeting-based reporting can be added as the next reporting pass.
          </p>
        </article>
      </div>

      <InsightsCharts insights={insights} />

      <GeneratedReportPanel
        departmentId={selectedDepartmentId}
        initialStart={params.start}
        initialEnd={params.end}
        reports={generatedReports}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-[#241c33]">Anomaly watch</h3>
          <div className="mt-4 space-y-3">
            {insights.series.flatMap((series) =>
              series.points
                .filter((point) => point.anomaly)
                .map((point) => (
                  <div key={`${series.fieldKey}-${point.recordId}`} className="rounded-2xl border border-[#eadfb8] bg-[#fffbf0] p-4">
                    <p className="text-sm font-semibold text-[#241c33]">{series.label}</p>
                    <p className="mt-1 text-sm text-[#5f5673]">
                      Record on {point.recordDate} deviated from the trailing 4-week average.
                    </p>
                  </div>
                ))
            )}
            {insights.series.every((series) => series.points.every((point) => !point.anomaly)) ? (
              <p className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] px-4 py-4 text-sm text-[#5f5673]">
                No anomalies flagged in the selected date range.
              </p>
            ) : null}
          </div>
        </article>

        <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-[#241c33]">Per-handler accountability</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-[#ece4f8] text-sm">
              <thead className="bg-[#fbf9fe] text-left text-[#5f5673]">
                <tr>
                  <th className="px-4 py-3">Handler</th>
                  <th className="px-4 py-3">Weeks</th>
                  {metricColumns.map((metric) => (
                    <th key={metric.fieldKey} className="px-4 py-3">
                      {metric.label}
                    </th>
                  ))}
                  <th className="px-4 py-3">Visitors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3eefb]">
                {insights.handlerSummary.map((row) => (
                  <tr key={row.handledByUserId}>
                    <td className="px-4 py-3 font-medium text-[#241c33]">{row.handledByName}</td>
                    <td className="px-4 py-3 text-[#5f5673]">{row.weeksHandled}</td>
                    {row.metricTotals.map((metric) => (
                      <td key={metric.fieldKey} className="px-4 py-3 text-[#5f5673]">
                        {metric.value}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-[#5f5673]">{row.totalVisitors}</td>
                  </tr>
                ))}
                {insights.handlerSummary.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3 + metricColumns.length}
                      className="px-4 py-6 text-center text-[#5f5673]"
                    >
                      No records are available for the selected range yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>
  );
}
