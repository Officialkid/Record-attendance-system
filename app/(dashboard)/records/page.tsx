import Link from 'next/link';
import { notFound } from 'next/navigation';

import { DeleteRecordButton } from '@/components/cap/delete-record-button';
import { getSession } from '@/lib/cap/auth';
import {
  getDepartmentFieldDefinitions,
  listDepartmentsForUser,
  listRecordsForDepartment,
} from '@/lib/cap/services';
import { formatCurrency, formatDisplayDate } from '@/lib/cap/utils';

export default async function RecordsPage({
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
  const records = await listRecordsForDepartment(session!.user, selectedDepartmentId, {
    start: params.start,
    end: params.end,
  });
  const fieldDefinitions = await getDepartmentFieldDefinitions(selectedDepartmentId);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">
            Historical records
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-[#241c33]">Weekly record history</h2>
          <p className="mt-2 text-sm text-[#5f5673]">
            This archive is separate from Weekly Record. Leave the date filters empty to see every saved record for the selected department.
          </p>
        </div>

        <form className="flex flex-wrap gap-3 rounded-2xl border border-[#ddd3f0] bg-white p-3 shadow-sm">
          <select
            name="departmentId"
            defaultValue={String(selectedDepartmentId)}
            className="rounded-xl border border-[#d9cfee] bg-[#fbf9fe] px-3 py-2 text-sm text-[#241c33]"
          >
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            name="start"
            defaultValue={params.start}
            className="rounded-xl border border-[#d9cfee] bg-[#fbf9fe] px-3 py-2 text-sm text-[#241c33]"
          />
          <input
            type="date"
            name="end"
            defaultValue={params.end}
            className="rounded-xl border border-[#d9cfee] bg-[#fbf9fe] px-3 py-2 text-sm text-[#241c33]"
          />
          <button type="submit" className="rounded-xl bg-[#4B248C] px-4 py-2 text-sm font-medium text-white">
            Filter
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-[#ddd3f0] bg-white shadow-sm">
        {records.length === 0 ? (
          <div className="p-6 text-sm text-[#5f5673]">
            No records match the current filter. Clear the dates to load the full archive, or add a new weekly record to start the history for this department.
          </div>
        ) : (
        <table className="min-w-full divide-y divide-[#ece4f8] text-sm">
          <thead className="bg-[#fbf9fe] text-left text-[#5f5673]">
            <tr>
              <th className="px-5 py-4">Date</th>
              <th className="px-5 py-4">Department</th>
              <th className="px-5 py-4">Handled by</th>
              <th className="px-5 py-4">Metrics</th>
              <th className="px-5 py-4">Visitors</th>
              <th className="px-5 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f4effb]">
            {records.map((record) => {
              const values = record.values as Record<string, number | string | null | undefined>;

              return (
                <tr key={record.id}>
                  <td className="px-5 py-4 font-medium text-[#241c33]">
                    {formatDisplayDate(record.recordDate)}
                  </td>
                  <td className="px-5 py-4 text-[#5f5673]">{record.departmentName}</td>
                  <td className="px-5 py-4 text-[#5f5673]">{record.handledByName}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      {fieldDefinitions.map((field) => {
                        const rawValue = values[field.fieldKey];
                        const displayValue =
                          field.fieldType === 'currency'
                            ? formatCurrency(Number(rawValue || 0))
                            : Array.isArray(rawValue)
                              ? rawValue.join(', ')
                            : rawValue ?? '-';

                        return (
                          <span
                            key={`${record.id}-${field.fieldKey}`}
                            className="rounded-full bg-[#f4effb] px-3 py-1 text-xs text-[#4B248C]"
                          >
                            {field.label}: {displayValue}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[#5f5673]">{record.visitorCount}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/records/${record.id}/edit`}
                        className="rounded-xl bg-[#ede7f7] px-3 py-2 text-xs font-medium text-[#4B248C]"
                      >
                        Edit
                      </Link>
                      <DeleteRecordButton recordId={record.id} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        )}
      </div>
    </section>
  );
}
