type HealthSnapshot = Awaited<ReturnType<typeof import('@/lib/cap/health').getCapHealthSnapshot>>;

export function SystemStatusCard({ health }: { health: HealthSnapshot }) {
  const integrationItems = [
    ['Google Auth', health.integrations.googleAuthConfigured],
    ['Resend', health.integrations.resendConfigured],
    ['Groq', health.integrations.groqConfigured],
    ['R2', health.integrations.r2Configured],
    ['Google Calendar', health.integrations.googleCalendarConfigured],
    ['Cron Secret', health.integrations.cronSecretConfigured],
  ] as const;
  const readinessItems = [
    ['Database', health.readiness.database.missingVars],
    ['Auth', health.readiness.auth.missingVars],
    ['Seeded admin', health.readiness.adminSeed.missingVars],
    ['Google Auth', health.readiness.googleAuth.missingVars],
    ['Resend', health.readiness.resend.missingVars],
    ['Groq', health.readiness.groq.missingVars],
    ['R2', health.readiness.r2.missingVars],
    ['Google Calendar', health.readiness.googleCalendar.missingVars],
    ['Cron', health.readiness.cron.missingVars],
  ] as const;

  return (
    <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">System status</p>
          <h3 className="mt-2 text-xl font-semibold text-[#241c33]">Environment readiness</h3>
          <p className="mt-2 text-sm text-[#5f5673]">{health.guidance.note}</p>
        </div>
        <div
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] ${
            health.app.status === 'ok'
              ? 'bg-[#e8f7ec] text-[#257942]'
              : 'bg-[#fff3d6] text-[#9c730f]'
          }`}
        >
          {health.app.status}
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
          <p className="text-sm font-semibold text-[#241c33]">Database</p>
          <div className="mt-3 space-y-2 text-sm text-[#5f5673]">
            <p>
              Configured driver: <span className="font-medium text-[#241c33]">{health.database.configuredDriver}</span>
            </p>
            <p>
              Active driver: <span className="font-medium text-[#241c33]">{health.database.activeDriver}</span>
            </p>
            <p>
              Reachable: <span className="font-medium text-[#241c33]">{String(health.database.reachable)}</span>
            </p>
            <p>
              `DATABASE_URL`: <span className="font-medium text-[#241c33]">{String(health.database.hasDatabaseUrl)}</span>
            </p>
            <p>
              D1 config: <span className="font-medium text-[#241c33]">{String(health.database.hasD1Config)}</span>
            </p>
            {health.database.error ? (
              <p className="rounded-2xl bg-[#fff8eb] px-3 py-2 text-xs text-[#8a5a00]">{health.database.error}</p>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
          <p className="text-sm font-semibold text-[#241c33]">Integrations</p>
          <div className="mt-3 grid gap-2">
            {integrationItems.map(([label, enabled]) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 text-sm"
              >
                <span className="text-[#241c33]">{label}</span>
                <span className={enabled ? 'font-medium text-[#257942]' : 'font-medium text-[#9c730f]'}>
                  {enabled ? 'ready' : 'missing'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[#241c33]">Missing environment keys</p>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#4B248C]">
              {health.readiness.totalMissingVars.length} remaining
            </span>
          </div>
          <div className="mt-3 space-y-3">
            {readinessItems.map(([label, missingVars]) => (
              <div key={label} className="rounded-2xl bg-white p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-[#241c33]">{label}</span>
                  <span className={missingVars.length === 0 ? 'text-xs font-medium text-[#257942]' : 'text-xs font-medium text-[#9c730f]'}>
                    {missingVars.length === 0 ? 'complete' : `${missingVars.length} missing`}
                  </span>
                </div>
                <p className="mt-2 text-xs text-[#5f5673]">
                  {missingVars.length === 0 ? 'All required values are present.' : missingVars.join(', ')}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
          <p className="text-sm font-semibold text-[#241c33]">Recommended setup order</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {health.guidance.recommendedSetupOrder.map((item) => (
              <span key={item} className="rounded-full bg-white px-3 py-2 text-xs font-medium text-[#4B248C]">
                {item}
              </span>
            ))}
          </div>
          <p className="mt-4 text-xs text-[#8a7ca7]">
            Fill these first, then use `/api/health` and the admin page to verify each integration as it becomes ready.
          </p>
        </div>
      </div>

      <p className="mt-4 text-xs text-[#8a7ca7]">Snapshot taken at {health.app.timestamp}</p>
    </article>
  );
}
