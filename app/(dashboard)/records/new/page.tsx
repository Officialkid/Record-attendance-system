import { getSession } from '@/lib/cap/auth';
import { listDepartmentsForUser, getDepartmentFieldDefinitions, listUsers } from '@/lib/cap/services';
import { getNearestSaturday } from '@/lib/cap/utils';
import { RecordEntryForm } from '@/components/cap/record-entry-form';

export default async function NewRecordPage({
  searchParams,
}: {
  searchParams: Promise<{ departmentId?: string; invite?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();
  const departments = await listDepartmentsForUser(session!.user);
  const users = await listUsers();
  const requestedDepartmentId = Number(params.departmentId || departments[0]?.id || 1);
  const defaultDepartmentId = departments.some((department) => department.id === requestedDepartmentId)
    ? requestedDepartmentId
    : departments[0]?.id || 1;

  const fieldDefinitions = Object.fromEntries(
    await Promise.all(
      departments.map(async (department) => [department.id, await getDepartmentFieldDefinitions(department.id)])
    )
  );

  const departmentMembers = Object.fromEntries(
    departments.map((department) => [
      department.id,
      users.filter((user) => user.departmentIds.includes(department.id)),
    ])
  );

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Phase 1</p>
        <h2 className="mt-2 text-3xl font-semibold text-[#241c33]">Weekly department record</h2>
        <p className="mt-2 text-sm text-[#5f5673]">
          Capture tithe, offering, expenses, headcount, and visitor details for the selected department.
        </p>
      </div>

      {params.invite === 'claimed' ? (
        <div className="rounded-2xl border border-[#d8e8c9] bg-[#f7fff0] p-4 text-sm text-[#46612b]">
          Your department invite was claimed successfully. CAP has opened the weekly workflow for the invited
          department so you can start working immediately.
        </div>
      ) : null}

      <RecordEntryForm
        departments={departments}
        fieldDefinitions={fieldDefinitions}
        departmentMembers={departmentMembers}
        defaultDepartmentId={defaultDepartmentId}
        defaultRecordDate={getNearestSaturday()}
        currentUserId={Number(session!.user.id)}
      />
    </section>
  );
}
