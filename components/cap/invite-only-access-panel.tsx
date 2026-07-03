'use client';

import Link from 'next/link';
import { ArrowRight, Link2, ShieldCheck } from 'lucide-react';

export function InviteOnlyAccessPanel() {
  return (
    <div className="w-full space-y-5 rounded-[28px] border border-[#ddd3f0] bg-white p-8 shadow-[0_24px_80px_rgba(75,36,140,0.10)]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#4B248C]">Invite-only access</p>
        <h2 className="mt-2 text-3xl font-semibold text-[#241c33]">CAP is opened by department invite link</h2>
        <p className="mt-2 text-sm text-[#5f5673]">
          This ministry portal is not a public signup system. A department admin creates a link for the exact team,
          then members sign in from that link and CAP places them straight into the right department workflow.
        </p>
      </div>

      <div className="space-y-3 rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
        {[
          'Department admins generate a one-time invite link from the Admin page.',
          'Members open that link, sign in with Google or email/password, and access is approved automatically.',
          'After claim, CAP sends them into the correct department path instead of a generic waiting screen.',
        ].map((item) => (
          <div key={item} className="flex items-start gap-3 text-sm text-[#5f5673]">
            <ShieldCheck className="mt-0.5 h-4 w-4 text-[#4B248C]" />
            <span>{item}</span>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[#eadfb8] bg-[#fffbf0] p-4 text-sm text-[#5f5673]">
        <p className="font-medium text-[#241c33]">Need access?</p>
        <p className="mt-2">
          Ask the head of department or CAP admin to generate and share your invite link from the ministry admin panel.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-2xl bg-[#4B248C] px-5 py-3 text-sm font-semibold text-white"
        >
          <span>Open CAP login</span>
          <ArrowRight className="h-4 w-4" />
        </Link>

        <div className="inline-flex items-center gap-2 rounded-2xl border border-[#ddd3f0] px-4 py-3 text-sm text-[#5f5673]">
          <Link2 className="h-4 w-4 text-[#4B248C]" />
          <span>Use your shared invite link to enter</span>
        </div>
      </div>
    </div>
  );
}
