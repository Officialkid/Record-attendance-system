'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

import {
  addContributionParticipantAction,
  addExpenseCategoryAction,
  addExpenseItemAction,
  deleteEventAction,
  endEventAction,
  recordContributionPaymentAction,
  updateEventAction,
} from '@/app/actions/cap';
import type { EventDetail } from '@/lib/cap/types';

function WorkspaceCard({
  title,
  body,
  href,
  badge,
  accent,
}: {
  title: string;
  body: string;
  href: string;
  badge: string;
  accent: 'purple' | 'gold';
}) {
  const accentClasses =
    accent === 'purple'
      ? 'border-[#4B248C] bg-[linear-gradient(135deg,#f7f1ff_0%,#efe6ff_100%)]'
      : 'border-[#e6def4] bg-white';

  return (
    <Link href={href} className={`block rounded-[28px] border p-6 transition-transform hover:-translate-y-0.5 ${accentClasses}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-2xl font-semibold text-[#241c33]">{title}</h3>
          <p className="mt-3 max-w-3xl text-sm text-[#5f5673]">{body}</p>
        </div>
        <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#4B248C]">{badge}</span>
      </div>
    </Link>
  );
}

function SurfaceCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-[#7a7190]">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-[#241c33]">{value}</p>
    </div>
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
  const [eventName, setEventName] = useState(detail.event.name);
  const [eventStatus, setEventStatus] = useState<'active' | 'ended'>(detail.event.status);
  const [eventEndedAt, setEventEndedAt] = useState(detail.event.endedAt ? detail.event.endedAt.slice(0, 10) : '');

  const hasOrganizerAccess = detail.activeSide === 'organizer' || detail.canManageEvent;
  const hasFinanceAccess = detail.activeSide === 'finance' || detail.canManageEvent;
  const workspaceView =
    selectedView || (detail.canManageEvent ? null : detail.activeSide === 'finance' ? 'finance' : 'organizer');

  const totalCollected = detail.financialSummary?.totalCollected || 0;
  const totalSpent = detail.financialSummary?.totalSpent || 0;
  const totalBalance = detail.financialSummary?.balanceRetained || 0;
  const totalExpected = detail.participants.reduce((sum, participant) => sum + participant.expectedAmount, 0);
  const collectionCoverage = totalCollected > 0 ? Math.round((totalSpent / totalCollected) * 100) : 0;
  const recentPayments = detail.payments.slice(0, 2);
  const recentExpenses = detail.expenseItems.slice(0, 2);
  const selectedPaymentParticipant =
    detail.participants.find((participant) => String(participant.id) === paymentParticipantId) || null;
  const alternateWorkspaceHref =
    workspaceView === 'organizer'
      ? `/programs/events/${detail.event.id}?side=finance`
      : `/programs/events/${detail.event.id}?side=organizer`;
  const alternateWorkspaceLabel = workspaceView === 'organizer' ? 'Open expenses workspace' : 'Open organizer workspace';

  useEffect(() => {
    if (detail.participants.length === 0) {
      setPaymentParticipantId('');
      return;
    }

    const stillExists = detail.participants.some(
      (participant) => String(participant.id) === paymentParticipantId
    );

    if (!stillExists) {
      setPaymentParticipantId(String(detail.participants[0]!.id));
    }
  }, [detail.participants, paymentParticipantId]);

  useEffect(() => {
    if (detail.categories.length === 0) {
      setExpenseCategoryId('');
      return;
    }

    const stillExists = detail.categories.some(
      (category) => String(category.id) === expenseCategoryId
    );

    if (!stillExists) {
      setExpenseCategoryId(String(detail.categories[0]!.id));
    }
  }, [detail.categories, expenseCategoryId]);

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
              Status: {detail.event.status} • Access view: <span className="font-semibold text-[#241c33]">{detail.activeSide}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {workspaceView ? (
              <Link
                href={`/programs/events/${detail.event.id}`}
                className="rounded-2xl border border-[#d9cfee] bg-white px-4 py-3 text-sm font-medium text-[#241c33]"
              >
                Back to event home
              </Link>
            ) : null}
            {workspaceView && ((workspaceView === 'organizer' && hasFinanceAccess) || (workspaceView === 'finance' && hasOrganizerAccess)) ? (
              <Link
                href={alternateWorkspaceHref}
                className="rounded-2xl border border-[#d9cfee] bg-white px-4 py-3 text-sm font-medium text-[#241c33]"
              >
                {alternateWorkspaceLabel}
              </Link>
            ) : null}
            {detail.canManageEvent && detail.event.status === 'active' ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => runAction(() => endEventAction(detail.event.id))}
                className="rounded-2xl border border-[#eadfb8] bg-[#fff8eb] px-4 py-3 text-sm font-semibold text-[#7a5a12] disabled:opacity-60"
              >
                End event
              </button>
            ) : null}
            {detail.canManageEvent ? (
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  runAction(() => deleteEventAction(detail.event.id), () => {
                    router.push('/programs');
                  })
                }
                className="rounded-2xl border border-[#f0c7bf] bg-white px-4 py-3 text-sm font-semibold text-[#9b3e2f] disabled:opacity-60"
              >
                Delete event
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <SurfaceCard title="Collected" value={totalCollected.toLocaleString()} />
          <SurfaceCard title="Spent" value={totalSpent.toLocaleString()} />
          <SurfaceCard title="Balance" value={totalBalance.toLocaleString()} />
          <SurfaceCard title="Coverage" value={`${collectionCoverage}%`} />
        </div>

        {detail.canManageEvent ? (
          <details className="mt-5 rounded-[24px] border border-[#e6def4] bg-[#fbf9fe] p-5">
            <summary className="cursor-pointer list-none text-sm font-semibold text-[#241c33]">
              More event admin tools
            </summary>
            <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-[#241c33]">Event correction</h3>
                <p className="mt-2 text-sm text-[#5f5673]">
                  Adjust the event name, status, or end date without keeping these controls fully open on every visit.
                </p>
              </div>
              <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#4B248C]">
                Admin only
              </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              <input
                value={eventName}
                onChange={(event) => setEventName(event.target.value)}
                placeholder="Event name"
                className="w-full rounded-2xl border border-[#d9cfee] bg-white px-4 py-3 text-sm text-[#241c33] outline-none"
              />
              <select
                value={eventStatus}
                onChange={(event) => setEventStatus(event.target.value as 'active' | 'ended')}
                className="w-full rounded-2xl border border-[#d9cfee] bg-white px-4 py-3 text-sm text-[#241c33] outline-none"
              >
                <option value="active">active</option>
                <option value="ended">ended</option>
              </select>
              <input
                type="date"
                value={eventEndedAt}
                onChange={(event) => setEventEndedAt(event.target.value)}
                disabled={eventStatus === 'active'}
                className="w-full rounded-2xl border border-[#d9cfee] bg-white px-4 py-3 text-sm text-[#241c33] outline-none disabled:opacity-60"
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={pending || eventName.trim().length < 3 || (eventStatus === 'ended' && !eventEndedAt)}
                onClick={() =>
                  runAction(() =>
                    updateEventAction({
                      eventId: detail.event.id,
                      name: eventName.trim(),
                      status: eventStatus,
                      endedAt: eventStatus === 'ended' ? eventEndedAt : null,
                    })
                  )
                }
                className="rounded-2xl bg-[#4B248C] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                Save event details
              </button>
              <p className="text-sm text-[#5f5673]">
                {eventStatus === 'active'
                  ? 'The event stays open and editable.'
                  : 'Set the correct closure date before saving.'}
              </p>
            </div>
          </details>
        ) : null}
      </section>

      {workspaceView === null ? (
        <>
          <section className="grid gap-4 xl:grid-cols-2">
            {hasOrganizerAccess ? (
              <WorkspaceCard
                title="Organizer page"
                body="Manage participant names, expected amounts, collected payments, and the live contribution picture for this event."
                href={`/programs/events/${detail.event.id}?side=organizer`}
                badge="Open workspace"
                accent="purple"
              />
            ) : null}
            {hasFinanceAccess ? (
              <WorkspaceCard
                title="Expenses page"
                body="Manage categories, expense items, planned amounts, actual amounts, reimbursements, and the finance-side spending story."
                href={`/programs/events/${detail.event.id}?side=finance`}
                badge="Open workspace"
                accent="gold"
              />
            ) : null}
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <details className="rounded-[24px] border border-[#ddd3f0] bg-white p-5 shadow-sm">
              <summary className="cursor-pointer list-none text-sm font-semibold text-[#241c33]">
                Recent collections
              </summary>
              <div className="mt-3 space-y-3">
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
            </details>

            <details className="rounded-[24px] border border-[#ddd3f0] bg-white p-5 shadow-sm">
              <summary className="cursor-pointer list-none text-sm font-semibold text-[#241c33]">
                Recent expenses
              </summary>
              <div className="mt-3 space-y-3">
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
            </details>
          </section>
        </>
      ) : null}

      {workspaceView === 'organizer' ? (
        <section className="space-y-5 rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-2xl font-semibold text-[#241c33]">Organizer workspace</h3>
              <p className="mt-2 text-sm text-[#5f5673]">
                This page stays focused on participants and collections only.
              </p>
            </div>
            <div className="rounded-full bg-[#ede7f7] px-3 py-1 text-xs font-semibold text-[#4B248C]">
              {detail.participants.length} participants
            </div>
          </div>

          {hasOrganizerAccess && detail.contributionLedger ? (
            <div className="grid gap-4 lg:grid-cols-2">
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
                  disabled={pending || !participantName.trim() || Number(participantExpectedAmount) <= 0}
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
                  disabled={detail.participants.length === 0}
                  className="w-full rounded-2xl border border-[#d9cfee] bg-white px-4 py-3 text-sm text-[#241c33] outline-none"
                >
                  <option value="">{detail.participants.length === 0 ? 'Add a participant first' : 'Choose participant'}</option>
                  {detail.participants.map((participant) => (
                    <option key={participant.id} value={participant.id}>
                      {participant.name} ({participant.amountPaid.toLocaleString()} paid)
                    </option>
                  ))}
                </select>
                <p className="text-sm text-[#5f5673]">
                  {selectedPaymentParticipant
                    ? `Recording for ${selectedPaymentParticipant.name}. Remaining balance: ${selectedPaymentParticipant.balance.toLocaleString()}.`
                    : 'Use the dropdown to choose the exact participant receiving this payment entry.'}
                </p>
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
                  disabled={pending || !paymentParticipantId || Number(paymentAmount) <= 0 || paymentDate.trim().length === 0}
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

          <div className="grid gap-3 md:grid-cols-3">
            <SurfaceCard title="Expected" value={totalExpected.toLocaleString()} />
            <SurfaceCard title="Collected" value={totalCollected.toLocaleString()} />
            <SurfaceCard title="Outstanding" value={Math.max(totalExpected - totalCollected, 0).toLocaleString()} />
          </div>

          <details className="rounded-[24px] border border-[#e6def4] bg-[#fbf9fe] p-4">
            <summary className="cursor-pointer list-none text-sm font-semibold text-[#241c33]">
              Participants list
            </summary>
            <div className="mt-3 space-y-3">
              {detail.participants.map((participant) => (
                <div key={participant.id} className="rounded-2xl border border-[#e6def4] bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[#241c33]">{participant.name}</p>
                      <p className="text-sm text-[#5f5673]">
                        Expected: {participant.expectedAmount.toLocaleString()} • Paid: {participant.amountPaid.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-full bg-[#f4effb] px-3 py-1 text-xs font-semibold text-[#4B248C]">
                      Balance: {participant.balance.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
              {detail.participants.length === 0 ? (
                <p className="rounded-2xl border border-[#e6def4] bg-white px-4 py-3 text-sm text-[#5f5673]">
                  No contribution participants yet.
                </p>
              ) : null}
            </div>
          </details>
        </section>
      ) : null}

      {workspaceView === 'finance' ? (
        <section className="space-y-5 rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-2xl font-semibold text-[#241c33]">Expenses workspace</h3>
              <p className="mt-2 text-sm text-[#5f5673]">
                This page stays focused on categories, planning figures, actuals, and reimbursements.
              </p>
            </div>
            <div className="rounded-full bg-[#ede7f7] px-3 py-1 text-xs font-semibold text-[#4B248C]">
              {detail.expenseItems.length} expenses
            </div>
          </div>

          {hasFinanceAccess && detail.expenseLedger ? (
            <div className="space-y-4">
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
                  disabled={pending || !categoryName.trim()}
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
                <div>
                  <h4 className="font-semibold text-[#241c33]">Add expense item</h4>
                  <p className="mt-1 text-sm text-[#5f5673]">
                    Description, actual amount, and paid-by details can be filled later. Planning entries can start with the expected amount only.
                  </p>
                </div>
                <select
                  value={expenseCategoryId}
                  onChange={(event) => setExpenseCategoryId(event.target.value)}
                  className="w-full rounded-2xl border border-[#d9cfee] bg-white px-4 py-3 text-sm text-[#241c33] outline-none"
                >
                  <option value="">Choose category</option>
                  {detail.categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <input
                  value={expenseDescription}
                  onChange={(event) => setExpenseDescription(event.target.value)}
                  placeholder="Optional description"
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
                  placeholder="Actual amount (optional for now)"
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

          <details className="rounded-[24px] border border-[#e6def4] bg-[#fbf9fe] p-4">
            <summary className="cursor-pointer list-none text-sm font-semibold text-[#241c33]">
              Expense items
            </summary>
            <div className="mt-3 space-y-3">
              {detail.expenseItems.map((item) => (
                <div key={item.id} className="rounded-2xl border border-[#e6def4] bg-white p-4">
                  <p className="font-semibold text-[#241c33]">{item.description}</p>
                  <p className="mt-1 text-sm text-[#5f5673]">
                    Expected: {item.expectedAmount ?? '-'} • Actual: {item.actualAmount ?? '-'} • Status: {item.paymentStatus}
                  </p>
                </div>
              ))}
              {detail.expenseItems.length === 0 ? (
                <p className="rounded-2xl border border-[#e6def4] bg-white px-4 py-3 text-sm text-[#5f5673]">
                  No expense items yet.
                </p>
              ) : null}
            </div>
          </details>
        </section>
      ) : null}
    </div>
  );
}
