'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import {
  addContributionParticipantAction,
  addExpenseCategoryAction,
  addExpenseItemAction,
  endEventAction,
  recordContributionPaymentAction,
} from '@/app/actions/cap';
import type { EventDetail } from '@/lib/cap/types';
import { ProgramsEventSummaryChart } from './programs-event-summary-chart';

function WorkspaceCard({
  title,
  body,
  href,
  active,
  disabled,
  badge,
}: {
  title: string;
  body: string;
  href: string;
  active: boolean;
  disabled: boolean;
  badge: string;
}) {
  if (disabled) {
    return (
      <article className="rounded-[28px] border border-[#e6def4] bg-[#f8f5fd] p-5 opacity-70">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xl font-semibold text-[#241c33]">{title}</h3>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#7a7190]">{badge}</span>
        </div>
        <p className="mt-3 text-sm text-[#5f5673]">{body}</p>
      </article>
    );
  }

  return (
    <Link
      href={href}
      className={`block rounded-[28px] border p-5 transition-transform hover:-translate-y-0.5 ${
        active
          ? 'border-[#4B248C] bg-[linear-gradient(135deg,#f7f1ff_0%,#efe6ff_100%)]'
          : 'border-[#e6def4] bg-[#fbf9fe]'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xl font-semibold text-[#241c33]">{title}</h3>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#4B248C]">{badge}</span>
      </div>
      <p className="mt-3 text-sm text-[#5f5673]">{body}</p>
    </Link>
  );
}

export function ProgramsEventWorkspace({
  detail,
  selectedView,
}: {
  detail: EventDetail;
  selectedView: 'organizer' | 'finance' | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [participantName, setParticipantName] = useState('');
  const [participantExpectedAmount, setParticipantExpectedAmount] = useState(
    String(detail.contributionLedger?.defaultExpectedAmount || '')
  );
  const [paymentParticipantId, setPaymentParticipantId] = useState(String(detail.participants[0]?.id || ''));
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [expenseCategoryId, setExpenseCategoryId] = useState(String(detail.categories[0]?.id || ''));
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseExpectedAmount, setExpenseExpectedAmount] = useState('');
  const [expenseActualAmount, setExpenseActualAmount] = useState('');
  const [expensePaidBy, setExpensePaidBy] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'reimbursement_pending' | 'reimbursed'>('paid');

  const hasOrganizerAccess = detail.activeSide === 'organizer' || detail.canManageEvent;
  const hasFinanceAccess = detail.activeSide === 'finance' || detail.canManageEvent;
  const workspaceView =
    selectedView || (detail.canManageEvent ? null : detail.activeSide === 'finance' ? 'finance' : 'organizer');
  const totalCollected = detail.financialSummary?.totalCollected || 0;
  const totalSpent = detail.financialSummary?.totalSpent || 0;
  const totalBalance = detail.financialSummary?.balanceRetained || 0;
  const collectionCoverage = totalCollected > 0 ? Math.round((totalSpent / totalCollected) * 100) : 0;
  const recentPayments = detail.payments.slice(0, 5);
  const recentExpenses = detail.expenseItems.slice(0, 5);

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
      {message ? <p className="rounded-2xl bg-[#f4fff4] px-4 py-3 text-sm text-[#255b2f]">{message}</p> : null}
      {error ? <p className="rounded-2xl bg-[#fff1ec] px-4 py-3 text-sm text-[#a63e1c]">{error}</p> : null}

      <section className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Programs event</p>
            <h2 className="mt-2 text-3xl font-semibold text-[#241c33]">{detail.event.name}</h2>
            <p className="mt-2 text-sm text-[#5f5673]">
              Status: {detail.event.status} • Current access view:{' '}
              <span className="font-semibold text-[#241c33]">{detail.activeSide}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {detail.canManageEvent && detail.event.status === 'active' ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => runAction(() => endEventAction(detail.event.id))}
                className="rounded-2xl border border-[#eadfb8] bg-[#fff8eb] px-4 py-3 text-sm font-semibold text-[#7a5a12]"
              >
                End event and lock ledgers
              </button>
            ) : null}
            <Link
              href={`/programs/events/${detail.event.id}`}
              className="rounded-2xl border border-[#d9cfee] bg-white px-4 py-3 text-sm font-medium text-[#241c33]"
            >
              Event home
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <WorkspaceCard
          title="Organizer page"
          body="Manage participant names, expected amounts, collected payments, and the live contribution picture for this event."
          href={`/programs/events/${detail.event.id}?side=organizer`}
          active={workspaceView === 'organizer'}
          disabled={!hasOrganizerAccess}
          badge={hasOrganizerAccess ? 'Open workspace' : 'Access needed'}
        />
        <WorkspaceCard
          title="Expenses page"
          body="Manage categories, expense items, actual amounts, reimbursements, and the finance-side spending story."
          href={`/programs/events/${detail.event.id}?side=finance`}
          active={workspaceView === 'finance'}
          disabled={!hasFinanceAccess}
          badge={hasFinanceAccess ? 'Open workspace' : 'Access needed'}
        />
      </section>

      {detail.canViewReconciliation && detail.financialSummary ? (
        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Detailed analysis</p>
                <h3 className="mt-2 text-2xl font-semibold text-[#241c33]">Shared event summary</h3>
                <p className="mt-2 max-w-2xl text-sm text-[#5f5673]">
                  This is the analysis zone for the event itself. Department members can use it for discussion and
                  leadership can read the same story from the numbers.
                </p>
              </div>
              <p className="rounded-full bg-[#ede7f7] px-3 py-1 text-xs font-semibold text-[#4B248C]">
                Spend coverage: {collectionCoverage}%
              </p>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
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
            </div>

            <div className="mt-5 rounded-[24px] border border-[#ddd3f0] bg-[#f8f5fd] p-4">
              <ProgramsEventSummaryChart
                totalCollected={totalCollected}
                totalSpent={totalSpent}
                balanceRetained={totalBalance}
              />
            </div>
          </article>

          <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Quick read</p>
            <h3 className="mt-2 text-2xl font-semibold text-[#241c33]">What the room can see fast</h3>
            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
                <p className="text-sm font-semibold text-[#241c33]">Organizer side</p>
                <p className="mt-2 text-sm text-[#5f5673]">
                  {detail.participants.length} participants are currently registered for this event.
                </p>
              </div>
              <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
                <p className="text-sm font-semibold text-[#241c33]">Finance side</p>
                <p className="mt-2 text-sm text-[#5f5673]">
                  {detail.expenseItems.length} expense items are logged across {detail.categories.length} categories.
                </p>
              </div>
              <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
                <p className="text-sm font-semibold text-[#241c33]">Balance visibility</p>
                <p className="mt-2 text-sm text-[#5f5673]">
                  The event keeps a live balance so the department does not have to manually combine organizer and
                  finance reports during meetings.
                </p>
              </div>
            </div>
          </article>
        </section>
      ) : null}

      {workspaceView === null ? (
        <section className="grid gap-6 xl:grid-cols-2">
          <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
            <h3 className="text-2xl font-semibold text-[#241c33]">Recent organizer activity</h3>
            <p className="mt-2 text-sm text-[#5f5673]">
              Use the Organizer card above to enter deeper contribution work for this event.
            </p>
            <div className="mt-5 space-y-3">
              {recentPayments.length === 0 ? (
                <p className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] px-4 py-3 text-sm text-[#5f5673]">
                  No payments recorded yet.
                </p>
              ) : (
                recentPayments.map((payment) => {
                  const participant = detail.participants.find((item) => item.id === payment.participantId);
                  return (
                    <div key={payment.id} className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
                      <p className="font-semibold text-[#241c33]">{participant?.name || 'Participant'}</p>
                      <p className="mt-1 text-sm text-[#5f5673]">
                        Paid {payment.amount.toLocaleString()} on {payment.paymentDate}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </article>

          <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
            <h3 className="text-2xl font-semibold text-[#241c33]">Recent expense activity</h3>
            <p className="mt-2 text-sm text-[#5f5673]">
              Use the Expenses card above to enter deeper finance work for this event.
            </p>
            <div className="mt-5 space-y-3">
              {recentExpenses.length === 0 ? (
                <p className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] px-4 py-3 text-sm text-[#5f5673]">
                  No expense items recorded yet.
                </p>
              ) : (
                recentExpenses.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
                    <p className="font-semibold text-[#241c33]">{item.description}</p>
                    <p className="mt-1 text-sm text-[#5f5673]">
                      Actual: {item.actualAmount ?? '-'} • Status: {item.paymentStatus}
                    </p>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>
      ) : null}

      {workspaceView === 'organizer' ? (
        <section className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-2xl font-semibold text-[#241c33]">Organizer workspace</h3>
              <p className="mt-2 text-sm text-[#5f5673]">
                Add participants, track collections, and keep the contribution side ready for review.
              </p>
            </div>
            <div className="rounded-full bg-[#ede7f7] px-3 py-1 text-xs font-semibold text-[#4B248C]">
              {detail.participants.length} participants
            </div>
          </div>

          {hasOrganizerAccess && detail.contributionLedger ? (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="space-y-3 rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
                <h4 className="font-semibold text-[#241c33]">Add participant</h4>
                <input
                  value={participantName}
                  onChange={(event) => setParticipantName(event.target.value)}
                  placeholder="Participant name"
                  className="w-full rounded-2xl border border-[#d9cfee] bg-white px-4 py-3 text-sm text-[#241c33] outline-none"
                />
                <input
                  type="number"
                  min="1"
                  value={participantExpectedAmount}
                  onChange={(event) => setParticipantExpectedAmount(event.target.value)}
                  placeholder="Expected amount"
                  className="w-full rounded-2xl border border-[#d9cfee] bg-white px-4 py-3 text-sm text-[#241c33] outline-none"
                />
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    runAction(
                      () =>
                        addContributionParticipantAction({
                          ledgerId: detail.contributionLedger!.id,
                          name: participantName,
                          expectedAmount: Number(participantExpectedAmount),
                        }),
                      () => setParticipantName('')
                    )
                  }
                  className="rounded-2xl bg-[#4B248C] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Add participant
                </button>
              </div>

              <div className="space-y-3 rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
                <h4 className="font-semibold text-[#241c33]">Record payment</h4>
                <select
                  value={paymentParticipantId}
                  onChange={(event) => setPaymentParticipantId(event.target.value)}
                  className="w-full rounded-2xl border border-[#d9cfee] bg-white px-4 py-3 text-sm text-[#241c33] outline-none"
                >
                  {detail.participants.map((participant) => (
                    <option key={participant.id} value={participant.id}>
                      {participant.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={paymentAmount}
                  onChange={(event) => setPaymentAmount(event.target.value)}
                  placeholder="Payment amount"
                  className="w-full rounded-2xl border border-[#d9cfee] bg-white px-4 py-3 text-sm text-[#241c33] outline-none"
                />
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(event) => setPaymentDate(event.target.value)}
                  className="w-full rounded-2xl border border-[#d9cfee] bg-white px-4 py-3 text-sm text-[#241c33] outline-none"
                />
                <button
                  type="button"
                  disabled={pending || !paymentParticipantId}
                  onClick={() =>
                    runAction(
                      () =>
                        recordContributionPaymentAction({
                          participantId: Number(paymentParticipantId),
                          amount: Number(paymentAmount),
                          paymentDate,
                        }),
                      () => {
                        setPaymentAmount('');
                        setPaymentDate('');
                      }
                    )
                  }
                  className="rounded-2xl bg-[#4B248C] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Save payment
                </button>
              </div>
            </div>
          ) : null}

          <div className="mt-5 space-y-3">
            {detail.participants.map((participant) => (
              <div key={participant.id} className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#241c33]">{participant.name}</p>
                    <p className="text-sm text-[#5f5673]">
                      Expected: {participant.expectedAmount.toLocaleString()} • Paid:{' '}
                      {participant.amountPaid.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#4B248C]">
                    Balance: {participant.balance.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
            {detail.participants.length === 0 ? (
              <p className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] px-4 py-3 text-sm text-[#5f5673]">
                No contribution participants yet.
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      {workspaceView === 'finance' ? (
        <section className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-2xl font-semibold text-[#241c33]">Expenses workspace</h3>
              <p className="mt-2 text-sm text-[#5f5673]">
                Build categories, record actuals, and track reimbursements or paid items from the finance side.
              </p>
            </div>
            <div className="rounded-full bg-[#ede7f7] px-3 py-1 text-xs font-semibold text-[#4B248C]">
              {detail.expenseItems.length} expenses
            </div>
          </div>

          {hasFinanceAccess && detail.expenseLedger ? (
            <div className="mt-5 space-y-4">
              <div className="space-y-3 rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
                <h4 className="font-semibold text-[#241c33]">Add category</h4>
                <input
                  value={categoryName}
                  onChange={(event) => setCategoryName(event.target.value)}
                  placeholder="Food"
                  className="w-full rounded-2xl border border-[#d9cfee] bg-white px-4 py-3 text-sm text-[#241c33] outline-none"
                />
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    runAction(
                      () =>
                        addExpenseCategoryAction({
                          ledgerId: detail.expenseLedger!.id,
                          name: categoryName,
                        }),
                      () => setCategoryName('')
                    )
                  }
                  className="rounded-2xl bg-[#4B248C] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Add category
                </button>
              </div>

              <div className="space-y-3 rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
                <h4 className="font-semibold text-[#241c33]">Add expense item</h4>
                <select
                  value={expenseCategoryId}
                  onChange={(event) => setExpenseCategoryId(event.target.value)}
                  className="w-full rounded-2xl border border-[#d9cfee] bg-white px-4 py-3 text-sm text-[#241c33] outline-none"
                >
                  {detail.categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <input
                  value={expenseDescription}
                  onChange={(event) => setExpenseDescription(event.target.value)}
                  placeholder="Kitchen supplies"
                  className="w-full rounded-2xl border border-[#d9cfee] bg-white px-4 py-3 text-sm text-[#241c33] outline-none"
                />
                <input
                  type="number"
                  min="0"
                  value={expenseExpectedAmount}
                  onChange={(event) => setExpenseExpectedAmount(event.target.value)}
                  placeholder="Expected amount"
                  className="w-full rounded-2xl border border-[#d9cfee] bg-white px-4 py-3 text-sm text-[#241c33] outline-none"
                />
                <input
                  type="number"
                  min="0"
                  value={expenseActualAmount}
                  onChange={(event) => setExpenseActualAmount(event.target.value)}
                  placeholder="Actual amount"
                  className="w-full rounded-2xl border border-[#d9cfee] bg-white px-4 py-3 text-sm text-[#241c33] outline-none"
                />
                <input
                  value={expensePaidBy}
                  onChange={(event) => setExpensePaidBy(event.target.value)}
                  placeholder="Paid by / owed to"
                  className="w-full rounded-2xl border border-[#d9cfee] bg-white px-4 py-3 text-sm text-[#241c33] outline-none"
                />
                <select
                  value={paymentStatus}
                  onChange={(event) =>
                    setPaymentStatus(event.target.value as 'paid' | 'reimbursement_pending' | 'reimbursed')
                  }
                  className="w-full rounded-2xl border border-[#d9cfee] bg-white px-4 py-3 text-sm text-[#241c33] outline-none"
                >
                  <option value="paid">paid</option>
                  <option value="reimbursement_pending">reimbursement_pending</option>
                  <option value="reimbursed">reimbursed</option>
                </select>
                <button
                  type="button"
                  disabled={pending || !expenseCategoryId}
                  onClick={() =>
                    runAction(
                      () =>
                        addExpenseItemAction({
                          categoryId: Number(expenseCategoryId),
                          description: expenseDescription,
                          expectedAmount: expenseExpectedAmount ? Number(expenseExpectedAmount) : null,
                          actualAmount: expenseActualAmount ? Number(expenseActualAmount) : null,
                          paidBy: expensePaidBy,
                          paymentStatus,
                        }),
                      () => {
                        setExpenseDescription('');
                        setExpenseExpectedAmount('');
                        setExpenseActualAmount('');
                        setExpensePaidBy('');
                      }
                    )
                  }
                  className="rounded-2xl bg-[#4B248C] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Add expense item
                </button>
              </div>
            </div>
          ) : null}

          <div className="mt-5 space-y-3">
            {detail.expenseItems.map((item) => (
              <div key={item.id} className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
                <p className="font-semibold text-[#241c33]">{item.description}</p>
                <p className="mt-1 text-sm text-[#5f5673]">
                  Expected: {item.expectedAmount ?? '-'} • Actual: {item.actualAmount ?? '-'} • Status:{' '}
                  {item.paymentStatus}
                </p>
              </div>
            ))}
            {detail.expenseItems.length === 0 ? (
              <p className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] px-4 py-3 text-sm text-[#5f5673]">
                No expense items yet.
              </p>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
