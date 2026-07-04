import 'server-only';

import type {
  GeneratedReportSnapshot,
  MeetingMinutesSuggestion,
  MeetingPeriodSummarySnapshot,
} from './types';

function buildFallbackExecutiveSummary(snapshot: GeneratedReportSnapshot) {
  const lines = [
    `${snapshot.departmentName} recorded ${snapshot.recordCount} reporting week${snapshot.recordCount === 1 ? '' : 's'} between ${snapshot.periodStart} and ${snapshot.periodEnd}.`,
    `Visitor engagement totaled ${snapshot.totalVisitors}, compared with ${snapshot.previousTotalVisitors} in the previous period.`,
  ];

  if (snapshot.totals.length > 0) {
    const strongestMetric = [...snapshot.totals].sort(
      (left, right) => Math.abs(right.changePercent ?? 0) - Math.abs(left.changePercent ?? 0)
    )[0];

    if (strongestMetric) {
      const changeText =
        strongestMetric.changePercent === null
          ? 'held steady against the previous period.'
          : `${strongestMetric.changePercent >= 0 ? 'changed by +' : 'changed by '}${strongestMetric.changePercent.toFixed(1)}% versus the previous period.`;

      lines.push(
        `${strongestMetric.label} closed at ${strongestMetric.total.toFixed(2)} and ${changeText}`
      );
    }
  }

  if (snapshot.netPosition) {
    const netChange =
      snapshot.netPosition.changePercent === null
        ? 'Net position has no prior period for comparison.'
        : `Net position moved ${snapshot.netPosition.changePercent >= 0 ? 'up' : 'down'} by ${Math.abs(snapshot.netPosition.changePercent).toFixed(1)}% versus the prior period.`;
    lines.push(
      `Net position for the selected period was ${snapshot.netPosition.total.toFixed(2)}. ${netChange}`
    );
  }

  if (snapshot.anomalyCount > 0) {
    lines.push(
      `${snapshot.anomalyCount} anomaly flag${snapshot.anomalyCount === 1 ? ' was' : 's were'} detected across ${snapshot.anomalyFields.join(', ')}. Leadership should review those weeks for context before drawing conclusions.`
    );
  } else {
    lines.push('No anomaly flags were raised across the tracked metrics in this period.');
  }

  const leadHandler = snapshot.handlerSummary[0];
  if (leadHandler) {
    lines.push(
      `${leadHandler.handledByName} handled the highest weekly volume with ${leadHandler.weeksHandled} submission${leadHandler.weeksHandled === 1 ? '' : 's'} and ${leadHandler.totalVisitors} recorded visitors.`
    );
  }

  return lines.join(' ');
}

export function isGroqConfigured() {
  return Boolean(process.env.GROQ_API_KEY);
}

export async function generateExecutiveSummaryWithGroq(snapshot: GeneratedReportSnapshot) {
  const fallback = buildFallbackExecutiveSummary(snapshot);
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return fallback;
  }

  const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content:
              'You write concise executive ministry reports. Use only the supplied numbers. Mention trends, anomalies, and follow-up points for leadership in 2 short paragraphs.',
          },
          {
            role: 'user',
            content: JSON.stringify(snapshot),
          },
        ],
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      return fallback;
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const summary = payload.choices?.[0]?.message?.content?.trim();
    return summary || fallback;
  } catch {
    return fallback;
  }
}

function buildFallbackMinutesSuggestion(notes: string): MeetingMinutesSuggestion {
  const lines = notes
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const titleLine =
    lines.find((line) => /^(meeting|minutes|subject|title)\s*[:\-]/i.test(line)) || lines[0] || '';
  const meetingDateLine = lines.find((line) => /(meeting date|date)\s*[:\-]/i.test(line)) || '';
  const nextMeetingLine =
    lines.find((line) => /(next meeting|follow-up meeting|next date)\s*[:\-]/i.test(line)) || '';
  const agendaLines = lines.filter((line) => /agenda|topic|discussion/i.test(line)).slice(0, 6);
  const summary = lines.slice(0, 4).join(' ');
  const decisionLines = lines.filter((line) => /decision|agreed|resolved|approved/i.test(line));
  const actionItems = lines
    .filter((line) => /action|follow up|follow-up|owner|due|assign/i.test(line))
    .slice(0, 5)
    .map((line) => ({
      description: line.replace(/^[-*]\s*/, ''),
      ownerName: null,
      dueDate: null,
    }));

  return {
    title: titleLine.replace(/^(meeting|minutes|subject|title)\s*[:\-]\s*/i, '').trim() || null,
    meetingDate:
      meetingDateLine.replace(/^(meeting date|date)\s*[:\-]\s*/i, '').trim() || null,
    nextMeetingDate:
      nextMeetingLine.replace(/^(next meeting|follow-up meeting|next date)\s*[:\-]\s*/i, '').trim() ||
      null,
    agenda: agendaLines.join('\n') || null,
    summary: summary || 'CIOM Portal could not extract a concise summary from the provided notes yet.',
    decisions: decisionLines.join('\n'),
    actionItems,
  };
}

