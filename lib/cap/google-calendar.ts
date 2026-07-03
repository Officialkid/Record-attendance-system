import 'server-only';

function getGoogleCalendarConfig() {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret =
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  return {
    clientId,
    clientSecret,
  };
}

export function isGoogleCalendarSyncConfigured() {
  return Boolean(getGoogleCalendarConfig());
}

async function getAccessToken(refreshToken: string) {
  const config = getGoogleCalendarConfig();
  if (!config) {
    return null;
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to refresh Google Calendar access token.');
  }

  const payload = (await response.json()) as { access_token?: string };
  return payload.access_token || null;
}

function buildCalendarPayload(input: {
  title: string;
  nextMeetingDate: string;
  agenda?: string | null;
  decisions?: string | null;
  actionUrl?: string | null;
}) {
  const endDate = new Date(`${input.nextMeetingDate}T00:00:00.000Z`);
  endDate.setUTCDate(endDate.getUTCDate() + 1);

  const description = [
    input.agenda ? `Agenda:\n${input.agenda}` : null,
    input.decisions ? `Decisions:\n${input.decisions}` : null,
    input.actionUrl ? `Open CAP: ${input.actionUrl}` : null,
  ]
    .filter(Boolean)
    .join('\n\n');

  return {
    summary: input.title,
    description,
    start: {
      date: input.nextMeetingDate,
    },
    end: {
      date: endDate.toISOString().slice(0, 10),
    },
  };
}

export async function upsertGoogleCalendarEvent(input: {
  refreshToken: string;
  existingEventId?: string | null;
  title: string;
  nextMeetingDate: string;
  agenda?: string | null;
  decisions?: string | null;
  actionUrl?: string | null;
}) {
  const accessToken = await getAccessToken(input.refreshToken);
  if (!accessToken) {
    return null;
  }

  const payload = buildCalendarPayload(input);
  const hasExisting = Boolean(input.existingEventId);
  const url = hasExisting
    ? `https://www.googleapis.com/calendar/v3/calendars/primary/events/${input.existingEventId}`
    : 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

  const response = await fetch(url, {
    method: hasExisting ? 'PATCH' : 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to sync Google Calendar event.');
  }

  const result = (await response.json()) as { id?: string };
  return result.id || input.existingEventId || null;
}

export async function deleteGoogleCalendarEvent(input: {
  refreshToken: string;
  eventId: string;
}) {
  const accessToken = await getAccessToken(input.refreshToken);
  if (!accessToken) {
    return false;
  }

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${input.eventId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    }
  );

  return response.ok || response.status === 404;
}
