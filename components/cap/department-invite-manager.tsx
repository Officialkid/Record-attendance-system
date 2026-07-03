'use client';

import { useMemo, useState, useTransition } from 'react';
import { Copy, Link2, MailPlus } from 'lucide-react';

import { createDepartmentInviteAction } from '@/app/actions/cap';
import type { Department, DepartmentInvite } from '@/lib/cap/types';

export function DepartmentInviteManager({
  departments,
  invites,
}: {
  departments: Department[];
  invites: DepartmentInvite[];
}) {
  const [departmentId, setDepartmentId] = useState<number>(departments[0]?.id || 1);
  const [role, setRole] = useState<'member' | 'department_admin'>('member');
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [note, setNote] = useState('');
  const [feedback, setFeedback] = useState('');
  const [latestInviteUrl, setLatestInviteUrl] = useState('');
  const [items, setItems] = useState(invites);
  const [pending, startTransition] = useTransition();

  const filteredInvites = useMemo(
    () => items.filter((invite) => invite.departmentId === departmentId),
    [departmentId, items]
  );

  return (
    <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-[#241c33]">One-time invite links</h3>
          <p className="mt-2 text-sm text-[#5f5673]">
            Create a secure invite link for a department. Each link works once, approves that department automatically, and then closes itself.
          </p>
        </div>
        <div className="rounded-full bg-[#ede7f7] px-3 py-1 text-xs font-medium text-[#4B248C]">
          {items.filter((invite) => !invite.usedAt).length} open invites
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <form
          className="space-y-4 rounded-3xl border border-[#e6def4] bg-[#fbf9fe] p-4"
          onSubmit={(event) => {
            event.preventDefault();
            setFeedback('');
            setLatestInviteUrl('');

            startTransition(async () => {
              const result = await createDepartmentInviteAction({
                departmentId,
                role,
                note,
                expiresInDays,
              });

              setFeedback(result.message);
              if (!result.success || !result.invite) {
                return;
              }

              setLatestInviteUrl(result.invite.inviteUrl);
              setItems((current) => [
                {
                  ...result.invite,
                  inviteUrl: null,
                  usedAt: null,
                  usedByUserId: null,
                  usedByName: null,
                  createdAt: new Date().toISOString(),
                  createdByUserId: null,
                  createdByName: 'You',
                },
                ...current,
              ]);
            });
          }}
        >
          <label className="block space-y-2">
            <span className="text-sm font-medium text-[#241c33]">Department</span>
            <select
              value={departmentId}
              onChange={(event) => setDepartmentId(Number(event.target.value))}
              className="w-full rounded-2xl border border-[#d9cfee] bg-white px-4 py-3 text-sm text-[#241c33] outline-none"
            >
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-[#241c33]">Invite role</span>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as 'member' | 'department_admin')}
              className="w-full rounded-2xl border border-[#d9cfee] bg-white px-4 py-3 text-sm text-[#241c33] outline-none"
            >
              <option value="member">Member access</option>
              <option value="department_admin">Department admin access</option>
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-[#241c33]">Expires after</span>
            <select
              value={expiresInDays}
              onChange={(event) => setExpiresInDays(Number(event.target.value))}
              className="w-full rounded-2xl border border-[#d9cfee] bg-white px-4 py-3 text-sm text-[#241c33] outline-none"
            >
              <option value={1}>1 day</option>
              <option value={3}>3 days</option>
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-[#241c33]">Note for the invitee</span>
            <textarea
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Optional onboarding note or context"
              className="w-full rounded-2xl border border-[#d9cfee] bg-white px-4 py-3 text-sm text-[#241c33] outline-none"
            />
          </label>

          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#4B248C] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            <Link2 className="h-4 w-4" />
            <span>{pending ? 'Generating invite...' : 'Generate one-time invite'}</span>
          </button>

          {feedback ? <p className="rounded-2xl bg-white px-4 py-3 text-sm text-[#4B248C]">{feedback}</p> : null}
          {latestInviteUrl ? (
            <div className="rounded-2xl border border-[#eadfb8] bg-[#fff8eb] p-4">
              <p className="text-sm font-medium text-[#241c33]">Copy and share this link now</p>
              <p className="mt-2 break-all text-sm text-[#5f5673]">{latestInviteUrl}</p>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(latestInviteUrl);
                  setFeedback('Invite link copied to your clipboard.');
                }}
                className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-[#4B248C]"
              >
                <Copy className="h-4 w-4" />
                <span>Copy link</span>
              </button>
            </div>
          ) : null}
        </form>

        <div className="space-y-3">
          <div className="rounded-3xl border border-[#e6def4] bg-[#fbf9fe] p-4">
            <p className="text-sm font-medium text-[#241c33]">How this helps</p>
            <p className="mt-2 text-sm text-[#5f5673]">
              Share the invite with a new user, let them sign in with Google or email/password, and CAP will approve the target department immediately after they claim it.
            </p>
          </div>

          {filteredInvites.length === 0 ? (
            <div className="rounded-3xl border border-[#e6def4] bg-[#fbf9fe] p-5 text-sm text-[#5f5673]">
              No invite links created yet for this department.
            </div>
          ) : (
            filteredInvites.map((invite) => (
              <div key={invite.id} className="rounded-3xl border border-[#e6def4] bg-[#fbf9fe] p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-[#241c33]">{invite.departmentName}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#8a7ca7]">
                      {invite.role.replace('_', ' ')} - expires {new Date(invite.expiresAt).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] ${
                      invite.usedAt ? 'bg-[#f1edea] text-[#786857]' : 'bg-[#fff3d6] text-[#9c730f]'
                    }`}
                  >
                    {invite.usedAt ? 'Used' : 'Open'}
                  </span>
                </div>

                {invite.note ? <p className="mt-3 text-sm text-[#5f5673]">{invite.note}</p> : null}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#7a7190]">
                  <span className="inline-flex items-center gap-1">
                    <MailPlus className="h-3.5 w-3.5" />
                    {invite.usedAt ? `Claimed by ${invite.usedByName || 'a user'}` : 'Waiting to be claimed'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </article>
  );
}
