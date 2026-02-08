import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'Email service not configured.' }, { status: 500 });
  }

  const { requestType, message } = (await request.json()) as {
    requestType?: 'feature' | 'bug' | 'improvement';
    message?: string;
  };

  if (!requestType || !message || message.trim().length < 10) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const resend = new Resend(apiKey);
  const safeMessage = message.trim().slice(0, 5000);

  try {
    await resend.emails.send({
      from: 'Insight Tracker <onboarding@resend.dev>',
      to: ['alphatechanalytics@gmail.com'],
      subject: `Insight Tracker Feedback (${requestType})`,
      text: `Type: ${requestType}\n\nMessage:\n${safeMessage}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Resend error', error);
    return NextResponse.json({ error: 'Failed to send email.' }, { status: 500 });
  }
}
