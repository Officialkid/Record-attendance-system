import Link from 'next/link';
import { notFound } from 'next/navigation';

import { DeleteRecordButton } from '@/components/cap/delete-record-button';
import { getSession } from '@/lib/cap/auth';
import {
  getDepartmentFieldDefinitions,
  listRecordWorkflowDepartmentsForUser,
  listRecordsForDepartment,
} from '@/lib/cap/services';
import type { DepartmentFieldDefinition } from '@/lib/cap/types';
import { formatCurrency, formatDisplayDate } from '@/lib/cap/utils';

export default async function RecordsPage({
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
      <section className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">
            Historical records
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-[#241c33]">Weekly record history</h2>
          <p className="mt-2 text-sm text-[#5f5673]">
            Record history is only available for departments that use the weekly record workflow.
          </p>
        </div>

        <div className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 text-sm text-[#5f5673] shadow-sm">
          Your current access does not include a records-enabled department. Programs uses event workspaces, and
          Leadership uses its own department area.
        </div>
      </section>
    );
  }

  const selectedDepartmentId = Number(params.departmentId || departments[0]?.id || 1);
  if (!departments.some((department) => department.id === selectedDepartmentId)) {
    notFound();
  }
  const records = await listRecordsForDepartment(session!.user, selectedDepartmentId, {
    start: params.start,
    end: params.end,
  });
  const fieldDefinitions = fieldDefinitionsByDepartment[selectedDepartmentId] || [];

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">
            Historical records
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-[#241c33]">Weekly record history</h2>
          <p className="mt-2 text-sm text-[#5f5673]">
            Edit or delete saved submissions before you begin loading clean ministry data.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <Link href="/records/new" className="rounded-xl bg-[#4B248C] px-4 py-2 text-sm font-medium text-white">
            Add weekly record
          </Link>
          <form className="flex flex-wrap gap-3 rounded-2xl border border-[#ddd3f0] bg-white p-3 shadow-sm">
            {isSystemAdmin ? (
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
            ) : (
              <>
                <input type="hidden" name="departmentId" value={String(selectedDepartmentId)} />
                <div className="rounded-xl border border-[#d9cfee] bg-[#fbf9fe] px-3 py-2 text-sm font-medium text-[#241c33]">
                  {departments.find((department) => department.id === selectedDepartmentId)?.name || 'Department'}
                </div>
              </>
            )}
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
            <button type="submit" className="rounded-xl bg-[#ede7f7] px-4 py-2 text-sm font-medium text-[#4B248C]">
              Filter
            </button>
          </form>
        </div>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-[#ddd3f0] bg-white shadow-sm">
        {records.length === 0 ? (
          <div className="p-6 text-sm text-[#5f5673]">
            No records match this filter yet. Clear the dates or add a weekly record.
          </div>
        ) : (
          <>
            <div className="divide-y divide-[#f4effb] md:hidden">
              {records.map((record) => {
                const values = record.values as Record<string, number | string | null | undefined>;

                return (
                  <article key={record.id} className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-[#241c33]">{record.departmentName}</p>
                        <p className="mt-1 text-sm text-[#5f5673]">{formatDisplayDate(record.recordDate)}</p>
                        <p className="mt-1 text-sm text-[#7a7190]">Handled by {record.handledByName}</p>
                      </div>
                      <span className="rounded-full bg-[#fff8eb] px-3 py-1 text-xs font-semibold text-[#b6841a]">
                        {record.visitorCount} visitors
                      </span>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {fieldDefinitions.map((field: DepartmentFieldDefinition) => {
                        const rawValue = values[field.fieldKey];
                        const displayValue =
                          field.fieldType === 'currency'
                            ? formatCurrency(Number(rawValue || 0))
                            : Array.isArray(rawValue)
                              ? rawValue.join(', ')
                              : rawValue ?? '-';

                        return (
                          <div
                            key={`${record.id}-${field.fieldKey}`}
                            className="rounded-2xl border border-[#ede6f9] bg-[#fbf9fe] px-3 py-2"
                          >
                            <p className="text-[11px] uppercase tracking-[0.18em] text-[#8a7ca7]">{field.label}</p>
                            <p className="mt-1 text-sm font-semibold text-[#241c33]">{displayValue}</p>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/records/${record.id}/edit`}
                        className="rounded-xl bg-[#ede7f7] px-3 py-2 text-xs font-medium text-[#4B248C]"
                      >
                        Edit record
                      </Link>
                      <DeleteRecordButton recordId={record.id} />
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-[#ece4f8] text-sm">
                <thead className="bg-[#fbf9fe] text-left text-[#5f5673]">
                  <tr>
                    <th className="px-5 py-4">Date</th>
                    <th className="px-5 py-4">Department</th>
                    <th className="px-5 py-4">Handled by</th>
                    <th className="px-5 py-4">Key figures</th>
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
                            {fieldDefinitions.map((field: DepartmentFieldDefinition) => {
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
            </div>
          </>
        )}
      </div>
    </section>
  );
}
