'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useState, useTransition } from 'react';
import { ArrowRight, CheckCircle2, Eye, EyeOff, Link2, ShieldCheck } from 'lucide-react';

import {
  acceptDepartmentInviteAction,
  acceptDepartmentInviteWithSignupAction,
} from '@/app/actions/cap';
import type { DepartmentInvite } from '@/lib/cap/types';

export function InviteClaimPanel({
  invite,
  token,
  signedInUser,
  googleEnabled,
}: {
  invite: DepartmentInvite;
  token: string;
  signedInUser: { name?: string | null; email?: string | null } | null;
  googleEnabled: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const expired = !!invite.expiresAt && new Date(invite.expiresAt).getTime() < Date.now();

  return (
    <section className="rounded-[32px] border border-[#ddd3f0] bg-white p-6 shadow-sm sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#C9A461]">Department invite</p>
      <h2 className="mt-3 text-3xl font-semibold text-[#241c33]">
        Join {invite.departmentName} as a {invite.role === 'department_admin' ? 'department admin' : 'member'}.
      </h2>
      <p className="mt-3 text-sm text-[#5f5673]">
        This secure department link can be shared with the right members of this department. CIOM Portal will approve access immediately each time it is used before expiry.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <span className="rounded-full border border-[#ddd3f0] bg-[#fbf9fe] px-3 py-1 text-xs font-semibold text-[#4B248C]">
          {invite.role === 'department_admin' ? 'Department admin access' : 'Member access'}
        </span>
        <span className="rounded-full border border-[#eadfb8] bg-[#fff8eb] px-3 py-1 text-xs font-semibold text-[#8a6113]">
          {expired ? 'Expired link' : 'Reusable before expiry'}
        </span>
      </div>

      {invite.note ? (
        <div className="mt-5 rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4 text-sm text-[#5f5673]">
          {invite.note}
        </div>
      ) : null}

      {expired ? (
        <div className="mt-5 rounded-2xl border border-[#f0c2b6] bg-[#fff1ec] p-4 text-sm text-[#a63e1c]">
          This invite has expired. Ask the department admin for a fresh link.
        </div>
      ) : null}

      {!expired && signedInUser ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
            <p className="text-sm font-medium text-[#241c33]">Signed in as</p>
            <p className="mt-2 text-base font-semibold text-[#4B248C]">
              {signedInUser.name || 'CIOM Portal user'}{signedInUser.email ? ` - ${signedInUser.email}` : ''}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#e6def4] bg-white p-4">
              <div className="flex items-center gap-2 text-[#241c33]">
                <ShieldCheck className="h-4 w-4 text-[#4B248C]" />
                <p className="text-sm font-semibold">What will happen</p>
              </div>
              <p className="mt-2 text-sm text-[#5f5673]">
                CIOM Portal will attach this department to your account and send you to the right workspace.
              </p>
            </div>
            <div className="rounded-2xl border border-[#e6def4] bg-white p-4">
              <div className="flex items-center gap-2 text-[#241c33]">
                <CheckCircle2 className="h-4 w-4 text-[#4B248C]" />
                <p className="text-sm font-semibold">Why this link matters</p>
              </div>
              <p className="mt-2 text-sm text-[#5f5673]">
                This link stays shareable for the department until expiry, so admins do not need to recreate it for every person.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setFeedback(null);
              startTransition(async () => {
                const result = await acceptDepartmentInviteAction({ token });
                setFeedback(result);
                if (!result.success) {
                  return;
                }
                router.replace(result.result?.destinationUrl || '/dashboard');
                router.refresh();
              });
            }}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#4B248C] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            <Link2 className="h-4 w-4" />
            <span>{pending ? 'Opening access...' : 'Open this department access'}</span>
          </button>
        </div>
      ) : null}

      {!expired && !signedInUser ? (
        <div className="mt-6 space-y-5">
          {googleEnabled ? (
            <button
              type="button"
              onClick={() => signIn('google', { callbackUrl: `/invite/${token}` })}
              className="w-full rounded-2xl bg-[#4B248C] px-5 py-3 text-sm font-semibold text-white"
            >
              Continue with Google
            </button>
          ) : null}

          <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
            <p className="text-sm font-medium text-[#241c33]">Or create your invited account</p>
            <p className="mt-2 text-sm text-[#5f5673]">
              Use email and password if you prefer not to use Google. CIOM Portal will approve this department automatically after signup.
            </p>
          </div>

          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              setFeedback(null);

              startTransition(async () => {
                const result = await acceptDepartmentInviteWithSignupAction({
                  token,
                  name,
                  email,
                  password,
                  confirmPassword,
                });

                setFeedback(result);
                if (!result.success) {
                  return;
                }

                await signIn('credentials', {
                  email,
                  password,
                  callbackUrl: result.result?.destinationUrl || '/dashboard',
                });
              });
            }}
          >
            <label className="block space-y-2">
              <span className="text-sm font-medium text-[#241c33]">Full name</span>
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33] outline-none"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-[#241c33]">Email address</span>
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33] outline-none"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-[#241c33]">Password</span>
              <div className="relative">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 pr-12 text-sm text-[#241c33] outline-none"
                />
                <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute inset-y-0 right-3 text-[#7a7190]">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-[#241c33]">Confirm password</span>
              <div className="relative">
                <input
                  required
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 pr-12 text-sm text-[#241c33] outline-none"
                />
                <button type="button" onClick={() => setShowConfirmPassword((current) => !current)} className="absolute inset-y-0 right-3 text-[#7a7190]">
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            <div className="rounded-2xl border border-[#e6def4] bg-white px-4 py-3 text-xs text-[#5f5673]">
              Password must be at least 8 characters and include one uppercase letter, one lowercase letter, and one number or special character.
            </div>

            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#4B248C] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              <span>{pending ? 'Creating invited account...' : 'Create account and open access'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      ) : null}

      {feedback ? (
        <p className={`mt-5 rounded-2xl px-4 py-3 text-sm ${feedback.success ? 'bg-[#f4effb] text-[#4B248C]' : 'bg-[#fff1ec] text-[#a63e1c]'}`}>
          {feedback.message}
        </p>
      ) : null}

      <div className="mt-6 text-sm text-[#5f5673]">
        This is an invite-only ministry portal. If you do not have a valid invite link, ask your department admin for one. You can still <Link href="/login" className="font-semibold text-[#4B248C]">open CIOM Portal login</Link> if you already have an account.
      </div>
    </section>
  );
}
