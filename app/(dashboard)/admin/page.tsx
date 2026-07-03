import { redirect } from 'next/navigation';

import {
  submitDepartmentFormAction,
  submitFieldDefinitionFormAction,
  submitUserFormAction,
} from '@/app/actions/cap';
import { AdminMembershipManager } from '@/components/cap/admin-membership-manager';
import { DepartmentInviteManager } from '@/components/cap/department-invite-manager';
import { SystemStatusCard } from '@/components/cap/system-status-card';
import { getSession } from '@/lib/cap/auth';
import { getCapHealthSnapshot } from '@/lib/cap/health';
import {
  getDepartmentFieldDefinitions,
  listAllDepartments,
  listDepartmentsForUser,
  listDepartmentInvites,
  listUsers,
} from '@/lib/cap/services';
import type { DepartmentFieldDefinition } from '@/lib/cap/types';

export default async function AdminPage() {
  const session = await getSession();
  const isSystemAdmin =
    session?.user.systemRole === 'main_admin' ||
    session?.user.systemRole === 'chief_admin' ||
    session?.user.role === 'admin';
  const isDepartmentAdmin = Object.values(session?.user.departmentRoles || {}).includes('department_admin');

  if (!session?.user || (!isSystemAdmin && !isDepartmentAdmin)) {
    redirect('/dashboard');
  }

  const departments = isSystemAdmin
    ? await listAllDepartments()
    : await listDepartmentsForUser(session.user);
  const invites = await listDepartmentInvites(session.user);

  const fieldDefinitionsByDepartment = Object.fromEntries(
    await Promise.all(
      departments.map(async (department) => [department.id, await getDepartmentFieldDefinitions(department.id)])
    )
  ) as Record<number, DepartmentFieldDefinition[]>;

  const users = isSystemAdmin ? await listUsers() : [];
  const health = isSystemAdmin ? await getCapHealthSnapshot() : null;

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Administration</p>
        <h2 className="mt-2 text-3xl font-semibold text-[#241c33]">
          {isSystemAdmin ? 'Department and invite administration' : 'Department invites and access'}
        </h2>
        <p className="mt-2 text-sm text-[#5f5673]">
          {isSystemAdmin
            ? 'Manage departments, field definitions, direct member access, and one-time onboarding links from one workspace.'
            : 'Create one-time onboarding links for your departments and guide members into the right ministry workspace.'}
        </p>
      </div>

      <DepartmentInviteManager departments={departments} invites={invites} />

      {isSystemAdmin && health ? <SystemStatusCard health={health} /> : null}

      {isSystemAdmin ? (
        <div className="grid gap-6 xl:grid-cols-3">
          <form action={submitDepartmentFormAction} className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-[#241c33]">Create department</h3>
            <div className="mt-4 space-y-3">
              <input name="name" required placeholder="Department name" className="w-full rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33] outline-none" />
              <input name="slug" required placeholder="department-slug" className="w-full rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33] outline-none" />
              <textarea name="description" rows={3} placeholder="Description" className="w-full rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33] outline-none" />
              <button type="submit" className="rounded-2xl bg-[#4B248C] px-5 py-3 text-sm font-semibold text-white">
                Create department
              </button>
            </div>
          </form>

          <form action={submitFieldDefinitionFormAction} className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-[#241c33]">Add field definition</h3>
            <div className="mt-4 space-y-3">
              <select name="departmentId" className="w-full rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33] outline-none">
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
              <input name="fieldKey" required placeholder="field_key" className="w-full rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33] outline-none" />
              <input name="label" required placeholder="Field label" className="w-full rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33] outline-none" />
              <select name="fieldType" className="w-full rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33] outline-none">
                <option value="currency">currency</option>
                <option value="number">number</option>
                <option value="text">text</option>
                <option value="date">date</option>
                <option value="list">list</option>
              </select>
              <input name="displayOrder" type="number" defaultValue={0} className="w-full rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33] outline-none" />
              <label className="flex items-center gap-2 text-sm text-[#5f5673]">
                <input type="checkbox" name="isRequired" value="true" />
                Required field
              </label>
              <button type="submit" className="rounded-2xl bg-[#4B248C] px-5 py-3 text-sm font-semibold text-white">
                Add field
              </button>
            </div>
          </form>

          <form action={submitUserFormAction} className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-[#241c33]">Admin-add user</h3>
            <div className="mt-4 space-y-3">
              <input name="name" required placeholder="Full name" className="w-full rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33] outline-none" />
              <input name="email" type="email" required placeholder="Email address" className="w-full rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33] outline-none" />
              <select name="systemRole" className="w-full rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33] outline-none">
                <option value="none">department-scoped user</option>
                <option value="chief_admin">chief_admin</option>
              </select>
              <select name="departmentRole" className="w-full rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33] outline-none">
                <option value="member">member</option>
                <option value="department_admin">department_admin</option>
              </select>
              <input
                name="departmentIds"
                placeholder="Department IDs, comma-separated (for example: 1,2)"
                className="w-full rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33] outline-none"
              />
              <p className="text-xs text-[#5f5673]">
                Leave department IDs blank only when creating a `chief_admin`. Department-scoped users are created with approved access immediately.
              </p>
              <button type="submit" className="rounded-2xl bg-[#4B248C] px-5 py-3 text-sm font-semibold text-white">
                Add user
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-[#241c33]">Department schema overview</h3>
          <div className="mt-4 space-y-4">
            {departments.map((department) => (
              <div key={department.id} className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
                <h4 className="text-lg font-semibold text-[#241c33]">{department.name}</h4>
                <p className="mt-1 text-sm text-[#5f5673]">{department.description || 'No description provided.'}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(fieldDefinitionsByDepartment[department.id] || []).map((field) => (
                    <span key={field.id} className="rounded-full bg-white px-3 py-1 text-xs text-[#4B248C]">
                      {field.fieldKey} - {field.fieldType}
                      {field.isRequired ? ' - required' : ''}
                    </span>
                  ))}
                  {(fieldDefinitionsByDepartment[department.id] || []).length === 0 ? (
                    <span className="rounded-full bg-white px-3 py-1 text-xs text-[#7a7190]">
                      No field definitions yet.
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </article>

        {isSystemAdmin ? <AdminMembershipManager departments={departments} users={users} /> : (
          <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-[#241c33]">Department admin notes</h3>
            <p className="mt-2 text-sm text-[#5f5673]">
              Use one-time invite links to onboard members directly into your department, then direct them to Notifications for meeting and workflow updates.
            </p>
          </article>
        )}
      </div>
    </section>
  );
}
