'use client';

import { ShieldCheck } from 'lucide-react';

const highlights = [
  'Weekly record capture for every department',
  'Invite-only onboarding through department-specific approval',
  'Insights, trends, and anomaly spotting for leaders',
  'Meetings, follow-up, and ministry action tracking',
];

export function AuthMarketingPanel() {
  return (
    <section className="rounded-[36px] border border-[#d8caef] bg-[linear-gradient(135deg,#341765_0%,#4B248C_58%,#5d33aa_100%)] p-8 text-white shadow-[0_28px_90px_rgba(75,36,140,0.26)] lg:p-12">
      <div className="inline-flex items-center gap-3 rounded-full border border-[#ffffff33] bg-[#ffffff14] px-4 py-2 text-xs uppercase tracking-[0.35em] text-[#C9A461]">
        CIOM PORTAL
      </div>

      <div className="mt-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/CIOM Portal.png"
          alt="CIOM Portal logo"
          className="h-auto w-full max-w-[260px] drop-shadow-[0_18px_50px_rgba(0,0,0,0.18)]"
        />
      </div>

      <h1 className="mt-8 max-w-2xl text-5xl font-semibold leading-tight">
        A calmer way to run every department, in one place.
      </h1>
      <p className="mt-6 max-w-2xl text-base text-[#f2ebff]">
        CIOM Portal helps every department know what to do next - whether someone is signing in for the first time,
        submitting this week&apos;s record, or reviewing ministry trends.
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {highlights.map((item) => (
          <div key={item} className="rounded-3xl border border-[#ffffff1f] bg-[#ffffff14] p-4 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 text-[#C9A461]" />
              <p className="text-sm text-[#f8f4ff]">{item}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
