import 'server-only';

import { getEnvValue } from './env';

type EmailRecipient = {
  email: string;
  name?: string | null;
};

function getResendConfig() {
  const apiKey = getEnvValue('RESEND_API_KEY');
  const fromEmail = getEnvValue('RESEND_FROM_EMAIL', 'RESEND_FROM_ADDRESS');

  if (!apiKey || !fromEmail) {
    return null;
  }

  return {
    apiKey,
    fromEmail,
  };
}

export function isResendConfigured() {
  return Boolean(getResendConfig());
}

async function sendEmail({
  to,
  subject,
  html,
}: {
  to: EmailRecipient[];
  subject: string;
  html: string;
}) {
  const config = getResendConfig();
  if (!config || to.length === 0) {
    return false;
  }

  const uniqueRecipients = Array.from(
    new Map(
      to
        .filter((recipient) => recipient.email)
        .map((recipient) => [recipient.email.toLowerCase(), recipient])
    ).values()
  );

  if (uniqueRecipients.length === 0) {
    return false;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: config.fromEmail,
      to: uniqueRecipients.map((recipient) => recipient.email),
      subject,
      html,
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend email failed: ${body || response.statusText}`);
  }

  return true;
}

export async function sendDepartmentAccessRequestNotification(input: {
  requesterName: string;
  requesterEmail: string;
  departmentName: string;
  recipients: EmailRecipient[];
}) {
  return sendEmail({
    to: input.recipients,
    subject: `${input.requesterName} has requested to join ${input.departmentName}`,
    html: `
      <p>${input.requesterName} (${input.requesterEmail}) has requested access to <strong>${input.departmentName}</strong>.</p>
      <p>Sign in to CAP to review and approve or reject this request.</p>
    `,
  });
}

export async function sendDepartmentMembershipDecisionNotification(input: {
  recipient: EmailRecipient;
  departmentName: string;
  decision: 'approved' | 'rejected';
  assignedRole?: string;
}) {
  const decisionText = input.decision === 'approved' ? 'approved' : 'rejected';
  const roleLine =
    input.decision === 'approved' && input.assignedRole
      ? `<p>Your assigned role is <strong>${input.assignedRole}</strong>.</p>`
      : '';

  return sendEmail({
    to: [input.recipient],
    subject: `Your ${input.departmentName} access request was ${decisionText}`,
    html: `
      <p>Your request for <strong>${input.departmentName}</strong> was <strong>${decisionText}</strong>.</p>
      ${roleLine}
      <p>Sign in to CAP to continue.</p>
    `,
  });
}

export async function sendAdminAddedUserInviteNotification(input: {
  recipient: EmailRecipient;
  systemRole: string;
  departments: Array<{ name: string; role: string }>;
}) {
  const departmentList =
    input.departments.length > 0
      ? `<ul>${input.departments
          .map((department) => `<li>${department.name} - ${department.role}</li>`)
          .join('')}</ul>`
      : '<p>No department-specific assignment was included in this invite.</p>';

  return sendEmail({
    to: [input.recipient],
    subject: 'You have been added to Christhood Accountability Platform',
    html: `
      <p>You have been added to <strong>Christhood Accountability Platform (CAP)</strong>.</p>
      <p>System role: <strong>${input.systemRole}</strong></p>
      ${departmentList}
      <p>Sign in with Google once your credentials are connected in the target environment.</p>
    `,
  });
}

export async function sendMeetingReminderNotification(input: {
  recipient: EmailRecipient;
  meetingTitle: string;
  departmentName: string;
  meetingDate: string;
  nextMeetingDate: string;
  actionUrl?: string;
}) {
  const actionLine = input.actionUrl
    ? `<p><a href="${input.actionUrl}">Open CAP to review the meeting</a></p>`
    : '<p>Open CAP to review the meeting details.</p>';

  return sendEmail({
    to: [input.recipient],
    subject: `Reminder: ${input.meetingTitle} follow-up meeting is coming up`,
    html: `
      <p>Your next <strong>${input.departmentName}</strong> meeting is approaching.</p>
      <p>Current meeting: <strong>${input.meetingTitle}</strong></p>
      <p>Recorded on: <strong>${input.meetingDate}</strong></p>
      <p>Next meeting date: <strong>${input.nextMeetingDate}</strong></p>
      ${actionLine}
    `,
  });
}
