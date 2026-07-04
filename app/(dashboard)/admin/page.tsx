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

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const isLeadershipView = resolvedSearchParams?.view === 'leadership';
  const session = await getSession();
  const isMainAdmin = session?.user.systemRole === 'main_admin';
  const isSystemAdmin =
    session?.user.systemRole === 'main_admin' || session?.user.systemRole === 'chief_admin';
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
      <div id={isLeadershipView ? 'leadership-overview' : undefined}>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Administration</p>
        <h2 className="mt-2 text-3xl font-semibold text-[#241c33]">
          {isSystemAdmin ? 'Department and invite administration' : 'Department invites and access'}
        </h2>
        <p className="mt-2 text-sm text-[#5f5673]">
          {isSystemAdmin
            ? 'Manage departments, field definitions, direct member access, and reusable department access links from one workspace.'
            : 'Create reusable department access links for your departments and guide members into the right ministry workspace.'}
        </p>
      </div>

      {isSystemAdmin ? (
        <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Leadership</p>
              <h3 className="mt-2 text-2xl font-semibold text-[#241c33]">Cross-platform leadership view</h3>
              <p className="mt-2 text-sm text-[#5f5673]">
                Super admins can use this area as the stable leadership workspace for ministry-wide
                oversight while the deeper standalone leadership route is being hardened.
              </p>
            </div>
            {isLeadershipView ? (
              <span className="rounded-full bg-[#ede7f7] px-3 py-1 text-xs font-semibold text-[#4B248C]">
                Leadership view active
              </span>
            ) : null}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
              <p className="text-sm font-semibold text-[#241c33]">Department visibility</p>
              <p className="mt-2 text-sm text-[#5f5673]">
                Review departments, memberships, and invite status from one workspace.
              </p>
            </div>
            <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
              <p className="text-sm font-semibold text-[#241c33]">Programs oversight</p>
              <p className="mt-2 text-sm text-[#5f5673]">
                Jump into Programs to review meetings, records, and event-side reporting.
              </p>
            </div>
            <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
              <p className="text-sm font-semibold text-[#241c33]">Meeting follow-up</p>
              <p className="mt-2 text-sm text-[#5f5673]">
                Track committee decisions, uploads, and next actions from the Meetings area.
              </p>
            </div>
            <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
              <p className="text-sm font-semibold text-[#241c33]">Insight review</p>
              <p className="mt-2 text-sm text-[#5f5673]">
                Use ministry trends and history as the shared reporting lens for leadership review.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="/programs"
              className="rounded-2xl bg-[#4B248C] px-4 py-3 text-sm font-semibold text-white"
            >
              Open Programs
            </a>
            <a
              href="/meetings"
              className="rounded-2xl bg-[#fff8eb] px-4 py-3 text-sm font-semibold text-[#8a6113]"
            >
              Open Meetings
            </a>
            <a
              href="/insights"
              className="rounded-2xl border border-[#d9cfee] bg-white px-4 py-3 text-sm font-semibold text-[#241c33]"
            >
              Open Insights
            </a>
          </div>
        </article>
      ) : null}

      <div className="rounded-[24px] border border-[#eadfb8] bg-[#fffaf0] p-5 text-sm text-[#5f5673]">
        <p className="font-semibold text-[#241c33]">Recommended ministry flow</p>
        <p className="mt-2">
          Use department access links as the normal onboarding path. Direct user creation and manual membership changes
          are still available for recovery, exceptional admin cases, or controlled setup work, but shared department links should
          be the default way real members enter the system.
        </p>
      </div>

      <DepartmentInviteManager departments={departments} invites={invites} />

      {isMainAdmin && health ? <SystemStatusCard health={health} /> : null}

      {isSystemAdmin ? (
        <div className="grid gap-6 xl:grid-cols-3">
          {isMainAdmin ? (
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
          ) : (
            <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-[#241c33]">Department creation</h3>
              <p className="mt-2 text-sm text-[#5f5673]">
                Only the main admin can create brand new departments. Chief admins can still manage users,
                memberships, invites, and schemas for the departments already in the system.
              </p>
            </article>
          )}

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
            <p className="mt-2 text-sm text-[#5f5673]">
              Keep this for controlled admin setup or recovery work. Normal ministry onboarding should use department links
              above.
            </p>
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
              Use department access links to onboard members directly into your department, then direct them to Notifications for meeting and workflow updates.
            </p>
          </article>
        )}
      </div>

      {isSystemAdmin ? (
        <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-[#241c33]">System users</h3>
              <p className="mt-2 text-sm text-[#5f5673]">
                Review who is in the system, which department roles they hold, and then use the membership editor above to move or add them across departments.
              </p>
            </div>
            <div className="rounded-full bg-[#ede7f7] px-3 py-1 text-xs font-medium text-[#4B248C]">
              {users.length} users
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-[#ece4f8] text-sm">
              <thead className="bg-[#fbf9fe] text-left text-[#5f5673]">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">System role</th>
                  <th className="px-4 py-3">Departments</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3eefb]">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#241c33]">{user.name}</p>
                      <p className="text-xs text-[#5f5673]">{user.email}</p>
                    </td>
                    <td className="px-4 py-3 text-[#5f5673]">
                      {user.systemRole === 'none' ? 'Department-scoped' : user.systemRole}
                    </td>
                    <td className="px-4 py-3 text-[#5f5673]">
                      {user.departmentIds.length > 0
                        ? user.departmentIds
                            .map((departmentId) => {
                              const department = departments.find((item) => item.id === departmentId);
                              const role = user.departmentRoles[departmentId];
                              return department ? `${department.name}${role ? ` (${role})` : ''}` : `#${departmentId}`;
                            })
                            .join(', ')
                        : 'No department yet'}
                    </td>
                    <td className="px-4 py-3 text-[#5f5673]">{user.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      ) : null}
    </section>
  );
}
