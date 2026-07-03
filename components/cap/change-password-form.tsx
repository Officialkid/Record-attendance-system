'use client';

import { useSession } from 'next-auth/react';
import { useState, useTransition } from 'react';

import { changeOwnPasswordAction } from '@/app/actions/cap';

export function ChangePasswordForm({ mustChangePassword }: { mustChangePassword: boolean }) {
  const { update } = useSession();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
      <div>
        <h3 className="text-xl font-semibold text-[#241c33]">Change password</h3>
        <p className="mt-2 text-sm text-[#5f5673]">
          Update your password for this invite-only CAP account.
        </p>
      </div>

      {mustChangePassword ? (
        <p className="mt-4 rounded-2xl border border-[#eadfb8] bg-[#fffbf0] px-4 py-3 text-sm text-[#7a5a00]">
          Your account is still using an onboarding password. Change it now to clear the reset requirement.
        </p>
      ) : null}

      <form
        className="mt-4 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          setFeedback(null);

          startTransition(async () => {
            const result = await changeOwnPasswordAction({
              currentPassword,
              newPassword,
              confirmPassword,
            });

            setFeedback(result);

            if (result.success) {
              await update({ mustChangePassword: false });
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
            }
          });
        }}
      >
        <label className="block space-y-2">
          <span className="text-sm font-medium text-[#241c33]">Current password</span>
          <input
            required
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className="w-full rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33] outline-none"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-[#241c33]">New password</span>
          <input
            required
            type="password"
            minLength={8}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="w-full rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33] outline-none"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-[#241c33]">Confirm new password</span>
          <input
            required
            type="password"
            minLength={8}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="w-full rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33] outline-none"
          />
        </label>

        {feedback ? (
          <p
            className={`rounded-2xl px-4 py-3 text-sm ${
              feedback.success ? 'bg-[#f4effb] text-[#4B248C]' : 'bg-[#fff1ec] text-[#a63e1c]'
            }`}
          >
            {feedback.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="rounded-2xl bg-[#4B248C] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? 'Updating password...' : 'Update password'}
        </button>
      </form>
    </article>
  );
}
