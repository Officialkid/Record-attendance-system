'use client';

import { signIn } from 'next-auth/react';
import { useState, useTransition } from 'react';

import { disconnectCalendarConnectionAction } from '@/app/actions/cap';

export function CalendarConnectionCard({
  connectedAt,
}: {
  connectedAt: string | null;
}) {
  const [feedback, setFeedback] = useState('');
  const [pending, startTransition] = useTransition();
  const isConnected = Boolean(connectedAt);

  return (
    <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
      <h3 className="text-xl font-semibold text-[#241c33]">Calendar connection</h3>
      <p className="mt-2 text-sm text-[#5f5673]">
        Connect your own Google Calendar so CIOM Portal can mirror ministry meeting reminders onto your personal
        calendar when needed.
      </p>

      <div className="mt-4 rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
        <p className="text-sm font-medium text-[#241c33]">
          Status: {isConnected ? 'Connected' : 'Not connected yet'}
        </p>
        <p className="mt-2 text-sm text-[#5f5673]">
          {isConnected
            ? `Connected on ${connectedAt}. CIOM Portal has stored your Google Calendar refresh token for later event sync features on this account only.`
            : 'CIOM Portal reminders already work without calendar sync. Each person who wants events mirrored to Google Calendar connects once from their own profile.'}
        </p>
      </div>

      {feedback ? (
        <p className="mt-4 rounded-2xl bg-[#f4effb] px-4 py-3 text-sm text-[#4B248C]">{feedback}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() =>
            signIn(
              'google',
              { callbackUrl: '/settings/profile' },
              {
                scope:
                  'openid email profile https://www.googleapis.com/auth/calendar.events',
                prompt: 'consent',
                access_type: 'offline',
                response_type: 'code',
                include_granted_scopes: 'true',
              }
            )
          }
          className="rounded-2xl bg-[#4B248C] px-4 py-2 text-sm font-semibold text-white"
        >
          {isConnected ? 'Reconnect Calendar' : 'Connect Google Calendar'}
        </button>

        {isConnected ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setFeedback('');
              startTransition(async () => {
                const result = await disconnectCalendarConnectionAction();
                setFeedback(result.message);
                if (result.success) {
                  window.location.reload();
                }
              });
            }}
            className="rounded-2xl border border-[#d9cfee] px-4 py-2 text-sm font-semibold text-[#241c33] disabled:opacity-60"
          >
            {pending ? 'Disconnecting...' : 'Disconnect'}
          </button>
        ) : null}
      </div>
    </article>
  );
}
