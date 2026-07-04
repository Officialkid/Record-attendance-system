'use client';

import Link from 'next/link';
import { Eye, EyeOff, Loader2, LockKeyhole, Mail } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';

export function LoginForm({
  googleEnabled,
  credentialsEnabled,
}: {
  googleEnabled: boolean;
  credentialsEnabled: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const resetComplete = searchParams.get('reset') === '1';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();
  const [googlePending, startGoogleTransition] = useTransition();

  const handleCredentialsSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    startTransition(async () => {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError('We could not sign you in with those details. Check your email and password, then try again.');
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    });
  };

  const handleGoogleSignIn = () => {
    setError('');
    startGoogleTransition(async () => {
      await signIn('google', { callbackUrl });
    });
  };

  return (
    <div className="w-full space-y-5 rounded-[28px] border border-[#ddd3f0] bg-white p-8 shadow-[0_24px_80px_rgba(75,36,140,0.10)]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#4B248C]">Welcome back</p>
        <h2 className="mt-2 text-3xl font-semibold text-[#241c33]">Sign in to CIOM Portal</h2>
        <p className="mt-2 text-sm text-[#5f5673]">
          Use Google or your email and password. CIOM Portal is invite-only, and once your department link is claimed
          your session stays active so you do not have to keep signing in again and again.
        </p>
      </div>

      {resetComplete ? (
        <p className="rounded-2xl border border-[#d9ead7] bg-[#f3fbf2] px-4 py-3 text-sm text-[#2d6a2d]">
          Your browser session was cleared. You can try signing in again now.
        </p>
      ) : null}

      {googleEnabled ? (
        <button
          type="button"
          disabled={googlePending}
          onClick={handleGoogleSignIn}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#4B248C] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#341765] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {googlePending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          <span>{googlePending ? 'Redirecting to Google...' : 'Continue with Google'}</span>
        </button>
      ) : null}

      {credentialsEnabled ? (
        <>
          {googleEnabled ? (
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-[#eadff7]" />
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-[#8a7ca7]">Or sign in with email</span>
              <div className="h-px flex-1 bg-[#eadff7]" />
            </div>
          ) : null}

          <form onSubmit={handleCredentialsSubmit} className="space-y-5">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-[#241c33]">Email address</span>
              <div className="flex items-center gap-3 rounded-2xl border border-[#ddd3f0] bg-[#f8f5fd] px-4 py-3">
                <Mail className="h-4 w-4 text-[#4B248C]" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full bg-transparent text-sm text-[#241c33] outline-none"
                  placeholder="you@gmail.com"
                />
              </div>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-[#241c33]">Password</span>
              <div className="flex items-center gap-3 rounded-2xl border border-[#ddd3f0] bg-[#f8f5fd] px-4 py-3">
                <LockKeyhole className="h-4 w-4 text-[#4B248C]" />
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full bg-transparent text-sm text-[#241c33] outline-none"
                  placeholder="Your secure password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="text-[#6c5b8f]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            {error ? <p className="rounded-2xl bg-[#fff1ec] px-4 py-3 text-sm text-[#a63e1c]">{error}</p> : null}

            <button
              type="submit"
              disabled={pending}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#d9cfee] bg-white px-4 py-3 text-sm font-semibold text-[#4B248C] transition-colors hover:bg-[#f8f5fd] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <span>{pending ? 'Signing you in...' : 'Sign in with email and password'}</span>
            </button>
          </form>
        </>
      ) : null}

      <div className="rounded-2xl border border-[#eadfb8] bg-[#fffbf0] p-4 text-sm text-[#5f5673]">
        <p className="font-medium text-[#241c33]">First time here?</p>
        <p className="mt-2">
          Ask your department admin for the shared department access link. Open that link, sign in, and CIOM Portal will place you
          directly into the right ministry department.
        </p>
      </div>

      <p className="text-sm text-[#5f5673]">
        Need access to CIOM Portal?{' '}
        <Link href="/sign-up" className="font-semibold text-[#4B248C]">
          See how invite-only access works
        </Link>
        .
      </p>

      <p className="text-sm text-[#5f5673]">
        Seeing a redirect loop?{' '}
        <Link href="/api/auth/reset" className="font-semibold text-[#4B248C]">
          Reset this browser session
        </Link>
        .
      </p>
    </div>
  );
}
