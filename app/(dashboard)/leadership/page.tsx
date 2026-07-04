import { redirect } from 'next/navigation';

import { getSession } from '@/lib/cap/auth';
import { getLeadershipSnapshots } from '@/lib/cap/phase3';

export default async function LeadershipPage() {
  const session = await getSession();
  if (!session?.user) {
    redirect('/login');
  }

  const snapshots = await getLeadershipSnapshots(session.user);

  return (
    <section className="space-y-6">
      <div className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Leadership</p>
        <h2 className="mt-2 text-3xl font-semibold text-[#241c33]">Read-only visibility across the platform</h2>
        <p className="mt-2 max-w-3xl text-sm text-[#5f5673]">
          Review departments and events from one reporting lens without granting leadership operational edit access.
        </p>
      </div>

      <section className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-semibold text-[#241c33]">Departments</h3>
            <p className="mt-2 text-sm text-[#5f5673]">
              Existing reporting areas remain the data source. Leadership gets a single overview entrypoint.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {snapshots.departments.map((department) => (
            <article key={department.departmentId} className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
              <h4 className="text-lg font-semibold text-[#241c33]">{department.departmentName}</h4>
              <div className="mt-3 space-y-2 text-sm text-[#5f5673]">
                <p>Records: {department.recordCount}</p>
                <p>Latest record: {department.latestRecordDate || 'None yet'}</p>
                <p>Open action items: {department.openActionItemCount}</p>
                <p>Latest meeting: {department.latestMeetingDate || 'None yet'}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
        <h3 className="text-2xl font-semibold text-[#241c33]">Programs events</h3>
        <p className="mt-2 text-sm text-[#5f5673]">
          Event-level reconciliation stays visible after closure for year-over-year comparison and stewardship review.
        </p>

        <div className="mt-5 space-y-3">
          {snapshots.events.map((event) => (
            <article key={event.eventId} className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="text-lg font-semibold text-[#241c33]">{event.eventName}</h4>
                  <p className="text-sm text-[#5f5673]">
                    Status: {event.status}
                    {event.endedAt ? ` • Ended at ${event.endedAt}` : ''}
                  </p>
                </div>
                <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#4B248C]">
                  Organizers: {event.organizerCount} • Finance: {event.financeCount}
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-white p-3">
                  <p className="text-xs text-[#5f5673]">Collected</p>
                  <p className="mt-1 text-lg font-semibold text-[#241c33]">{event.totalCollected.toLocaleString()}</p>
                </div>
                <div className="rounded-2xl bg-white p-3">
                  <p className="text-xs text-[#5f5673]">Spent</p>
                  <p className="mt-1 text-lg font-semibold text-[#241c33]">{event.totalSpent.toLocaleString()}</p>
                </div>
                <div className="rounded-2xl bg-white p-3">
                  <p className="text-xs text-[#5f5673]">Balance retained</p>
                  <p className="mt-1 text-lg font-semibold text-[#241c33]">
                    {event.balanceRetained.toLocaleString()}
                  </p>
                </div>
              </div>
            </article>
          ))}

          {snapshots.events.length === 0 ? (
            <p className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] px-4 py-3 text-sm text-[#5f5673]">
              No events have been created yet.
            </p>
          ) : null}
        </div>
      </section>
    </section>
  );
}
