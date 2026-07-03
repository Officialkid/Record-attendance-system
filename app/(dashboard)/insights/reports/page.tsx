import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getSession } from '@/lib/cap/auth';
import { listDepartmentsForUser, listGeneratedReportsForDepartment } from '@/lib/cap/services';
import { formatDisplayDate } from '@/lib/cap/utils';

export default async function ReportArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ departmentId?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();
  const departments = await listDepartmentsForUser(session!.user);
  const selectedDepartmentId = Number(params.departmentId || departments[0]?.id || 1);

  if (!departments.some((department) => department.id === selectedDepartmentId)) {
    notFound();
  }

  const reports = await listGeneratedReportsForDepartment(session!.user, selectedDepartmentId, 100);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Report archive</p>
          <h2 className="mt-2 text-3xl font-semibold text-[#241c33]">Generated leadership reports</h2>
          <p className="mt-2 text-sm text-[#5f5673]">
            Review every persisted executive summary generated from the CAP insights engine.
          </p>
        </div>

        <form className="flex flex-wrap gap-3 rounded-2xl border border-[#ddd3f0] bg-white p-3 shadow-sm">
          <select
            name="departmentId"
            defaultValue={String(selectedDepartmentId)}
            className="rounded-xl border border-[#d9d0ec] bg-[#faf8ff] px-3 py-2 text-sm text-[#241c33]"
          >
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-xl bg-[#4B248C] px-4 py-2 text-sm font-medium text-white">
            Switch
          </button>
          <Link
            href={`/insights?departmentId=${selectedDepartmentId}`}
            className="rounded-xl border border-[#d9cfee] px-4 py-2 text-sm font-medium text-[#241c33]"
          >
            Back to Insights
          </Link>
        </form>
      </div>

      <article className="overflow-hidden rounded-[28px] border border-[#ddd3f0] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#ece4f8] text-sm">
            <thead className="bg-[#fbf9fe] text-left text-[#5f5673]">
              <tr>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Generated</th>
                <th className="px-4 py-3">Author</th>
                <th className="px-4 py-3">Records</th>
                <th className="px-4 py-3">Visitors</th>
                <th className="px-4 py-3">Anomalies</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3eefb]">
              {reports.map((report) => (
                <tr key={report.id}>
                  <td className="px-4 py-4 font-medium text-[#241c33]">
                    {formatDisplayDate(report.periodStart)} to {formatDisplayDate(report.periodEnd)}
                  </td>
                  <td className="px-4 py-4 capitalize text-[#5f5673]">{report.periodType}</td>
                  <td className="px-4 py-4 text-[#5f5673]">{report.generatedAt.slice(0, 10)}</td>
                  <td className="px-4 py-4 text-[#5f5673]">{report.generatedByName || 'CAP workflow'}</td>
                  <td className="px-4 py-4 text-[#5f5673]">{report.dataSnapshot.recordCount}</td>
                  <td className="px-4 py-4 text-[#5f5673]">{report.dataSnapshot.totalVisitors}</td>
                  <td className="px-4 py-4 text-[#5f5673]">{report.dataSnapshot.anomalyCount}</td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/insights/reports/${report.id}`}
                        className="rounded-xl border border-[#d9cfee] px-3 py-2 font-medium text-[#241c33]"
                      >
                        Open
                      </Link>
                      <a
                        href={`/api/reports/${report.id}/docx`}
                        className="rounded-xl bg-[#4B248C] px-3 py-2 font-medium text-white"
                      >
                        DOCX
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-[#5f5673]">
                    No persisted reports exist for this department yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
