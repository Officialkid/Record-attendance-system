'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import {
  addEventMembershipAction,
  createEventAction,
  createStandaloneContributionLedgerAction,
  createStandaloneExpenseLedgerAction,
  setEventVisibilityAction,
} from '@/app/actions/cap';
import type { EventListItem, UserRecord } from '@/lib/cap/types';
import { ProgramsEventSummaryChart } from './programs-event-summary-chart';

type EventMembership = {
  id: number;
  event_id: number;
  event_name: string;
  side: 'organizer' | 'finance' | 'admin';
  remain_visible: number;
  status: 'active' | 'ended';
};

type StandaloneLedgers = {
  contributionLedgers: Array<{ id: number; name: string; status: string }>;
  expenseLedgers: Array<{ id: number; name: string; status: string }>;
};

function formatCount(value: number) {
  return value.toLocaleString();
}

function EventCard({ event }: { event: EventListItem }) {
  return (
    <div className="rounded-[28px] border border-[#e6def4] bg-[linear-gradient(180deg,#fcfbff_0%,#f8f4fd_100%)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-xl font-semibold text-[#241c33]">{event.name}</h4>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#4B248C]">
              {event.status === 'active' ? 'Recent event' : 'Past event'}
            </span>
          </div>
          <p className="mt-2 text-sm text-[#5f5673]">Open the event dashboard to continue work.</p>
        </div>

        <Link
          href={`/programs/events/${event.id}`}
          className="rounded-2xl bg-[#4B248C] px-4 py-3 text-sm font-semibold text-white"
        >
          Open event dashboard
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {event.userSides.map((side) => (
          <span key={`${event.id}-${side}`} className="rounded-full border border-[#ddd3f0] bg-white px-3 py-1 text-xs font-semibold text-[#241c33]">
            {side === 'admin' ? 'Event admin' : side}
          </span>
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-4">
        <div className="rounded-2xl bg-white p-3">
          <p className="text-xs text-[#5f5673]">Collected</p>
          <p className="mt-1 text-lg font-semibold text-[#241c33]">{formatCount(event.totalCollected)}</p>
        </div>
        <div className="rounded-2xl bg-white p-3">
          <p className="text-xs text-[#5f5673]">Spent</p>
          <p className="mt-1 text-lg font-semibold text-[#241c33]">{formatCount(event.totalSpent)}</p>
        </div>
        <div className="rounded-2xl bg-white p-3">
          <p className="text-xs text-[#5f5673]">Balance</p>
          <p className="mt-1 text-lg font-semibold text-[#241c33]">{formatCount(event.balanceRetained)}</p>
        </div>
        <div className="rounded-2xl bg-white p-3">
          <p className="text-xs text-[#5f5673]">Activity</p>
          <p className="mt-1 text-sm font-semibold text-[#241c33]">
            {event.participantCount} participants • {event.expenseItemCount} expenses
          </p>
        </div>
      </div>
    </div>
  );
}

export function ProgramsHub({
  events,
  users,
  canManagePrograms,
  hasFinanceAccess,
  programsDepartmentId,
  eventMemberships,
  standaloneLedgers,
}: {
  events: EventListItem[];
  users: UserRecord[];
  canManagePrograms: boolean;
  hasFinanceAccess: boolean;
  programsDepartmentId: number | null;
  eventMemberships: EventMembership[];
  standaloneLedgers: StandaloneLedgers;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [eventName, setEventName] = useState('');
  const [expectedAmount, setExpectedAmount] = useState('10000');
  const [selectedEventId, setSelectedEventId] = useState(String(events[0]?.id || ''));
  const [selectedUserId, setSelectedUserId] = useState(String(users[0]?.id || ''));
  const [selectedSide, setSelectedSide] = useState<'organizer' | 'finance' | 'admin'>('organizer');
  const [contributionLedgerName, setContributionLedgerName] = useState('');
  const [expenseLedgerName, setExpenseLedgerName] = useState('');

  const totalCollected = events.reduce((sum, event) => sum + event.totalCollected, 0);
  const totalSpent = events.reduce((sum, event) => sum + event.totalSpent, 0);
  const totalBalance = events.reduce((sum, event) => sum + event.balanceRetained, 0);
  const totalParticipants = events.reduce((sum, event) => sum + event.participantCount, 0);
  const totalExpenseItems = events.reduce((sum, event) => sum + event.expenseItemCount, 0);
  const recentEvents = events.filter((event) => event.status === 'active');
  const pastEvents = events.filter((event) => event.status === 'ended');
  const collectionCoverage = totalCollected > 0 ? Math.round((totalSpent / totalCollected) * 100) : 0;
  const movementTotal = totalCollected + totalSpent;

  const runAction = (task: () => Promise<{ success: boolean; message: string }>, onSuccess?: () => void) => {
    setError('');
    setMessage('');
    startTransition(async () => {
      const result = await task();
      if (!result.success) {
        setError(result.message);
        return;
      }

      setMessage(result.message);
      onSuccess?.();
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-[#ddd3f0] bg-[linear-gradient(135deg,#ffffff_0%,#faf6ff_52%,#f3ebff_100%)] p-6 shadow-sm">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Programs hub</p>
            <h2 className="mt-2 text-3xl font-semibold text-[#241c33]">Programs dashboard</h2>
            <p className="mt-3 max-w-3xl text-sm text-[#5f5673]">Create events, open them, and track the shared numbers.</p>

            {programsDepartmentId ? (
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={`/meetings?departmentId=${programsDepartmentId}`}
                  className="rounded-2xl bg-[#4B248C] px-4 py-3 text-sm font-semibold text-white"
                >
                  Programs meetings
                </Link>
                <Link
                  href="#recent-events"
                  className="rounded-2xl bg-[#fff8eb] px-4 py-3 text-sm font-semibold text-[#8a6113]"
                >
                  Open recent events
                </Link>
                <Link
                  href="#past-events"
                  className="rounded-2xl border border-[#d9cfee] bg-white px-4 py-3 text-sm font-semibold text-[#241c33]"
                >
                  Open past events
                </Link>
              </div>
            ) : null}

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#e6def4] bg-white/80 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[#7a7190]">Live events</p>
                <p className="mt-2 text-2xl font-semibold text-[#241c33]">{formatCount(recentEvents.length)}</p>
              </div>
              <div className="rounded-2xl border border-[#e6def4] bg-white/80 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[#7a7190]">Tracked flow</p>
                <p className="mt-2 text-2xl font-semibold text-[#241c33]">{formatCount(movementTotal)}</p>
              </div>
              <div className="rounded-2xl border border-[#e6def4] bg-white/80 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[#7a7190]">Committee view</p>
                <p className="mt-2 text-sm font-semibold text-[#241c33]">
                  One dashboard for creation, reporting, and event analysis.
                </p>
              </div>
            </div>
          </div>

          <article className="rounded-[28px] border border-[#e6def4] bg-white/90 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Create first</p>
            <h3 className="mt-2 text-2xl font-semibold text-[#241c33]">Create an event name</h3>
            <p className="mt-2 text-sm text-[#5f5673]">Once saved, the event opens into Organizer and Expenses.</p>

            {canManagePrograms ? (
              <div className="mt-4 space-y-3">
                <input
                  value={eventName}
                  onChange={(event) => setEventName(event.target.value)}
                  placeholder="Jewel Kids Camp 2026"
                  className="w-full rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33] outline-none"
                />
                <input
                  type="number"
                  min="1"
                  value={expectedAmount}
                  onChange={(event) => setExpectedAmount(event.target.value)}
                  placeholder="Default expected amount"
                  className="w-full rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33] outline-none"
                />
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    runAction(
                      () =>
                        createEventAction({
                          name: eventName,
                          defaultExpectedAmount: Number(expectedAmount),
                        }),
                      () => {
                        setEventName('');
                        setExpectedAmount('10000');
                      }
                    )
                  }
                  className="rounded-2xl bg-[#4B248C] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Create event and both ledgers
                </button>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4 text-sm text-[#5f5673]">
                Programs members can review events here. Event creation is available to Programs admins and super admins.
              </div>
            )}

          </article>
        </div>
      </section>

      {message ? <p className="rounded-2xl bg-[#f4fff4] px-4 py-3 text-sm text-[#255b2f]">{message}</p> : null}
      {error ? <p className="rounded-2xl bg-[#fff1ec] px-4 py-3 text-sm text-[#a63e1c]">{error}</p> : null}

      <section className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
        <article>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Department analysis</p>
              <h3 className="mt-2 text-2xl font-semibold text-[#241c33]">Department analysis</h3>
              <p className="mt-2 max-w-2xl text-sm text-[#5f5673]">
                A quick shared view of collections, expenses, and balance.
              </p>
            </div>
            <div className="rounded-full bg-[#ede7f7] px-3 py-1 text-xs font-semibold text-[#4B248C]">
              {recentEvents.length} recent • {pastEvents.length} past
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
              <p className="text-xs text-[#5f5673]">Total collected</p>
              <p className="mt-2 text-2xl font-semibold text-[#241c33]">{formatCount(totalCollected)}</p>
            </div>
            <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
              <p className="text-xs text-[#5f5673]">Total spent</p>
              <p className="mt-2 text-2xl font-semibold text-[#241c33]">{formatCount(totalSpent)}</p>
            </div>
            <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
              <p className="text-xs text-[#5f5673]">Balance retained</p>
              <p className="mt-2 text-2xl font-semibold text-[#241c33]">{formatCount(totalBalance)}</p>
            </div>
            <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
              <p className="text-xs text-[#5f5673]">Activity footprint</p>
              <p className="mt-2 text-sm font-semibold text-[#241c33]">
                {formatCount(totalParticipants)} participants • {formatCount(totalExpenseItems)} expenses
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-[24px] border border-[#ddd3f0] bg-[#f8f5fd] p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#241c33]">Detailed analysis board</p>
                <p className="text-xs text-[#7a7190]">
                  Collections, spending, and remaining balance for committee meetings and leadership review.
                </p>
              </div>
              <p className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#4B248C]">
                Spend coverage: {collectionCoverage}%
              </p>
            </div>
            <ProgramsEventSummaryChart
              totalCollected={totalCollected}
              totalSpent={totalSpent}
              balanceRetained={totalBalance}
            />
          </div>
        </article>
      </section>

      <section id="recent-events" className="space-y-6">
        <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Recent events</p>
              <h3 className="mt-2 text-2xl font-semibold text-[#241c33]">Current event dashboards</h3>
              <p className="mt-2 text-sm text-[#5f5673]">
                These are the active event spaces where teams can create, discuss, and present live figures.
              </p>
            </div>
            <div className="rounded-full bg-[#ede7f7] px-3 py-1 text-xs font-semibold text-[#4B248C]">
              {recentEvents.length} active
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {recentEvents.length === 0 ? (
              <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4 text-sm text-[#5f5673]">
                No active events yet. Create the first event above and it will become the first dashboard on this page.
              </div>
            ) : (
              recentEvents.map((event) => <EventCard key={event.id} event={event} />)
            )}
          </div>
        </article>

        <div className="space-y-4">
          {canManagePrograms && users.length > 0 ? (
            <details className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
              <summary className="cursor-pointer list-none text-xl font-semibold text-[#241c33]">
                Admin tools
              </summary>
              <p className="mt-3 text-sm text-[#5f5673]">
                Grant event-side access only when needed.
              </p>
              <div className="mt-4 space-y-3">
                <select
                  value={selectedEventId}
                  onChange={(event) => setSelectedEventId(event.target.value)}
                  className="w-full rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33] outline-none"
                >
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedUserId}
                  onChange={(event) => setSelectedUserId(event.target.value)}
                  className="w-full rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33] outline-none"
                >
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
                <select
                  value={selectedSide}
                  onChange={(event) => setSelectedSide(event.target.value as 'organizer' | 'finance' | 'admin')}
                  className="w-full rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33] outline-none"
                >
                  <option value="organizer">Organizer</option>
                  <option value="finance">Finance</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  type="button"
                  disabled={pending || !selectedEventId || !selectedUserId}
                  onClick={() =>
                    runAction(() =>
                      addEventMembershipAction({
                        eventId: Number(selectedEventId),
                        userId: Number(selectedUserId),
                        side: selectedSide,
                      })
                    )
                  }
                  className="rounded-2xl bg-[#4B248C] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Grant side access
                </button>
              </div>
            </details>
          ) : canManagePrograms ? (
            <details className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
              <summary className="cursor-pointer list-none text-xl font-semibold text-[#241c33]">
                Admin tools
              </summary>
              <h3 className="text-xl font-semibold text-[#241c33]">Grant event-side access</h3>
              <p className="mt-2 text-sm text-[#5f5673]">
                Event management is enabled, but the full cross-platform user list is only exposed from the super-admin
                side. Open the super-admin account when you want to assign event-side access directly.
              </p>
            </details>
          ) : null}

          <details className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
            <summary className="cursor-pointer list-none text-xl font-semibold text-[#241c33]">
              Event visibility tools
            </summary>
            <p className="mt-2 text-sm text-[#5f5673]">
              Keep archived dashboards visible in your switcher or hide them when you want a cleaner daily workspace.
            </p>
            <div className="mt-4 space-y-3">
              {eventMemberships.length === 0 ? (
                <p className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] px-4 py-3 text-sm text-[#5f5673]">
                  No event memberships yet.
                </p>
              ) : (
                eventMemberships.map((membership) => (
                  <div
                    key={membership.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4"
                  >
                    <div>
                      <p className="font-semibold text-[#241c33]">
                        {membership.event_name} • {membership.side}
                      </p>
                      <p className="text-xs text-[#7a7190]">Event status: {membership.status}</p>
                    </div>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        runAction(() =>
                          setEventVisibilityAction({
                            membershipId: membership.id,
                            remainVisible: membership.remain_visible !== 1,
                          })
                        )
                      }
                      className="rounded-2xl border border-[#d9cfee] bg-white px-4 py-2 text-sm font-medium text-[#241c33]"
                    >
                      {membership.remain_visible === 1 ? 'Hide from switcher' : 'Keep in switcher'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </details>
        </div>
      </section>

      <section id="past-events" className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Past events</p>
            <h3 className="mt-2 text-2xl font-semibold text-[#241c33]">Archived dashboards and records</h3>
            <p className="mt-2 text-sm text-[#5f5673]">
              Closed events remain useful as history, reporting evidence, and reference points for future planning.
            </p>
          </div>
          <div className="rounded-full bg-[#ede7f7] px-3 py-1 text-xs font-semibold text-[#4B248C]">
            {pastEvents.length} archived
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {pastEvents.length === 0 ? (
            <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4 text-sm text-[#5f5673]">
              No past events yet. Ended events will stay here for archive viewing and later reporting.
            </div>
          ) : (
            pastEvents.map((event) => <EventCard key={event.id} event={event} />)
          )}
        </div>
      </section>

      {hasFinanceAccess ? (
        <details className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
          <summary className="cursor-pointer list-none text-xl font-semibold text-[#241c33]">
            Finance tools
          </summary>
          <section className="mt-4 grid gap-6 xl:grid-cols-2">
          <article className="rounded-[28px] border border-[#ddd3f0] bg-[#fcfbff] p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-[#241c33]">Standalone contribution ledger</h3>
            <p className="mt-2 text-sm text-[#5f5673]">
              Keep finance work that is not tied to one event in its own reusable contribution ledger.
            </p>
            <div className="mt-4 space-y-3">
              <input
                value={contributionLedgerName}
                onChange={(event) => setContributionLedgerName(event.target.value)}
                placeholder="Building Fund Contributions"
                className="w-full rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33] outline-none"
              />
              <input
                type="number"
                min="1"
                value={expectedAmount}
                onChange={(event) => setExpectedAmount(event.target.value)}
                placeholder="Default expected amount"
                className="w-full rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33] outline-none"
              />
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  runAction(
                    () =>
                      createStandaloneContributionLedgerAction({
                        name: contributionLedgerName,
                        defaultExpectedAmount: Number(expectedAmount),
                      }),
                    () => setContributionLedgerName('')
                  )
                }
                className="rounded-2xl bg-[#4B248C] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                Create contribution ledger
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {standaloneLedgers.contributionLedgers.map((ledger) => (
                <div key={ledger.id} className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33]">
                  {ledger.name} • {ledger.status}
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[28px] border border-[#ddd3f0] bg-[#fcfbff] p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-[#241c33]">Standalone expense ledger</h3>
            <p className="mt-2 text-sm text-[#5f5673]">
              Use this when Finance needs a ledger that stands outside an event but still belongs in the same platform.
            </p>
            <div className="mt-4 space-y-3">
              <input
                value={expenseLedgerName}
                onChange={(event) => setExpenseLedgerName(event.target.value)}
                placeholder="Building Fund Expenses"
                className="w-full rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33] outline-none"
              />
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  runAction(
                    () => createStandaloneExpenseLedgerAction({ name: expenseLedgerName }),
                    () => setExpenseLedgerName('')
                  )
                }
                className="rounded-2xl bg-[#4B248C] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                Create expense ledger
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {standaloneLedgers.expenseLedgers.map((ledger) => (
                <div key={ledger.id} className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33]">
                  {ledger.name} • {ledger.status}
                </div>
              ))}
            </div>
          </article>
        </section>
        </details>
      ) : null}
    </div>
  );
}
