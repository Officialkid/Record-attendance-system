import Link from 'next/link';
import { ArrowRight, BarChart3, BriefcaseBusiness, CalendarDays, ShieldCheck } from 'lucide-react';

const executiveSignals = [
  {
    label: 'Executive lens',
    title: 'Ministry-wide visibility',
    detail: 'Review the movement of departments, meetings, reporting, and operational follow-up from one calm leadership surface.',
  },
  {
    label: 'Programs watch',
    title: 'Events and finance readiness',
    detail: 'Keep Programs close for committee reviews, event summaries, and reconciliation conversations.',
  },
  {
    label: 'Decision support',
    title: 'Meetings and insights together',
    detail: 'Move from discussion to action quickly with direct access to meetings, records, and ministry trends.',
  },
];

const briefingColumns = [
  {
    heading: 'Leadership brief',
    points: [
      'Use this page as the opening screen during executive reviews and planning meetings.',
      'Move into Programs when the conversation turns to events, balances, or committee execution.',
      'Move into Meetings when leadership needs minutes, follow-up, or accountability threads.',
    ],
  },
  {
    heading: 'Executive priorities',
    points: [
      'Cross-check department momentum before decisions are made.',
      'Keep a visible path from oversight to action, not just to summaries.',
      'Use Insights as the reporting layer and Admin as the governance layer.',
    ],
  },
];

const actionCards = [
  {
    href: '/programs',
    title: 'Programs Command',
    description: 'Open the Programs workspace for event-side review, records, and committee visibility.',
    accent: 'bg-[#4B248C] text-white border-[#4B248C]',
    icon: BriefcaseBusiness,
  },
  {
    href: '/meetings',
    title: 'Meetings Review',
    description: 'Step into leadership and committee follow-up, minutes, and action tracking.',
    accent: 'bg-[#fff8eb] text-[#7f5f18] border-[#ead7a5]',
    icon: CalendarDays,
  },
  {
    href: '/insights',
    title: 'Insights View',
    description: 'Use the reporting layer to frame trends, anomalies, and recurring discussion points.',
    accent: 'bg-white text-[#241c33] border-[#d9cfee]',
    icon: BarChart3,
  },
  {
    href: '/admin',
    title: 'Governance Desk',
    description: 'Manage departments, memberships, invite access, and ministry control points.',
    accent: 'bg-white text-[#241c33] border-[#d9cfee]',
    icon: ShieldCheck,
  },
];

export default function OversightPage() {
  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-[32px] border border-[#d8cdea] bg-[linear-gradient(135deg,#2a124f_0%,#4B248C_52%,#f3ecff_52%,#fcf9ff_100%)] shadow-[0_24px_70px_rgba(43,18,79,0.16)]">
        <div className="grid gap-6 px-6 py-7 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-9">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d9bf7a]">Executive Leadership</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight text-white sm:text-4xl">
              Leadership oversight built for review, direction, and executive clarity.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#efe8ff] sm:text-[15px]">
              This workspace is designed to feel presentation-ready for leadership meetings while still
              giving you direct access to the real operating areas of the portal.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/programs"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#2f1658]"
              >
                Open Programs
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/meetings"
                className="inline-flex items-center gap-2 rounded-2xl border border-[#ffffff30] bg-[#ffffff12] px-4 py-3 text-sm font-semibold text-white"
              >
                Open Meetings
              </Link>
            </div>
          </div>

          <div className="grid gap-3 self-start">
            {executiveSignals.map((item) => (
              <article key={item.title} className="rounded-[24px] border border-[#e6def4] bg-white/94 p-4 backdrop-blur-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b3882e]">{item.label}</p>
                <h3 className="mt-2 text-lg font-semibold text-[#241c33]">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#5f5673]">{item.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-[30px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Executive Briefing</p>
              <h3 className="mt-2 text-2xl font-semibold text-[#241c33]">What leadership should focus on</h3>
            </div>
            <span className="rounded-full bg-[#f4edff] px-3 py-1 text-xs font-semibold text-[#4B248C]">
              Meeting-ready view
            </span>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {briefingColumns.map((column) => (
              <div key={column.heading} className="rounded-[24px] border border-[#ece4f8] bg-[#fbf9fe] p-5">
                <h4 className="text-lg font-semibold text-[#241c33]">{column.heading}</h4>
                <div className="mt-4 space-y-3 text-sm leading-6 text-[#5f5673]">
                  {column.points.map((point) => (
                    <p key={point} className="rounded-2xl bg-white px-4 py-3">
                      {point}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[30px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Executive Access</p>
          <h3 className="mt-2 text-2xl font-semibold text-[#241c33]">Leadership shortcuts</h3>
          <p className="mt-2 text-sm leading-6 text-[#5f5673]">
            These routes are arranged to support a natural executive flow: oversight, discussion, evidence, then governance.
          </p>

          <div className="mt-5 grid gap-3">
            {actionCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.href}
                  href={card.href}
                  className={`group rounded-[24px] border p-4 transition-colors ${card.accent}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-black/5">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h4 className="mt-4 text-lg font-semibold">{card.title}</h4>
                      <p className="mt-2 text-sm leading-6 opacity-90">{card.description}</p>
                    </div>
                    <ArrowRight className="mt-1 h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </article>
      </div>
    </section>
  );
}
