import { notFound } from 'next/navigation';

import { GeneratedReportPanel } from '@/components/cap/generated-report-panel';
import { InsightsCharts } from '@/components/cap/insights-charts';
import { getSession } from '@/lib/cap/auth';
import {
  getDepartmentFieldDefinitions,
  getInsightsForDepartment,
  listGeneratedReportsForDepartment,
  listRecordWorkflowDepartmentsForUser,
} from '@/lib/cap/services';

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

  const canManageReports =
    isSystemAdmin || session!.user.departmentRoles[selectedDepartmentId] === 'department_admin';
  const insights = await getInsightsForDepartment(session!.user, selectedDepartmentId, {
    start: params.start,
    end: params.end,
  });
  const generatedReports = await listGeneratedReportsForDepartment(session!.user, selectedDepartmentId);
  const metricColumns = insights.series.filter((series) => series.fieldKey !== 'visitor_count');

  const fullInsightsParams = new URLSearchParams();
  fullInsightsParams.set('departmentId', String(selectedDepartmentId));
  if (params.start && params.end) {
    fullInsightsParams.set('range', 'custom');
    fullInsightsParams.set('start', params.start);
    fullInsightsParams.set('end', params.end);
  } else {
    fullInsightsParams.set('range', '3m');
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Insight engine</p>
          <h2 className="mt-2 text-3xl font-semibold text-[#241c33]">{insights.department.name} trends</h2>
          <p className="mt-2 text-sm text-[#5f5673]">
            Keep this page as the light summary, then open the shared full-analysis page whenever leadership needs the exact chart-by-chart story.
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

      <article className="rounded-[24px] border border-[#ddd3f0] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#4B248C]">Insight flow</p>
            <h3 className="mt-2 text-xl font-semibold text-[#241c33]">Simple summary first</h3>
            <p className="mt-2 max-w-4xl text-sm text-[#5f5673]">
              Insights reads the saved records for this department, keeps this page light, and routes the full weekly breakdown into one shared analysis page instead of opening chart blocks below each card.
            </p>
          </div>
          <a
            href={`/insights/full?${fullInsightsParams.toString()}`}
            className="rounded-2xl bg-[#4B248C] px-4 py-3 text-sm font-semibold text-white"
          >
            Open full analysis
          </a>
        </div>
      </article>

      <InsightsCharts insights={insights} fullInsightsBaseHref={`/insights/full?${fullInsightsParams.toString()}`} />

      <GeneratedReportPanel
        departmentId={selectedDepartmentId}
        initialStart={params.start}
        initialEnd={params.end}
        reports={generatedReports}
        canManageReports={canManageReports}
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
                    <td colSpan={3 + metricColumns.length} className="px-4 py-6 text-center text-[#5f5673]">
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
