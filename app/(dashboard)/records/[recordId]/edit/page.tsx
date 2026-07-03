import { notFound } from 'next/navigation';

import { RecordEntryForm } from '@/components/cap/record-entry-form';
import { getSession } from '@/lib/cap/auth';
import {
  getDepartmentFieldDefinitions,
  getDepartmentRecordById,
  listDepartmentsForUser,
  listUsers,
} from '@/lib/cap/services';

export default async function EditRecordPage({
  params,
}: {
  params: Promise<{ recordId: string }>;
}) {
  const { recordId } = await params;
  const numericRecordId = Number(recordId);

  if (!Number.isFinite(numericRecordId) || numericRecordId <= 0) {
    notFound();
  }

  const session = await getSession();
  const departments = await listDepartmentsForUser(session!.user);
  const users = await listUsers();

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

  let record;
  try {
    record = await getDepartmentRecordById(session!.user, numericRecordId);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === 'Record not found.' || error.message === 'You do not have access to this department.')
    ) {
      notFound();
    }

    throw error;
  }

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Phase 1</p>
        <h2 className="mt-2 text-3xl font-semibold text-[#241c33]">Edit weekly department record</h2>
        <p className="mt-2 text-sm text-[#5f5673]">
          Update the saved values, visitors, and handler assignment for this weekly submission.
        </p>
      </div>

      <RecordEntryForm
        departments={departments}
        fieldDefinitions={fieldDefinitions}
        departmentMembers={departmentMembers}
        defaultDepartmentId={record.departmentId}
        defaultRecordDate={record.recordDate}
        currentUserId={Number(session!.user.id)}
        existingRecord={record}
      />
    </section>
  );
}
