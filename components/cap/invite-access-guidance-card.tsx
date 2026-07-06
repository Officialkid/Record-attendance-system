'use client';

import Link from 'next/link';
import { ArrowRight, Link2, ShieldCheck } from 'lucide-react';

export function InviteAccessGuidanceCard({
  email,
  compact = false,
}: {
  email?: string | null;
  compact?: boolean;
}) {
  return (
    <article className="space-y-4 rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Invite-only onboarding</p>
        <h3 className="mt-2 text-2xl font-semibold text-[#241c33]">Use a department link to unlock CIOM Portal</h3>
        <p className="mt-2 text-sm text-[#5f5673]">
          Sign in from the shared department link and CIOM Portal will attach the correct workspace automatically.
        </p>
      </div>

      <details className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
        <summary className="cursor-pointer list-none text-sm font-medium text-[#241c33]">How access works</summary>
        <div className="mt-3 space-y-3">
          {[
            'Ask the head of department or CIOM Portal admin to share the department access link from the Admin page.',
            'Open that link and sign in with Google or your email/password.',
            'CIOM Portal will place you directly into the correct department workflow instead of keeping you in a waiting queue.',
          ].map((item) => (
            <div key={item} className="flex items-start gap-3 text-sm text-[#5f5673]">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-[#4B248C]" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </details>

      {email ? (
        <div className="rounded-2xl border border-[#eadfb8] bg-[#fffbf0] p-4 text-sm text-[#5f5673]">
          <p className="font-medium text-[#241c33]">Share this email with the person sending your invite</p>
          <p className="mt-2 text-base font-semibold text-[#4B248C]">{email}</p>
        </div>
      ) : null}

      {!compact ? (
        <div className="flex flex-wrap gap-3">
          <Link
            href="/settings/profile"
            className="inline-flex items-center gap-2 rounded-2xl bg-[#4B248C] px-5 py-3 text-sm font-semibold text-white"
          >
            <span>Open my profile</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <div className="inline-flex items-center gap-2 rounded-2xl border border-[#ddd3f0] px-4 py-3 text-sm text-[#5f5673]">
            <Link2 className="h-4 w-4 text-[#4B248C]" />
            <span>Claim access from the shared invite link</span>
          </div>
        </div>
      ) : null}
    </article>
  );
}
