import Link from 'next/link';

export default function HelpPage() {
  const cards = [
    {
      title: '1. Get into the right department',
      body: 'If you are new, use the one-time department invite link first. CIOM Portal uses that link to place you directly into the correct ministry workspace.',
      href: '/settings/profile',
      action: 'Open Profile',
    },
    {
      title: '2. Add fresh weekly figures',
      body: 'Use Weekly Record when you are entering a new service or ministry submission. This is the clean entry point for new accountability data.',
      href: '/records/new',
      action: 'Open Weekly Record',
    },
    {
      title: '3. Review or correct history',
      body: 'Use Records when you want to edit, verify, or clean up submissions that were already saved earlier.',
      href: '/records',
      action: 'Open Records',
    },
    {
      title: '4. Capture meetings and minutes',
      body: 'Meetings accepts point-form notes, uploaded minutes files, AI-assisted summaries, and action items, while source files stay in R2 storage.',
      href: '/meetings',
      action: 'Open Meetings',
    },
    {
      title: '5. Watch trends and generate reports',
      body: 'Insights and the Reports archive help leadership turn saved records into trends, anomaly checks, and Word-exportable summaries.',
      href: '/insights',
      action: 'Open Insights',
    },
    {
      title: '6. Follow reminders and alerts',
      body: 'Notifications is where CIOM Portal gathers reminders, follow-up prompts, and meeting-related alerts once the workflow starts moving.',
      href: '/notifications',
      action: 'Open Notifications',
    },
  ];

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Help center</p>
        <h2 className="mt-2 text-3xl font-semibold text-[#241c33]">How to move through CIOM Portal</h2>
        <p className="mt-2 max-w-3xl text-sm text-[#5f5673]">
          This page is the quick orientation guide for real ministry use. Open the part of the workflow you need,
          follow the next step, and come back here whenever someone is unsure where a task belongs.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {cards.map((card) => (
          <article key={card.title} className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-[#241c33]">{card.title}</h3>
            <p className="mt-2 text-sm text-[#5f5673]">{card.body}</p>
            <Link
              href={card.href}
              className="mt-4 inline-flex rounded-2xl bg-[#4B248C] px-4 py-2 text-sm font-semibold text-white"
            >
              {card.action}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
