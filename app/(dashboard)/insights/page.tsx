import { notFound } from 'next/navigation';

import { getSession } from '@/lib/cap/auth';
import {
  getInsightsForDepartment,
  listDepartmentsForUser,
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
  const departments = await listDepartmentsForUser(session!.user);
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
            Track department metrics over time, net position where applicable, and handler accountability.
          </p>
        </div>

        <form className="flex flex-wrap gap-3 rounded-2xl border border-[#ddd3f0] bg-white p-3 shadow-sm">
          <select name="departmentId" defaultValue={String(selectedDepartmentId)} className="rounded-xl border border-[#d9d0ec] bg-[#faf8ff] px-3 py-2 text-sm text-[#241c33]">
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
          <input type="date" name="start" defaultValue={params.start} className="rounded-xl border border-[#d9d0ec] bg-[#faf8ff] px-3 py-2 text-sm text-[#241c33]" />
          <input type="date" name="end" defaultValue={params.end} className="rounded-xl border border-[#d9d0ec] bg-[#faf8ff] px-3 py-2 text-sm text-[#241c33]" />
          <button type="submit" className="rounded-xl bg-[#4B248C] px-4 py-2 text-sm font-medium text-white">
            Refresh
          </button>
        </form>
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
