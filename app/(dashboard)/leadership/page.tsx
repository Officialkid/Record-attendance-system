import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getSession } from '@/lib/cap/auth';
import { getLeadershipSnapshots } from '@/lib/cap/phase3';

function formatDate(value: string | null) {
  if (!value) {
    return 'No activity yet';
  }

  return new Intl.DateTimeFormat('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export default async function LeadershipPage() {
  const session = await getSession();
  if (!session?.user) {
    redirect('/login');
  }

  const snapshots = await getLeadershipSnapshots(session.user);
  const activeEvents = snapshots.events.filter((event) => event.status === 'active');
  const totalCollected = snapshots.events.reduce((sum, event) => sum + event.totalCollected, 0);
  const totalSpent = snapshots.events.reduce((sum, event) => sum + event.totalSpent, 0);
  const totalBalance = snapshots.events.reduce((sum, event) => sum + event.balanceRetained, 0);

  return (
    <section className="space-y-6">
      <div className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Leadership</p>
        <h2 className="mt-2 text-3xl font-semibold text-[#241c33]">Leadership department workspace</h2>
        <p className="mt-2 max-w-3xl text-sm text-[#5f5673]">
          This is the dedicated Leadership department space inside the wider portal. It stays separate from
          Programs and Protocol & Admin while still helping leadership review the same live story from each
          department.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#7a7190]">Departments</p>
            <p className="mt-2 text-2xl font-semibold text-[#241c33]">{snapshots.departments.length}</p>
          </div>
          <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#7a7190]">Active events</p>
            <p className="mt-2 text-2xl font-semibold text-[#241c33]">{activeEvents.length}</p>
          </div>
          <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#7a7190]">Collected</p>
            <p className="mt-2 text-2xl font-semibold text-[#241c33]">{totalCollected.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#7a7190]">Balance</p>
            <p className="mt-2 text-2xl font-semibold text-[#241c33]">{totalBalance.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
          <h3 className="text-2xl font-semibold text-[#241c33]">Leadership shortcuts</h3>
          <p className="mt-2 text-sm text-[#5f5673]">
            Use the leadership workspace directly, then move elsewhere only when your wider access genuinely
            allows it.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/admin"
              className="rounded-2xl bg-[#4B248C] px-4 py-3 text-sm font-semibold text-white"
            >
              Open admin workspace
            </Link>
            <Link
              href="/meetings"
              className="rounded-2xl bg-[#fff8eb] px-4 py-3 text-sm font-semibold text-[#8a6113]"
            >
              Open Leadership meetings
            </Link>
            <Link
              href="/notifications"
              className="rounded-2xl border border-[#d9cfee] bg-white px-4 py-3 text-sm font-semibold text-[#241c33]"
            >
              Open Notifications
            </Link>
            <Link
              href="/programs"
              className="rounded-2xl border border-[#d9cfee] bg-white px-4 py-3 text-sm font-semibold text-[#241c33]"
            >
              Open Programs
            </Link>
          </div>
        </article>

        <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
          <h3 className="text-2xl font-semibold text-[#241c33]">What Leadership handles here</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
              <p className="text-sm font-semibold text-[#241c33]">Department independence</p>
              <p className="mt-2 text-sm text-[#5f5673]">
                Leadership remains its own department workspace and does not merge with Programs or Protocol &
                Admin.
              </p>
            </div>
            <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
              <p className="text-sm font-semibold text-[#241c33]">Shared numbers</p>
              <p className="mt-2 text-sm text-[#5f5673]">
                Leadership can read the same live event balances and department signals without asking each team
                to prepare a separate manual report.
              </p>
            </div>
            <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
              <p className="text-sm font-semibold text-[#241c33]">Meeting follow-up</p>
              <p className="mt-2 text-sm text-[#5f5673]">
                Track leadership-specific meeting direction, decisions, and next actions in one place.
              </p>
            </div>
            <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
              <p className="text-sm font-semibold text-[#241c33]">Event visibility</p>
              <p className="mt-2 text-sm text-[#5f5673]">
                Review recent program events with their collected totals, expenses, and retained balance.
              </p>
            </div>
          </div>
        </article>
      </div>

      <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Department View</p>
            <h3 className="mt-2 text-2xl font-semibold text-[#241c33]">Independent department snapshots</h3>
          </div>
          <p className="text-sm text-[#5f5673]">
            Record activity, meeting follow-up, and the latest visible date for each department.
          </p>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {snapshots.departments.map((department) => (
            <div key={department.departmentId} className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-5">
              <p className="text-lg font-semibold text-[#241c33]">{department.departmentName}</p>
              <p className="mt-3 text-sm text-[#5f5673]">Records logged: {department.recordCount}</p>
              <p className="mt-2 text-sm text-[#5f5673]">
                Latest record: {formatDate(department.latestRecordDate || null)}
              </p>
              <p className="mt-2 text-sm text-[#5f5673]">
                Open meeting actions: {department.openActionItemCount}
              </p>
              <p className="mt-2 text-sm text-[#5f5673]">
                Latest meeting: {formatDate(department.latestMeetingDate || null)}
              </p>
            </div>
          ))}
        </div>
      </article>

      <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Programs Analysis</p>
            <h3 className="mt-2 text-2xl font-semibold text-[#241c33]">Live event summaries for leadership</h3>
          </div>
          <p className="text-sm text-[#5f5673]">
            This is the same event story the department sees inside Programs, now visible here for leadership.
          </p>
        </div>

        <div className="mt-5 space-y-4">
          {snapshots.events.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d9cfee] bg-[#fbf9fe] p-5 text-sm text-[#5f5673]">
              No program events are visible yet.
            </div>
          ) : (
            snapshots.events.map((event) => (
              <div
                key={event.eventId}
                className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-5"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-[#241c33]">{event.eventName}</p>
                    <p className="mt-2 text-sm text-[#5f5673]">
                      Status: {event.status} • Organizers: {event.organizerCount} • Finance: {event.financeCount}
                    </p>
                    <p className="mt-2 text-sm text-[#5f5673]">
                      Ended: {event.endedAt ? formatDate(event.endedAt) : 'Still active'}
                    </p>
                  </div>

                  <Link
                    href={`/programs/events/${event.eventId}`}
                    className="rounded-2xl bg-[#4B248C] px-4 py-3 text-sm font-semibold text-white"
                  >
                    Open event dashboard
                  </Link>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-[#efe6ff] bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7a7190]">Collected</p>
                    <p className="mt-2 text-2xl font-semibold text-[#241c33]">{event.totalCollected}</p>
                  </div>
                  <div className="rounded-2xl border border-[#efe6ff] bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7a7190]">Spent</p>
                    <p className="mt-2 text-2xl font-semibold text-[#241c33]">{event.totalSpent}</p>
                  </div>
                  <div className="rounded-2xl border border-[#efe6ff] bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7a7190]">Balance</p>
                    <p className="mt-2 text-2xl font-semibold text-[#241c33]">{event.balanceRetained}</p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-[#efe6ff] bg-white p-4 text-sm text-[#5f5673]">
                  Leadership view keeps this event readable without leaving the department workspace: collections,
                  spending, retained balance, and whether the event still needs active follow-up.
                </div>
              </div>
            ))
          )}
        </div>
      </article>
    </section>
  );
}
