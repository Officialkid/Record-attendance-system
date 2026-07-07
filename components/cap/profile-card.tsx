'use client';

import { useRef, useState, useTransition } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { Camera, UserCircle2 } from 'lucide-react';

import { deactivateOwnAccountAction, deleteOwnAccountAction } from '@/app/actions/account';
import { createAvatarUploadAction, updateOwnProfileAction } from '@/app/actions/cap';
import type { UserRecord } from '@/lib/cap/types';

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

export function ProfileCard({
  user,
  assignedDepartments,
}: {
  user: UserRecord;
  assignedDepartments: Array<{ id: number; name: string }>;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { update } = useSession();
  const [name, setName] = useState(user.name);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [accountPending, startAccountTransition] = useTransition();
  const protectedAccount = user.systemRole === 'main_admin' || user.systemRole === 'chief_admin';

  return (
    <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={name} className="h-24 w-24 rounded-[28px] object-cover" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-[#ede7f7] text-2xl font-semibold text-[#4B248C]">
                {initials(name) || <UserCircle2 className="h-10 w-10" />}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-2xl border border-[#ddd3f0] bg-white text-[#4B248C] shadow-sm"
              title="Upload profile image"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) {
                  return;
                }

                setFeedback(null);
                setUploading(true);

                void (async () => {
                  const prepare = await createAvatarUploadAction({
                    filename: file.name,
                    contentType: file.type || 'image/jpeg',
                  });

                  if (!prepare.success || !prepare.uploadUrl || !prepare.publicUrl) {
                    setUploading(false);
                    setFeedback({ success: false, message: prepare.message });
                    return;
                  }

                  const uploadResponse = await fetch(prepare.uploadUrl, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': file.type || 'image/jpeg',
                    },
                    body: file,
                  });

                  if (!uploadResponse.ok) {
                    setUploading(false);
                    setFeedback({ success: false, message: 'Avatar upload failed. Try again.' });
                    return;
                  }

                  setAvatarUrl(prepare.publicUrl);
                  setUploading(false);
                  setFeedback({ success: true, message: 'Avatar uploaded. Save profile to publish it.' });
                })();
              }}
            />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Profile</p>
            <h2 className="mt-2 text-3xl font-semibold text-[#241c33]">Signed-in user details</h2>
            <p className="mt-2 max-w-2xl text-sm text-[#5f5673]">
              Review your CIOM Portal access level, update your name or photo, and keep your account easy to recognize across invites, records, and meetings.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] px-4 py-3 text-sm text-[#5f5673]">
          {assignedDepartments.length > 0 ? `${assignedDepartments.length} department assignment(s)` : 'No department assigned yet'}
        </div>
      </div>

      <form
        className="mt-6 space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          setFeedback(null);

          startTransition(async () => {
            const result = await updateOwnProfileAction({
              name,
              avatarUrl: avatarUrl || null,
            });

            setFeedback(result);
            if (!result.success || !result.result) {
              return;
            }

            await update({
              name: result.result.name,
              avatarUrl: result.result.avatarUrl,
            });
          });
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm text-[#5f5673]">Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-lg font-semibold text-[#241c33] outline-none"
            />
          </label>
          <div className="space-y-2">
            <span className="text-sm text-[#5f5673]">Email</span>
            <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] px-4 py-3 text-lg font-semibold text-[#241c33]">
              {user.email}
            </div>
          </div>
          <div>
            <dt className="text-sm text-[#5f5673]">Role</dt>
            <dd className="mt-1 text-lg font-semibold capitalize text-[#241c33]">{user.role}</dd>
          </div>
          <div>
            <dt className="text-sm text-[#5f5673]">System role</dt>
            <dd className="mt-1 text-lg font-semibold text-[#241c33]">
              {user.systemRole === 'none' ? 'Department-scoped user' : user.systemRole}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-[#5f5673]">Access status</dt>
            <dd className="mt-1 text-lg font-semibold capitalize text-[#241c33]">{user.status || 'pending'}</dd>
          </div>
          <div>
            <dt className="text-sm text-[#5f5673]">Password reset</dt>
            <dd className="mt-1 text-lg font-semibold text-[#241c33]">
              {user.mustChangePassword ? 'Required on onboarding' : 'Not required'}
            </dd>
          </div>
        </div>

        <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
          <p className="text-sm font-medium text-[#241c33]">Assigned departments</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {assignedDepartments.length > 0 ? (
              assignedDepartments.map((department) => (
                <span
                  key={department.id}
                  className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#4B248C]"
                >
                  {department.name}
                  {user.departmentRoles[department.id] ? ` - ${user.departmentRoles[department.id]}` : ''}
                </span>
              ))
            ) : (
              <p className="text-sm text-[#5f5673]">
                No departments assigned yet. Use the Admin or invite workflow to connect this account to a department.
              </p>
            )}
          </div>
        </div>

        <details className="rounded-2xl border border-[#f0d8d2] bg-[#fff7f4] p-4">
          <summary className="cursor-pointer list-none text-sm font-semibold text-[#7a2413]">
            Account controls
          </summary>
          <div className="mt-3 space-y-4">
            <p className="text-sm text-[#8a4a3f]">
              Deactivate keeps the account recoverable later. Delete permanently removes sign-in access and anonymizes the history so reports, records, and meetings stay intact.
            </p>

            {protectedAccount ? (
              <div className="rounded-2xl border border-[#ead8d3] bg-white p-4 text-sm text-[#8a4a3f]">
                This protected super-admin account cannot remove itself from Profile because that could lock the whole portal. Use a second protected admin account for the handoff.
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={pending || uploading || accountPending}
                  onClick={() => {
                    if (!window.confirm('Deactivate this account now? You will be signed out and an admin will need to restore access later.')) {
                      return;
                    }

                    setFeedback(null);
                    startAccountTransition(async () => {
                      const result = await deactivateOwnAccountAction();
                      setFeedback(result);
                      if (result.success) {
                        await signOut({ callbackUrl: '/login' });
                      }
                    });
                  }}
                  className="rounded-2xl border border-[#d8b7b0] bg-white px-5 py-3 text-sm font-semibold text-[#7a2413] disabled:opacity-60"
                >
                  {accountPending ? 'Processing...' : 'Deactivate account'}
                </button>
                <button
                  type="button"
                  disabled={pending || uploading || accountPending}
                  onClick={() => {
                    if (!window.confirm('Delete this account permanently? Sign-in access will be removed and your historical activity will be anonymized.')) {
                      return;
                    }

                    setFeedback(null);
                    startAccountTransition(async () => {
                      const result = await deleteOwnAccountAction();
                      setFeedback(result);
                      if (result.success) {
                        await signOut({ callbackUrl: '/login' });
                      }
                    });
                  }}
                  className="rounded-2xl bg-[#7a2413] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {accountPending ? 'Processing...' : 'Delete permanently'}
                </button>
              </div>
            )}
          </div>
        </details>

        {feedback ? (
          <p className={`rounded-2xl px-4 py-3 text-sm ${feedback.success ? 'bg-[#f4effb] text-[#4B248C]' : 'bg-[#fff1ec] text-[#a63e1c]'}`}>
            {feedback.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending || uploading || accountPending}
          className="rounded-2xl bg-[#4B248C] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? 'Saving profile...' : uploading ? 'Finishing upload...' : 'Save profile changes'}
        </button>
      </form>
    </article>
  );
}
