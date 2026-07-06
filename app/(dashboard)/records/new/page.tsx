import { getSession } from '@/lib/cap/auth';
import { getActiveUserContext } from '@/lib/cap/phase3';
import {
  getDepartmentFieldDefinitions,
  listRecordWorkflowDepartmentsForUser,
  listUsersVisibleTo,
} from '@/lib/cap/services';
import { getNearestSaturday } from '@/lib/cap/utils';
import { RecordEntryForm } from '@/components/cap/record-entry-form';

export default async function NewRecordPage({
  searchParams,
}: {
  searchParams: Promise<{ departmentId?: string; invite?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();
  const activeContext = await getActiveUserContext(session!.user);
  const allDepartments = await listRecordWorkflowDepartmentsForUser(session!.user);
  const fieldDefinitionsByDepartment = Object.fromEntries(
    await Promise.all(
      allDepartments.map(async (department) => [department.id, await getDepartmentFieldDefinitions(department.id)])
    )
  );
  const departments = allDepartments.filter(
    (department) => (fieldDefinitionsByDepartment[department.id] || []).length > 0
  );
  const users = await listUsersVisibleTo(session!.user);
  const isSystemAdmin =
    session!.user.systemRole === 'main_admin' || session!.user.systemRole === 'chief_admin';
  const requestedDepartmentId = Number(
    params.departmentId ||
      (activeContext.contextType === 'department' ? activeContext.targetId || '' : '') ||
      departments[0]?.id ||
      1
  );
  const defaultDepartmentId = departments.some((department) => department.id === requestedDepartmentId)
    ? requestedDepartmentId
    : departments[0]?.id || 1;

  const departmentMembers = Object.fromEntries(
    departments.map((department) => [
      department.id,
      users.filter((user) => user.departmentIds.includes(department.id)),
    ])
  );

  if (departments.length === 0) {
    return (
      <section className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Phase 1</p>
          <h2 className="mt-2 text-3xl font-semibold text-[#241c33]">Weekly department record</h2>
          <p className="mt-2 text-sm text-[#5f5673]">
            The weekly record workflow is only available in departments that have a record schema configured.
          </p>
        </div>

        <div className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 text-sm text-[#5f5673] shadow-sm">
          Your current department access does not include a records-enabled department. Programs uses the event
          workspace, while Leadership uses its own department view.
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Phase 1</p>
        <h2 className="mt-2 text-3xl font-semibold text-[#241c33]">Weekly department record</h2>
        <p className="mt-2 text-sm text-[#5f5673]">
          Capture fresh ministry figures for the active records department. You can enter them manually or import an
          extracted weekly accounts table here, then use Records whenever you need to review or correct something
          already saved.
        </p>
      </div>

      {params.invite === 'claimed' ? (
        <div className="rounded-2xl border border-[#d8e8c9] bg-[#f7fff0] p-4 text-sm text-[#46612b]">
          Your department invite was claimed successfully. CIOM Portal has opened the weekly workflow for the invited
          department so you can start working immediately.
        </div>
      ) : null}

      <RecordEntryForm
        departments={departments}
        fieldDefinitions={fieldDefinitionsByDepartment}
        departmentMembers={departmentMembers}
        defaultDepartmentId={defaultDepartmentId}
        defaultRecordDate={getNearestSaturday()}
        currentUserId={Number(session!.user.id)}
        allowHandledBySelection={session!.user.role !== 'member'}
        allowDepartmentSelection={isSystemAdmin}
      />
    </section>
  );
}
