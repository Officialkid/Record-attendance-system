'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';

import {
  markNotificationReadAction,
  runMeetingRemindersAction,
} from '@/app/actions/cap';
import type { UserNotification } from '@/lib/cap/types';

export function NotificationsCenter({
  notifications,
  canRunReminderJob,
}: {
  notifications: UserNotification[];
  canRunReminderJob: boolean;
}) {
  const [items, setItems] = useState(notifications);
  const [feedback, setFeedback] = useState('');
  const [pending, startTransition] = useTransition();
  const [runningJob, startJobTransition] = useTransition();

  return (
    <section className="space-y-6">
      {canRunReminderJob ? (
        <div className="rounded-[28px] border border-[#eadfb8] bg-[#fffbf0] p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-[#241c33]">Meeting reminder job</h3>
              <p className="mt-2 text-sm text-[#5f5673]">
                Run the default reminder pass now to queue in-app notices and Resend emails for upcoming department meetings.
              </p>
            </div>
            <button
              type="button"
              disabled={runningJob}
              onClick={() => {
                setFeedback('');
                startJobTransition(async () => {
                  const result = await runMeetingRemindersAction();
                  setFeedback(result.message);
                });
              }}
              className="rounded-2xl bg-[#C9A461] px-4 py-2 text-sm font-semibold text-[#241c33] disabled:opacity-60"
            >
              {runningJob ? 'Running reminders...' : 'Run reminder job'}
            </button>
          </div>
        </div>
      ) : null}

      {feedback ? (
        <p className="rounded-2xl bg-[#f4effb] px-4 py-3 text-sm text-[#4B248C]">{feedback}</p>
      ) : null}

      <div className="space-y-4">
        {items.length === 0 ? (
          <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-[#241c33]">No notifications yet</h3>
            <p className="mt-2 text-sm text-[#5f5673]">
              Meeting reminders, invite follow-through, and workflow alerts will appear here once CAP starts delivering them.
            </p>
          </article>
        ) : (
          items.map((notification) => (
            <article
              key={notification.id}
              className={`rounded-[28px] border bg-white p-6 shadow-sm ${
                notification.readAt ? 'border-[#e6def4]' : 'border-[#c9a461]'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-[#241c33]">{notification.title}</h3>
                    {!notification.readAt ? (
                      <span className="rounded-full bg-[#fff3d6] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#9c730f]">
                        New
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-[#5f5673]">{notification.message}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.2em] text-[#8a7ca7]">
                    {notification.notificationType.replace(/_/g, ' ')} - {notification.createdAt}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {notification.actionUrl ? (
                    <Link
                      href={notification.actionUrl}
                      className="rounded-2xl border border-[#ddd3f0] px-4 py-2 text-sm font-medium text-[#4B248C]"
                    >
                      Open
                    </Link>
                  ) : null}
                  {!notification.readAt ? (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        startTransition(async () => {
                          const result = await markNotificationReadAction(notification.id);
                          setFeedback(result.message);
                          if (!result.success) {
                            return;
                          }

                          setItems((current) =>
                            current.map((item) =>
                              item.id === notification.id
                                ? { ...item, readAt: new Date().toISOString() }
                                : item
                            )
                          );
                        });
                      }}
                      className="rounded-2xl bg-[#4B248C] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      Mark read
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
