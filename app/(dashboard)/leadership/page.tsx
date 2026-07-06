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

function formatAmount(value: number) {
  return value.toLocaleString();
}

function toPercent(value: number, max: number) {
  if (max <= 0) {
    return 0;
  }

  return Math.max(8, Math.min(100, Math.round((value / max) * 100)));
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
  const visibleDepartments = snapshots.departments.filter(
    (department) =>
      department.departmentName === 'Leadership' ||
      department.recordCount > 0 ||
      department.openActionItemCount > 0 ||
      Boolean(department.latestRecordDate) ||
      Boolean(department.latestMeetingDate)
  );
  const maxDepartmentRecords = Math.max(...visibleDepartments.map((department) => department.recordCount), 1);
  const maxDepartmentActions = Math.max(
    ...visibleDepartments.map((department) => department.openActionItemCount),
    1
  );
  const maxEventTotal = Math.max(
    ...snapshots.events.map((event) =>
      Math.max(event.totalCollected, event.totalSpent, Math.max(event.balanceRetained, 0))
    ),
    1
  );

  return (
    <section className="space-y-6">
      <div className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Leadership</p>
            <h2 className="mt-2 text-3xl font-semibold text-[#241c33]">Leadership decision workspace</h2>
            <p className="mt-2 text-sm text-[#5f5673]">
              See the ministry story quickly, then open the deeper pages only when you need to investigate.
            </p>
          </div>

          <details className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] px-4 py-3 lg:max-w-sm">
            <summary className="cursor-pointer list-none text-sm font-semibold text-[#4B248C]">More</summary>
            <div className="mt-3 space-y-2 text-sm text-[#5f5673]">
              <p>Leadership reads department signals, meeting follow-up, and shared programs balances from one place.</p>
              <p>The heavier admin controls stay outside this page so the workspace remains simple.</p>
            </div>
          </details>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#7a7190]">Visible departments</p>
            <p className="mt-2 text-2xl font-semibold text-[#241c33]">{visibleDepartments.length}</p>
          </div>
          <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#7a7190]">Active events</p>
            <p className="mt-2 text-2xl font-semibold text-[#241c33]">{activeEvents.length}</p>
          </div>
          <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#7a7190]">Collected</p>
            <p className="mt-2 text-2xl font-semibold text-[#241c33]">{formatAmount(totalCollected)}</p>
          </div>
          <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#7a7190]">Balance</p>
            <p className="mt-2 text-2xl font-semibold text-[#241c33]">{formatAmount(totalBalance)}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
        <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-2xl font-semibold text-[#241c33]">Leadership shortcuts</h3>
              <p className="mt-2 text-sm text-[#5f5673]">
                Keep the main entry points visible and leave the rest tucked away.
              </p>
            </div>
            <div className="rounded-full bg-[#f4effb] px-3 py-1 text-xs font-semibold text-[#4B248C]">
              Main only
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Link
              href="/meetings"
              className="rounded-2xl bg-[#4B248C] px-4 py-4 text-sm font-semibold text-white"
            >
              Open Leadership meetings
            </Link>
            <Link
              href="/programs"
              className="rounded-2xl border border-[#d9cfee] bg-white px-4 py-4 text-sm font-semibold text-[#241c33]"
            >
              Open Programs
            </Link>
          </div>

          <details className="mt-4 rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
            <summary className="cursor-pointer list-none text-sm font-semibold text-[#241c33]">
              More leadership tools
            </summary>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link
                href="/notifications"
                className="rounded-2xl border border-[#d9cfee] bg-white px-4 py-3 text-sm font-medium text-[#241c33]"
              >
                Notifications
              </Link>
              <Link
                href="/insights"
                className="rounded-2xl border border-[#d9cfee] bg-white px-4 py-3 text-sm font-medium text-[#241c33]"
              >
                Insights
              </Link>
            </div>
          </details>
        </article>

        <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Department View</p>
              <h3 className="mt-2 text-2xl font-semibold text-[#241c33]">Independent department snapshots</h3>
            </div>
            <p className="text-sm text-[#5f5673]">
              Each card stays short but still shows the visual weight of activity.
            </p>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {visibleDepartments.map((department) => (
              <div key={department.departmentId} className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-lg font-semibold text-[#241c33]">{department.departmentName}</p>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#4B248C]">
                    {department.recordCount} records
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-3 text-sm text-[#5f5673]">
                      <span>Record activity</span>
                      <span>{department.recordCount}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-[#ece4f8]">
                      <div
                        className="h-2 rounded-full bg-[#4B248C]"
                        style={{ width: `${toPercent(department.recordCount, maxDepartmentRecords)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-3 text-sm text-[#5f5673]">
                      <span>Open actions</span>
                      <span>{department.openActionItemCount}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-[#f5ead4]">
                      <div
                        className="h-2 rounded-full bg-[#C9A461]"
                        style={{ width: `${toPercent(department.openActionItemCount, maxDepartmentActions)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-[#7a7190]">Latest record</p>
                    <p className="mt-2 text-sm text-[#241c33]">{formatDate(department.latestRecordDate || null)}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-[#7a7190]">Latest meeting</p>
                    <p className="mt-2 text-sm text-[#241c33]">{formatDate(department.latestMeetingDate || null)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Shared Analysis</p>
            <h3 className="mt-2 text-2xl font-semibold text-[#241c33]">Programs summaries for leadership only</h3>
          </div>
          <p className="text-sm text-[#5f5673]">
            This is the decision layer: collections, spending, and retained balance per event.
          </p>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-[#efe6ff] bg-[#fbf9fe] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7a7190]">Events</p>
            <p className="mt-2 text-2xl font-semibold text-[#241c33]">{snapshots.events.length}</p>
          </div>
          <div className="rounded-2xl border border-[#efe6ff] bg-[#fbf9fe] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7a7190]">Collected</p>
            <p className="mt-2 text-2xl font-semibold text-[#241c33]">{formatAmount(totalCollected)}</p>
          </div>
          <div className="rounded-2xl border border-[#efe6ff] bg-[#fbf9fe] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7a7190]">Spent</p>
            <p className="mt-2 text-2xl font-semibold text-[#241c33]">{formatAmount(totalSpent)}</p>
          </div>
          <div className="rounded-2xl border border-[#efe6ff] bg-[#fbf9fe] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7a7190]">Balance</p>
            <p className="mt-2 text-2xl font-semibold text-[#241c33]">{formatAmount(totalBalance)}</p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {snapshots.events.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d9cfee] bg-[#fbf9fe] p-5 text-sm text-[#5f5673]">
              No program events are visible yet.
            </div>
          ) : (
            snapshots.events.map((event) => (
              <div key={event.eventId} className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-5">
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

                <div className="mt-4 grid gap-3 lg:grid-cols-[0.95fr_1.05fr]">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-[#efe6ff] bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7a7190]">Collected</p>
                      <p className="mt-2 text-2xl font-semibold text-[#241c33]">{formatAmount(event.totalCollected)}</p>
                    </div>
                    <div className="rounded-2xl border border-[#efe6ff] bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7a7190]">Spent</p>
                      <p className="mt-2 text-2xl font-semibold text-[#241c33]">{formatAmount(event.totalSpent)}</p>
                    </div>
                    <div className="rounded-2xl border border-[#efe6ff] bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7a7190]">Balance</p>
                      <p className="mt-2 text-2xl font-semibold text-[#241c33]">{formatAmount(event.balanceRetained)}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#efe6ff] bg-white p-4">
                    <p className="text-sm font-semibold text-[#241c33]">Visual comparison</p>
                    <div className="mt-4 space-y-3">
                      <div>
                        <div className="flex items-center justify-between gap-3 text-sm text-[#5f5673]">
                          <span>Collected</span>
                          <span>{formatAmount(event.totalCollected)}</span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-[#ece4f8]">
                          <div
                            className="h-2 rounded-full bg-[#4B248C]"
                            style={{ width: `${toPercent(event.totalCollected, maxEventTotal)}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between gap-3 text-sm text-[#5f5673]">
                          <span>Spent</span>
                          <span>{formatAmount(event.totalSpent)}</span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-[#f8edda]">
                          <div
                            className="h-2 rounded-full bg-[#C98025]"
                            style={{ width: `${toPercent(event.totalSpent, maxEventTotal)}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between gap-3 text-sm text-[#5f5673]">
                          <span>Balance retained</span>
                          <span>{formatAmount(event.balanceRetained)}</span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-[#e4f3ea]">
                          <div
                            className="h-2 rounded-full bg-[#2F7A5D]"
                            style={{ width: `${toPercent(Math.max(event.balanceRetained, 0), maxEventTotal)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </article>
    </section>
  );
}
