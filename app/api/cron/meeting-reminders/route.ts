import { NextResponse } from 'next/server';

import { sendDueMeetingReminders } from '@/lib/cap/services';

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return false;
  }

  const bearer = request.headers.get('authorization');
  const direct = request.headers.get('x-cron-secret');

  return bearer === `Bearer ${secret}` || direct === secret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
  }

  const result = await sendDueMeetingReminders();
  return NextResponse.json({ success: true, result });
}

export async function POST(request: Request) {
  return GET(request);
}
