'use client';

import Link from 'next/link';
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
  eventMemberships: Array<{
    id: number;
    event_id: number;
    event_name: string;
    side: 'organizer' | 'finance' | 'admin';
    remain_visible: number;
    status: 'active' | 'ended';
  }>;
  standaloneLedgers: {
    contributionLedgers: Array<{ id: number; name: string; status: string }>;
    expenseLedgers: Array<{ id: number; name: string; status: string }>;
  };
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const totalCollected = events.reduce((sum, event) => sum + event.totalCollected, 0);
  const totalSpent = events.reduce((sum, event) => sum + event.totalSpent, 0);
  const totalBalance = events.reduce((sum, event) => sum + event.balanceRetained, 0);
  const totalParticipants = events.reduce((sum, event) => sum + event.participantCount, 0);
  const totalExpenseItems = events.reduce((sum, event) => sum + event.expenseItemCount, 0);
  const activeEvents = events.filter((event) => event.status === 'active').length;
  const endedEvents = events.length - activeEvents;
  const collectionCoverage = totalCollected > 0 ? Math.round((totalSpent / totalCollected) * 100) : 0;

  const [eventName, setEventName] = useState('');
  const [expectedAmount, setExpectedAmount] = useState('10000');
  const [selectedEventId, setSelectedEventId] = useState(String(events[0]?.id || ''));
  const [selectedUserId, setSelectedUserId] = useState(String(users[0]?.id || ''));
  const [selectedSide, setSelectedSide] = useState<'organizer' | 'finance' | 'admin'>('organizer');
  const [contributionLedgerName, setContributionLedgerName] = useState('');
  const [expenseLedgerName, setExpenseLedgerName] = useState('');

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
    });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Phase 3</p>
        <h2 className="mt-2 text-3xl font-semibold text-[#241c33]">Programs, events, and reusable ledgers</h2>
        <p className="mt-2 max-w-3xl text-sm text-[#5f5673]">
          Run event organizer and finance work inside the same portal, keep ended events viewable, and let Finance spin
          up standalone ledgers without leaving the platform.
        </p>

        {programsDepartmentId ? (
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={`/meetings?departmentId=${programsDepartmentId}`}
              className="rounded-2xl bg-[#4B248C] px-4 py-3 text-sm font-semibold text-white"
            >
              Programs meetings
            </Link>
            <Link
              href={`/records/new?departmentId=${programsDepartmentId}`}
              className="rounded-2xl bg-[#fff8eb] px-4 py-3 text-sm font-semibold text-[#8a6113]"
            >
              Add Programs record
            </Link>
            <Link
              href={`/records?departmentId=${programsDepartmentId}`}
              className="rounded-2xl border border-[#d9cfee] bg-white px-4 py-3 text-sm font-semibold text-[#241c33]"
            >
              Programs records archive
            </Link>
            <Link
              href={`/insights?departmentId=${programsDepartmentId}`}
              className="rounded-2xl border border-[#d9cfee] bg-white px-4 py-3 text-sm font-semibold text-[#241c33]"
            >
              Programs insights
            </Link>
          </div>
        ) : null}

        <p className="mt-4 text-sm text-[#5f5673]">
          Programs already has a place for meetings and records in the same portal. Use the shortcuts above to store
          department meetings, department records, and follow-up history alongside event work.
        </p>
      </section>

      {message ? <p className="rounded-2xl bg-[#f4fff4] px-4 py-3 text-sm text-[#255b2f]">{message}</p> : null}
      {error ? <p className="rounded-2xl bg-[#fff1ec] px-4 py-3 text-sm text-[#a63e1c]">{error}</p> : null}

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Programs board</p>
              <h3 className="mt-2 text-2xl font-semibold text-[#241c33]">Department-wide financial picture</h3>
              <p className="mt-2 max-w-2xl text-sm text-[#5f5673]">
                This gives Programs the same kind of quick read that Leadership gets, but scoped to the department's
                own events for planning meetings, reviews, and live presentations.
              </p>
            </div>
            <div className="rounded-full bg-[#ede7f7] px-3 py-1 text-xs font-semibold text-[#4B248C]">
              {activeEvents} active • {endedEvents} ended
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
              <p className="text-xs text-[#5f5673]">Total collected</p>
              <p className="mt-2 text-2xl font-semibold text-[#241c33]">{totalCollected.toLocaleString()}</p>
            </div>
            <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
              <p className="text-xs text-[#5f5673]">Total spent</p>
              <p className="mt-2 text-2xl font-semibold text-[#241c33]">{totalSpent.toLocaleString()}</p>
            </div>
            <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
              <p className="text-xs text-[#5f5673]">Balance retained</p>
              <p className="mt-2 text-2xl font-semibold text-[#241c33]">{totalBalance.toLocaleString()}</p>
            </div>
            <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
              <p className="text-xs text-[#5f5673]">Activity footprint</p>
              <p className="mt-2 text-sm font-semibold text-[#241c33]">
                {totalParticipants} participants • {totalExpenseItems} expenses
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-[24px] border border-[#ddd3f0] bg-[#f8f5fd] p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#241c33]">Presentation-ready overview</p>
                <p className="text-xs text-[#7a7190]">
                  Use this during committee or leadership discussions to explain collections, spending, and what
                  remains.
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

        <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Discussion points</p>
          <h3 className="mt-2 text-2xl font-semibold text-[#241c33]">What the room can see quickly</h3>
          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
              <p className="text-sm font-semibold text-[#241c33]">Collections vs expenses</p>
              <p className="mt-2 text-sm text-[#5f5673]">
                Teams can compare incoming payments against outgoing expenses without opening each ledger one by one.
              </p>
            </div>
            <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
              <p className="text-sm font-semibold text-[#241c33]">Balance retained</p>
              <p className="mt-2 text-sm text-[#5f5673]">
                The remaining balance stays visible for accountability, carry-forward planning, and reporting to
                leadership.
              </p>
            </div>
            <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
              <p className="text-sm font-semibold text-[#241c33]">Department-only visibility</p>
              <p className="mt-2 text-sm text-[#5f5673]">
                Programs can present its own event picture in one place, while Leadership still keeps its wider
                read-only overview elsewhere.
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-semibold text-[#241c33]">Programs events</h3>
              <p className="mt-2 text-sm text-[#5f5673]">
                Open an event workspace to manage contributions, expenses, and reconciliation by side.
              </p>
            </div>
            <div className="rounded-full bg-[#ede7f7] px-3 py-1 text-xs font-semibold text-[#4B248C]">
              {events.length} events
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {events.length === 0 ? (
              <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4 text-sm text-[#5f5673]">
                No events yet. Create the first camp, retreat, or fundraiser from the form on this page.
              </div>
            ) : (
              events.map((event) => {
                const side = event.userSides.includes('admin')
                  ? 'admin'
                  : event.userSides.includes('organizer')
                    ? 'organizer'
                    : 'finance';

                return (
                  <div key={event.id} className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h4 className="text-lg font-semibold text-[#241c33]">{event.name}</h4>
                        <p className="mt-1 text-sm text-[#5f5673]">
                          Status: {event.status} • Your sides: {event.userSides.join(', ')}
                        </p>
                      </div>
                      <Link
                        href={`/programs/events/${event.id}?side=${side}`}
                        className="rounded-2xl bg-[#4B248C] px-4 py-2 text-sm font-semibold text-white"
                      >
                        Open workspace
                      </Link>
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-4">
                      <div className="rounded-2xl bg-white p-3">
                        <p className="text-xs text-[#5f5673]">Collected</p>
                        <p className="mt-1 text-lg font-semibold text-[#241c33]">
                          {event.totalCollected.toLocaleString()}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white p-3">
                        <p className="text-xs text-[#5f5673]">Spent</p>
                        <p className="mt-1 text-lg font-semibold text-[#241c33]">
                          {event.totalSpent.toLocaleString()}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white p-3">
                        <p className="text-xs text-[#5f5673]">Balance</p>
                        <p className="mt-1 text-lg font-semibold text-[#241c33]">
                          {event.balanceRetained.toLocaleString()}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white p-3">
                        <p className="text-xs text-[#5f5673]">Activity</p>
                        <p className="mt-1 text-sm font-semibold text-[#241c33]">
                          {event.participantCount} participants • {event.expenseItemCount} expenses
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-[#ddd3f0] bg-[#f8f5fd] p-3">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[#241c33]">Event summary board</p>
                          <p className="text-xs text-[#7a7190]">
                            Shared visual summary for organizer, finance, and leadership discussions.
                          </p>
                        </div>
                        <p className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#4B248C]">
                          {event.status === 'active' ? 'Live event' : 'Archive view'}
                        </p>
                      </div>
                      <ProgramsEventSummaryChart
                        totalCollected={event.totalCollected}
                        totalSpent={event.totalSpent}
                        balanceRetained={event.balanceRetained}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </article>

        <div className="space-y-6">
          {canManagePrograms ? (
            <>
              <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-[#241c33]">Create a new event</h3>
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
              </article>

              <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-[#241c33]">Grant event-side access</h3>
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
                    onChange={(event) =>
                      setSelectedSide(event.target.value as 'organizer' | 'finance' | 'admin')
                    }
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
              </article>
            </>
          ) : null}

          <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-[#241c33]">Ended event visibility</h3>
            <p className="mt-2 text-sm text-[#5f5673]">
              Keep ended events in your switcher as a record, or hide them to reduce clutter.
            </p>
            <div className="mt-4 space-y-3">
              {eventMemberships.length === 0 ? (
                <p className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] px-4 py-3 text-sm text-[#5f5673]">
                  No event memberships yet.
                </p>
              ) : (
                eventMemberships.map((membership) => (
                  <div key={membership.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
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
          </article>
        </div>
      </section>

      {hasFinanceAccess ? (
        <section className="grid gap-6 xl:grid-cols-2">
          <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-[#241c33]">Standalone contribution ledger</h3>
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

          <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-[#241c33]">Standalone expense ledger</h3>
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
      ) : null}
    </div>
  );
}
