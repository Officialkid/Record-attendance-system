'use client';

import { useMemo, useState, useTransition } from 'react';

import { assignDepartmentMembersAction } from '@/app/actions/cap';
import type { Department, UserRecord } from '@/lib/cap/types';

interface AdminMembershipManagerProps {
  departments: Department[];
  users: UserRecord[];
}

export function AdminMembershipManager({
  departments,
  users,
}: AdminMembershipManagerProps) {
  const [departmentId, setDepartmentId] = useState<number>(departments[0]?.id || 1);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>(
    users.filter((user) => user.departmentIds.includes(departments[0]?.id || 1)).map((user) => user.id)
  );
  const [feedback, setFeedback] = useState('');
  const [pending, startTransition] = useTransition();

  const selectedDepartment = useMemo(
    () => departments.find((department) => department.id === departmentId) || null,
    [departmentId, departments]
  );

  const handleDepartmentChange = (nextDepartmentId: number) => {
    setDepartmentId(nextDepartmentId);
    setSelectedUserIds(
      users.filter((user) => user.departmentIds.includes(nextDepartmentId)).map((user) => user.id)
    );
    setFeedback('');
  };

  const toggleUser = (userId: number) => {
    setSelectedUserIds((current) =>
      current.includes(userId)
        ? current.filter((value) => value !== userId)
        : [...current, userId]
    );
  };

  const currentMembers = useMemo(
    () => users.filter((user) => user.departmentIds.includes(departmentId)),
    [departmentId, users]
  );

  return (
    <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-[#241c33]">Membership update</h3>
          <p className="mt-1 text-sm text-[#5f5673]">
            Assign members to a department without using manual IDs.
          </p>
        </div>
        <div className="rounded-full bg-[#ede7f7] px-3 py-1 text-xs font-medium text-[#4B248C]">
          {selectedUserIds.length} selected
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <label className="space-y-2">
          <span className="text-sm font-medium text-[#241c33]">Department</span>
          <select
            value={departmentId}
            onChange={(event) => handleDepartmentChange(Number(event.target.value))}
            className="w-full rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33] outline-none"
          >
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
          <p className="text-sm font-medium text-[#241c33]">
            Current members in {selectedDepartment?.name || 'this department'}
          </p>
          <p className="mt-2 text-sm text-[#5f5673]">
            {currentMembers.length > 0
              ? currentMembers
                  .map((user) =>
                    `${user.name}${user.departmentRoles[departmentId] ? ` (${user.departmentRoles[departmentId]})` : ''}`
                  )
                  .join(', ')
              : 'No members assigned yet.'}
          </p>
        </div>

        <div className="grid gap-3">
          {users.map((user) => {
            const checked = selectedUserIds.includes(user.id);
            return (
              <label
                key={user.id}
                className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
                  checked ? 'border-[#c9a461] bg-[#fff8eb]' : 'border-[#e6def4] bg-[#fbf9fe]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleUser(user.id)}
                  className="mt-1"
                />
                <span className="text-[#241c33]">
                  <span className="block font-medium">
                    {user.id}. {user.name}
                  </span>
                  <span className="text-xs text-[#5f5673]">
                    {user.role} - {user.email}
                    {user.status ? ` - ${user.status}` : ''}
                  </span>
                </span>
              </label>
            );
          })}
        </div>

        {feedback ? (
          <p className="rounded-2xl bg-[#f4effb] px-4 py-3 text-sm text-[#4B248C]">{feedback}</p>
        ) : null}

        <button
          type="button"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              const result = await assignDepartmentMembersAction({
                departmentId,
                userIds: selectedUserIds,
              });
              setFeedback(result.message);
            });
          }}
          className="rounded-2xl bg-[#4B248C] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? 'Saving membership...' : 'Save membership'}
        </button>
      </div>
    </article>
  );
}
