import { getCapHealthSnapshot } from '@/lib/cap/health';

const setupSections = [
  {
    title: 'Core boot requirements',
    description: 'These values are needed before CAP can be proven against a real Neon-backed environment.',
    items: ['CAP_DATABASE_DRIVER=postgres', 'DATABASE_URL', 'NEXTAUTH_SECRET', 'AUTH_SECRET', 'CAP_ADMIN_EMAIL', 'CRON_SECRET'],
  },
  {
    title: 'Google authentication',
    description: 'Required for the intended Phase 2 Google-first sign-in flow.',
    items: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
  },
  {
    title: 'Reporting, email, and files',
    description: 'These unlock leadership summaries, emails, and attachments in live conditions.',
    items: ['RESEND_API_KEY', 'RESEND_FROM_EMAIL', 'GROQ_API_KEY', 'R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET'],
  },
  {
    title: 'Calendar sync',
    description:
      'Optional. CAP already falls back to GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET unless you want a separate Google app just for calendar sync. If your Google OAuth app is still in testing mode, add the intended account as a test user before trying the calendar scope.',
    items: ['Optional: GOOGLE_CALENDAR_CLIENT_ID', 'Optional: GOOGLE_CALENDAR_CLIENT_SECRET'],
  },
];

export default async function DocsPage() {
  const health = await getCapHealthSnapshot();

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Setup guide</p>
        <h2 className="mt-2 text-3xl font-semibold text-[#241c33]">CAP environment and launch handoff</h2>
        <p className="mt-2 max-w-3xl text-sm text-[#5f5673]">
          This page turns the Neon-first handoff into an in-app checklist. Fill the real values in your local
          `.env.local`, then use the health snapshot to confirm each capability is ready.
        </p>
      </div>

      <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-[#241c33]">Current readiness snapshot</h3>
            <p className="mt-2 text-sm text-[#5f5673]">{health.guidance.note}</p>
          </div>
          <span className="rounded-full bg-[#ede7f7] px-3 py-1 text-xs font-semibold text-[#4B248C]">
            {health.readiness.totalMissingVars.length} env values still needed
          </span>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
            <p className="text-sm font-semibold text-[#241c33]">Configured driver</p>
            <p className="mt-2 text-sm text-[#5f5673]">
              {health.database.configuredDriver} with active driver <span className="font-medium text-[#241c33]">{health.database.activeDriver}</span>
            </p>
          </div>
          <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
            <p className="text-sm font-semibold text-[#241c33]">Recommended next values</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {health.guidance.recommendedSetupOrder.map((item) => (
                <span key={item} className="rounded-full bg-white px-3 py-2 text-xs font-medium text-[#4B248C]">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </article>

      <div className="grid gap-6 xl:grid-cols-2">
        {setupSections.map((section) => (
          <article key={section.title} className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-[#241c33]">{section.title}</h3>
            <p className="mt-2 text-sm text-[#5f5673]">{section.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {section.items.map((item) => {
                const missing = health.readiness.totalMissingVars.includes(item) || health.guidance.recommendedSetupOrder.includes(item);
                return (
                  <span
                    key={item}
                    className={`rounded-full px-3 py-2 text-xs font-medium ${
                      health.readiness.totalMissingVars.includes(item)
                        ? 'bg-[#fff8eb] text-[#8a5a00]'
                        : missing
                          ? 'bg-[#ede7f7] text-[#4B248C]'
                          : 'bg-[#eef8f1] text-[#257942]'
                    }`}
                  >
                    {item}
                  </span>
                );
              })}
            </div>
          </article>
        ))}
      </div>

      <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-[#241c33]">Launch sequence</h3>
        <ol className="mt-4 space-y-3 text-sm text-[#5f5673]">
          <li>1. Set the Neon connection and auth secrets in `.env.local`.</li>
          <li>2. Set the seeded `CAP_ADMIN_EMAIL` to the real Google account that should hold `main_admin` access.</li>
          <li>3. Confirm `/api/health` shows the intended driver and no core boot values missing.</li>
          <li>4. Add Google OAuth, then prove sign-in.</li>
          <li>5. If Google Calendar consent is still in testing mode, add the real account under Google Auth Platform test users before verifying calendar sync.</li>
          <li>6. Add Resend, Groq, R2, and Calendar credentials one service at a time, verifying each after setup.</li>
          <li>7. Re-run the final live proof pass before calling CAP fully finished.</li>
        </ol>
      </article>
    </section>
  );
}
