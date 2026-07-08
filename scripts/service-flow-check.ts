import {
  createDepartmentRecord,
  createMeeting,
  deleteDepartmentRecord,
  deleteGeneratedReport,
  deleteMeeting,
  generateDepartmentReport,
  getInsightsForDepartment,
  listGeneratedReportsForDepartment,
  listMeetings,
  listRecordsForDepartment,
  processMeetingMinutes,
} from '../lib/cap/services';

async function main() {
  const mainAdmin = {
    id: '1',
    name: 'Daniel Mwalili',
    email: 'danielmwalili1@gmail.com',
    role: 'admin' as const,
    systemRole: 'main_admin' as const,
    departmentIds: [1],
    departmentRoles: { 1: 'department_admin' as const },
  };

  const createdRecord = await createDepartmentRecord(mainAdmin, {
    departmentId: 1,
    recordDate: '2026-07-04',
    handledByUserId: 1,
    values: {
      tithe: '1200',
      offering: '800',
      expenses: '300',
      headcount: '42',
    },
    visitors: [
      {
        name: 'Test Visitor',
        contact: '0700000000',
      },
    ],
  });

  const recordsAfterCreate = await listRecordsForDepartment(mainAdmin, 1);
  const createdRecordRow = recordsAfterCreate.find((record) => record.id === createdRecord.recordId);
  if (!createdRecordRow) {
    throw new Error('Created record was not returned by listRecordsForDepartment.');
  }

  const insights = await getInsightsForDepartment(mainAdmin, 1);
  const generatedReport = await generateDepartmentReport(mainAdmin, {
    departmentId: 1,
    periodType: 'monthly',
  });

  const reportsAfterCreate = await listGeneratedReportsForDepartment(mainAdmin, 1, 20);
  const createdReportRow = reportsAfterCreate.find((report) => report.id === generatedReport.id);
  if (!createdReportRow) {
    throw new Error('Generated report was not returned by listGeneratedReportsForDepartment.');
  }

  const minutesSuggestion = await processMeetingMinutes(
    mainAdmin,
    [
      'Protocol team met to review weekly accountability and confirm the July follow-up workflow.',
      'Daniel will prepare the visitor summary before Monday.',
      'The team agreed to upload ministry minutes into the portal and track all action items there.',
      'Next review meeting was proposed for 2026-07-11.',
    ].join(' ')
  );

  const createdMeetingId = await createMeeting(mainAdmin, {
    departmentId: 1,
    title: 'Verification meeting',
    meetingDate: '2026-07-04',
    agenda: 'Verify meeting flow and action tracking',
    decisions: minutesSuggestion.decisions || 'Use CIOM Portal for ministry meeting follow-up.',
    aiSummary: minutesSuggestion.summary || 'Verification summary generated during test.',
    nextMeetingDate: '2026-07-11',
    attendeeUserIds: [1],
    actionItems: [
      {
        description: 'Prepare visitor summary',
        ownerUserId: 1,
        dueDate: '2026-07-07',
      },
    ],
  });

  const meetingsAfterCreate = await listMeetings(mainAdmin);
  const createdMeeting = meetingsAfterCreate.find((meeting) => meeting.id === createdMeetingId);
  if (!createdMeeting) {
    throw new Error('Created meeting was not returned by listMeetings.');
  }

  await deleteMeeting(mainAdmin, createdMeetingId);
  await deleteGeneratedReport(mainAdmin, generatedReport.id);
  await deleteDepartmentRecord(mainAdmin, createdRecord.recordId);

  const recordsAfterDelete = await listRecordsForDepartment(mainAdmin, 1);
  const reportsAfterDelete = await listGeneratedReportsForDepartment(mainAdmin, 1, 20);
  const meetingsAfterDelete = await listMeetings(mainAdmin);

  console.log(
    JSON.stringify(
      {
        createdRecord,
        createdRecordVerified: {
          id: createdRecordRow.id,
          visitorCount: createdRecordRow.visitorCount,
          values: createdRecordRow.values,
        },
        insightsSummary: {
          departmentName: insights.department.name,
          trendPoints: insights.series.length,
          handlers: insights.handlerSummary.length,
        },
        generatedReportVerified: {
          id: createdReportRow.id,
          summaryPreview: createdReportRow.summaryText.slice(0, 120),
        },
        minutesSuggestion: {
          summary: minutesSuggestion.summary,
          decisionCount: minutesSuggestion.decisions
            ? minutesSuggestion.decisions.split('\n').filter(Boolean).length
            : 0,
          actionItemCount: minutesSuggestion.actionItems.length,
        },
        createdMeetingVerified: {
          id: createdMeeting.id,
          title: createdMeeting.title,
          actionItemCount: createdMeeting.actionItems.length,
        },
        cleanupVerified: {
          remainingRecord: recordsAfterDelete.some((record) => record.id === createdRecord.recordId),
          remainingReport: reportsAfterDelete.some((report) => report.id === generatedReport.id),
          remainingMeeting: meetingsAfterDelete.some((meeting) => meeting.id === createdMeetingId),
        },
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