export async function extractMeetingMinutesWithGroq(notes: string) {
  const fallback = buildFallbackMinutesSuggestion(notes);
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return fallback;
  }

  const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'Extract structured meeting intelligence. Return valid JSON with keys title, meetingDate, nextMeetingDate, agenda, summary, decisions, and actionItems. actionItems must be an array of objects with description, ownerName, and dueDate. Use ISO dates only when you can infer them confidently, otherwise return null. Keep missing strings as null.',
          },
          {
            role: 'user',
            content: notes,
          },
        ],
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      return fallback;
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return fallback;
    }

    const parsed = JSON.parse(content) as Partial<MeetingMinutesSuggestion>;
    return {
      title: typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title.trim() : fallback.title,
      meetingDate:
        typeof parsed.meetingDate === 'string' && parsed.meetingDate.trim()
          ? parsed.meetingDate.trim()
          : fallback.meetingDate,
      nextMeetingDate:
        typeof parsed.nextMeetingDate === 'string' && parsed.nextMeetingDate.trim()
          ? parsed.nextMeetingDate.trim()
          : fallback.nextMeetingDate,
      agenda:
        typeof parsed.agenda === 'string' && parsed.agenda.trim() ? parsed.agenda.trim() : fallback.agenda,
      summary: typeof parsed.summary === 'string' ? parsed.summary : fallback.summary,
      decisions: typeof parsed.decisions === 'string' ? parsed.decisions : fallback.decisions,
      actionItems: Array.isArray(parsed.actionItems)
        ? parsed.actionItems
            .map((item) => ({
              description:
                item && typeof item.description === 'string' ? item.description.trim() : '',
              ownerName:
                item && typeof item.ownerName === 'string' && item.ownerName.trim()
                  ? item.ownerName.trim()
                  : null,
              dueDate:
                item && typeof item.dueDate === 'string' && item.dueDate.trim()
                  ? item.dueDate.trim()
                  : null,
            }))
            .filter((item) => item.description.length > 0)
        : fallback.actionItems,
    } satisfies MeetingMinutesSuggestion;
  } catch {
    return fallback;
  }
}

function buildFallbackMeetingPeriodSummary(snapshot: MeetingPeriodSummarySnapshot) {
  const lines = [
    `${snapshot.departmentName} held ${snapshot.meetingCount} meeting${snapshot.meetingCount === 1 ? '' : 's'} between ${snapshot.periodStart} and ${snapshot.periodEnd}.`,
  ];

  const openActionItems = snapshot.meetings.reduce(
    (total, meeting) => total + meeting.actionItems.filter((item) => item.status === 'open').length,
    0
  );
  lines.push(`Open follow-up items across the period currently stand at ${openActionItems}.`);

  const upcomingNextMeeting = snapshot.meetings.find((meeting) => meeting.nextMeetingDate);
  if (upcomingNextMeeting?.nextMeetingDate) {
    lines.push(
      `The closest recorded next meeting date is ${upcomingNextMeeting.nextMeetingDate} from ${upcomingNextMeeting.title}.`
    );
  }

  const notableMeetings = snapshot.meetings
    .slice(0, 3)
    .map((meeting) => `${meeting.title} on ${meeting.meetingDate}`)
    .join(', ');
  if (notableMeetings) {
    lines.push(`Meetings covered in this summary include ${notableMeetings}.`);
  }

  return lines.join(' ');
}

export async function generateMeetingSummaryWithGroq(snapshot: MeetingPeriodSummarySnapshot) {
  const fallback = buildFallbackMeetingPeriodSummary(snapshot);
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return fallback;
  }

  const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.25,
        messages: [
          {
            role: 'system',
            content:
              'Write a concise ministry meeting summary for leadership. Use only the supplied meeting data. Highlight patterns, decisions, recurring issues, and follow-up priorities in 2 short paragraphs.',
          },
          {
            role: 'user',
            content: JSON.stringify(snapshot),
          },
        ],
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      return fallback;
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const summary = payload.choices?.[0]?.message?.content?.trim();
    return summary || fallback;
  } catch {
    return fallback;
  }
}
