'use server';

import { revalidatePath } from 'next/cache';

import { createAttachmentUploadUrl, createAvatarUploadUrl } from '@/lib/cap/r2';
import { getSession } from '@/lib/cap/auth';
import {
  addContributionParticipant,
  addEventMembership,
  addExpenseCategory,
  addExpenseItem,
  createEvent,
  createStandaloneContributionLedger,
  createStandaloneExpenseLedger,
  endEvent,
  recordContributionPayment,
  setActiveUserContext,
  setEventVisibility,
} from '@/lib/cap/phase3';
import {
  acceptDepartmentInvite,
  acceptDepartmentInviteWithSignup,
  assignDepartmentMembers,
  changeOwnPassword,
  createDepartment,
  createDepartmentInvite,
  createDepartmentRecord,
  createFieldDefinition,
  createMeeting,
  createUser,
  deleteAttachment,
  deleteGeneratedReport,
  deleteDepartmentRecord,
  deleteMeeting,
  decideDepartmentMembership,
  disconnectCalendarConnection,
  generateDepartmentReport,
  generateMeetingSummaryDocument,
  markNotificationRead,
  markNotificationUnread,
  processMeetingMinutes,
  registerAttachment,
  sendDueMeetingReminders,
  toggleActionItemStatus,
  updateOwnProfile,
  updateMeeting,
  updateDepartmentRecord,
} from '@/lib/cap/services';
import type { FieldType } from '@/lib/cap/types';

async function requireSessionUser() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('You must be signed in.');
  }

  return session.user;
}

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== 'undefined' && value instanceof FormData;
}

function parseNumberList(value: string | null) {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0);
}

export async function createDepartmentRecordAction(input: Parameters<typeof createDepartmentRecord>[1]) {
  try {
    const user = await requireSessionUser();
    const result = await createDepartmentRecord(user, input);
    revalidatePath('/dashboard');
    revalidatePath('/records');
    revalidatePath('/records/new');
    revalidatePath('/insights');

    return {
      success: true,
      recordId: result.recordId,
      whatsappSummary: result.whatsappSummary,
      message: 'Record saved successfully.',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to save record.',
    };
  }
}

export async function updateDepartmentRecordAction(input: Parameters<typeof updateDepartmentRecord>[1]) {
  try {
    const user = await requireSessionUser();
    const result = await updateDepartmentRecord(user, input);
    revalidatePath('/dashboard');
    revalidatePath('/records');
    revalidatePath('/records/new');
    revalidatePath(`/records/${input.recordId}/edit`);
    revalidatePath('/insights');

    return {
      success: true,
      recordId: result.recordId,
      whatsappSummary: result.whatsappSummary,
      message: 'Record updated successfully.',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update record.',
    };
  }
}

export async function deleteDepartmentRecordAction(recordId: number) {
  try {
    const user = await requireSessionUser();
    await deleteDepartmentRecord(user, recordId);
    revalidatePath('/dashboard');
    revalidatePath('/records');
    revalidatePath('/records/new');
    revalidatePath('/insights');
    return { success: true, message: 'Record deleted successfully.' };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete record.',
    };
  }
}

export async function createMeetingAction(input: Parameters<typeof createMeeting>[1] | FormData) {
  try {
    const user = await requireSessionUser();
    const payload = isFormData(input)
      ? {
          departmentId: input.get('departmentId') ? Number(input.get('departmentId')) : null,
          title: String(input.get('title') || ''),
          meetingDate: String(input.get('meetingDate') || ''),
          agenda: String(input.get('agenda') || ''),
          decisions: String(input.get('decisions') || ''),
          nextMeetingDate: String(input.get('nextMeetingDate') || ''),
          attendeeUserIds: parseNumberList(String(input.get('attendeeUserIds') || '')),
          actionItems: JSON.parse(String(input.get('actionItems') || '[]')),
        }
      : input;
    await createMeeting(user, payload);
    revalidatePath('/meetings');
    revalidatePath('/dashboard');

    return {
      success: true,
      message: 'Meeting created successfully.',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create meeting.',
    };
  }
}

export async function updateMeetingAction(input: Parameters<typeof updateMeeting>[1]) {
  try {
    const user = await requireSessionUser();
    await updateMeeting(user, input);
    revalidatePath('/meetings');
    revalidatePath(`/meetings/${input.meetingId}/edit`);
    revalidatePath('/dashboard');

    return {
      success: true,
      message: 'Meeting updated successfully.',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update meeting.',
    };
  }
}

export async function submitMeetingFormAction(formData: FormData): Promise<void> {
  await createMeetingAction(formData);
}

export async function createDepartmentAction(input: Parameters<typeof createDepartment>[1] | FormData) {
  try {
    const user = await requireSessionUser();
    const payload = isFormData(input)
      ? {
          name: String(input.get('name') || ''),
          slug: String(input.get('slug') || ''),
          description: String(input.get('description') || ''),
        }
      : input;
    await createDepartment(user, payload);
    revalidatePath('/admin');
    return { success: true, message: 'Department created successfully.' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to create department.' };
  }
}

export async function submitDepartmentFormAction(formData: FormData): Promise<void> {
  await createDepartmentAction(formData);
}

export async function createFieldDefinitionAction(input: Parameters<typeof createFieldDefinition>[1] | FormData) {
  try {
    const user = await requireSessionUser();
    const payload = isFormData(input)
      ? {
          departmentId: Number(input.get('departmentId')),
          fieldKey: String(input.get('fieldKey') || ''),
          label: String(input.get('label') || ''),
          fieldType: String(input.get('fieldType') || 'text') as FieldType,
          displayOrder: Number(input.get('displayOrder') || 0),
          isRequired: input.get('isRequired') === 'true',
        }
      : input;
    await createFieldDefinition(user, payload);
    revalidatePath('/admin');
    revalidatePath('/records/new');
    return { success: true, message: 'Field definition created successfully.' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to create field definition.' };
  }
}

export async function submitFieldDefinitionFormAction(formData: FormData): Promise<void> {
  await createFieldDefinitionAction(formData);
}

export async function createUserAction(input: Parameters<typeof createUser>[1] | FormData) {
  try {
    const user = await requireSessionUser();
    const payload = isFormData(input)
      ? {
          name: String(input.get('name') || ''),
          email: String(input.get('email') || ''),
          systemRole: String(input.get('systemRole') || 'none') as 'main_admin' | 'chief_admin' | 'none',
          departmentIds: parseNumberList(String(input.get('departmentIds') || '')),
          departmentRole: String(input.get('departmentRole') || 'member') as 'department_admin' | 'member',
        }
      : input;
    await createUser(user, payload);
    revalidatePath('/admin');
    return { success: true, message: 'User created successfully.' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to create user.' };
  }
}

export async function submitUserFormAction(formData: FormData): Promise<void> {
  await createUserAction(formData);
}

export async function changeOwnPasswordAction(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  try {
    const user = await requireSessionUser();
    await changeOwnPassword(user, input);
    revalidatePath('/settings/profile');
    return { success: true, message: 'Password updated successfully.' };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update password.',
    };
  }
}

export async function assignDepartmentMembersAction(input: Parameters<typeof assignDepartmentMembers>[1] | FormData) {
  try {
    const user = await requireSessionUser();
    const payload = isFormData(input)
      ? {
          departmentId: Number(input.get('departmentId')),
          userIds: parseNumberList(String(input.get('userIds') || '')),
        }
      : input;
    await assignDepartmentMembers(user, payload);
    revalidatePath('/admin');
    revalidatePath('/records/new');
    return { success: true, message: 'Department membership updated.' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to update membership.' };
  }
}

export async function submitDepartmentMembersFormAction(formData: FormData): Promise<void> {
  await assignDepartmentMembersAction(formData);
}

export async function createDepartmentInviteAction(input: Parameters<typeof createDepartmentInvite>[1]) {
  try {
    const user = await requireSessionUser();
    const invite = await createDepartmentInvite(user, input);
    revalidatePath('/admin');
    return {
      success: true,
      message: `Invite link ready for ${invite.departmentName}.`,
      invite,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create invite link.',
    };
  }
}

export async function acceptDepartmentInviteAction(input: Parameters<typeof acceptDepartmentInvite>[1]) {
  try {
    const user = await requireSessionUser();
    const result = await acceptDepartmentInvite(user, input);
    revalidatePath('/dashboard');
    revalidatePath('/settings/profile');
    revalidatePath('/admin');
    return {
      success: true,
      message: `You now have access to ${result.departmentName}.`,
      result,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to accept invite link.',
    };
  }
}

export async function acceptDepartmentInviteWithSignupAction(
  input: Parameters<typeof acceptDepartmentInviteWithSignup>[0]
) {
  try {
    const result = await acceptDepartmentInviteWithSignup(input);
    return {
      success: true,
      message: `Your account is ready and ${result.departmentName} access has been approved.`,
      result,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create the invited account.',
    };
  }
}

export async function decideDepartmentMembershipAction(input: Parameters<typeof decideDepartmentMembership>[1]) {
  try {
    const user = await requireSessionUser();
    await decideDepartmentMembership(user, input);
    revalidatePath('/admin');
    revalidatePath('/settings/profile');
    revalidatePath('/dashboard');
    return { success: true, message: 'Membership request updated.' };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update membership request.',
    };
  }
}

export async function toggleActionItemStatusAction(actionItemId: number) {
  const user = await requireSessionUser();
  await toggleActionItemStatus(user, actionItemId);
  revalidatePath('/meetings');
  revalidatePath('/dashboard');
}

export async function deleteMeetingAction(meetingId: number) {
  try {
    const user = await requireSessionUser();
    await deleteMeeting(user, meetingId);
    revalidatePath('/meetings');
    revalidatePath('/dashboard');
    return { success: true, message: 'Meeting deleted successfully.' };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete meeting.',
    };
  }
}

export async function createAttachmentUploadAction(input: { filename: string; contentType: string }) {
  try {
    await requireSessionUser();
    const result = await createAttachmentUploadUrl(input.filename, input.contentType);
    if (!result) {
      return {
        success: false,
        message: 'R2 is not configured yet. Add the R2 environment variables to enable uploads.',
      };
    }

    return {
      success: true,
      uploadUrl: result.uploadUrl,
      key: result.key,
      publicUrl: result.publicUrl,
      message: 'Upload URL created.',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create upload URL.',
    };
  }
}

export async function createAvatarUploadAction(input: { filename: string; contentType: string }) {
  try {
    await requireSessionUser();
    const result = await createAvatarUploadUrl(input.filename, input.contentType);
    if (!result) {
      return {
        success: false,
        message: 'R2 is not configured yet. Add the R2 environment variables to enable avatar uploads.',
      };
    }

    return {
      success: true,
      uploadUrl: result.uploadUrl,
      key: result.key,
      publicUrl: result.publicUrl,
      message: 'Avatar upload URL created.',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to prepare avatar upload.',
    };
  }
}

export async function updateOwnProfileAction(input: Parameters<typeof updateOwnProfile>[1]) {
  try {
    const user = await requireSessionUser();
    const result = await updateOwnProfile(user, input);
    revalidatePath('/settings/profile');
    revalidatePath('/dashboard');
    return {
      success: true,
      message: 'Profile updated successfully.',
      result,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update profile.',
    };
  }
}

export async function registerAttachmentAction(input: Parameters<typeof registerAttachment>[1]) {
  try {
    const user = await requireSessionUser();
    await registerAttachment(user, input);
    revalidatePath('/meetings');
    return { success: true, message: 'Attachment registered successfully.' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to register attachment.' };
  }
}

export async function deleteAttachmentAction(attachmentId: number) {
  try {
    const user = await requireSessionUser();
    await deleteAttachment(user, attachmentId);
    revalidatePath('/meetings');
    revalidatePath('/dashboard');
    return { success: true, message: 'Attachment deleted successfully.' };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete attachment.',
    };
  }
}

export async function generateDepartmentReportAction(
  input: Parameters<typeof generateDepartmentReport>[1]
) {
  try {
    const user = await requireSessionUser();
    const report = await generateDepartmentReport(user, input);
    revalidatePath('/insights');
    return {
      success: true,
      message: 'Report generated successfully.',
      report,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to generate report.',
    };
  }
}

export async function generateMeetingSummaryDocumentAction(
  input: Parameters<typeof generateMeetingSummaryDocument>[1]
) {
  try {
    const user = await requireSessionUser();
    const document = await generateMeetingSummaryDocument(user, input);
    revalidatePath('/meetings');
    return {
      success: true,
      message: 'Meeting summary document generated successfully.',
      document,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to generate the meeting summary document.',
    };
  }
}

export async function deleteGeneratedReportAction(reportId: number) {
  try {
    const user = await requireSessionUser();
    await deleteGeneratedReport(user, reportId);
    revalidatePath('/dashboard');
    revalidatePath('/insights');
    revalidatePath('/insights/reports');

    return {
      success: true,
      message: 'Report deleted successfully.',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete report.',
    };
  }
}

export async function processMeetingMinutesAction(notes: string) {
  try {
    const user = await requireSessionUser();
    const suggestion = await processMeetingMinutes(user, notes);
    return {
      success: true,
      message: 'Minutes suggestions generated successfully.',
      suggestion,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to process meeting minutes.',
    };
  }
}

export async function markNotificationReadAction(notificationId: number) {
  try {
    const user = await requireSessionUser();
    await markNotificationRead(user, notificationId);
    revalidatePath('/notifications');
    revalidatePath('/dashboard');
    return { success: true, message: 'Notification marked as read.' };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update notification.',
    };
  }
}

export async function markNotificationUnreadAction(notificationId: number) {
  try {
    const user = await requireSessionUser();
    await markNotificationUnread(user, notificationId);
    revalidatePath('/notifications');
    revalidatePath('/dashboard');
    return { success: true, message: 'Notification marked as unread.' };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update notification.',
    };
  }
}

export async function runMeetingRemindersAction() {
  try {
    const user = await requireSessionUser();
    if (user.systemRole !== 'main_admin' && user.systemRole !== 'chief_admin' && user.role !== 'admin') {
      throw new Error('Only admins can run reminders.');
    }

    const result = await sendDueMeetingReminders();
    revalidatePath('/notifications');
    return {
      success: true,
      message: `Reminder run complete. ${result.meetingsMatched} meeting(s) matched the reminder window.`,
      result,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to run meeting reminders.',
    };
  }
}

export async function disconnectCalendarConnectionAction() {
  try {
    const user = await requireSessionUser();
    await disconnectCalendarConnection(user);
    revalidatePath('/settings/profile');
    return {
      success: true,
      message: 'Google Calendar connection removed successfully.',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to disconnect Google Calendar.',
    };
  }
}

export async function setActiveUserContextAction(input: Parameters<typeof setActiveUserContext>[1]) {
  try {
    const user = await requireSessionUser();
    await setActiveUserContext(user, input);
    revalidatePath('/dashboard');
    revalidatePath('/programs');
    revalidatePath('/leadership');
    return { success: true, message: 'Context switched successfully.' };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to switch context.',
    };
  }
}

export async function createEventAction(input: Parameters<typeof createEvent>[1]) {
  try {
    const user = await requireSessionUser();
    const eventId = await createEvent(user, input);
    revalidatePath('/programs');
    revalidatePath('/dashboard');
    return { success: true, message: 'Event created successfully.', eventId };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create event.',
    };
  }
}

export async function addEventMembershipAction(input: Parameters<typeof addEventMembership>[1]) {
  try {
    const user = await requireSessionUser();
    await addEventMembership(user, input);
    revalidatePath('/programs');
    return { success: true, message: 'Event access updated successfully.' };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update event access.',
    };
  }
}

export async function addContributionParticipantAction(
  input: Parameters<typeof addContributionParticipant>[1]
) {
  try {
    const user = await requireSessionUser();
    await addContributionParticipant(user, input);
    revalidatePath('/programs');
    return { success: true, message: 'Participant added successfully.' };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to add participant.',
    };
  }
}

export async function recordContributionPaymentAction(
  input: Parameters<typeof recordContributionPayment>[1]
) {
  try {
    const user = await requireSessionUser();
    await recordContributionPayment(user, input);
    revalidatePath('/programs');
    return { success: true, message: 'Payment recorded successfully.' };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to record payment.',
    };
  }
}

export async function addExpenseCategoryAction(input: Parameters<typeof addExpenseCategory>[1]) {
  try {
    const user = await requireSessionUser();
    await addExpenseCategory(user, input);
    revalidatePath('/programs');
    return { success: true, message: 'Expense category added successfully.' };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to add expense category.',
    };
  }
}

export async function addExpenseItemAction(input: Parameters<typeof addExpenseItem>[1]) {
  try {
    const user = await requireSessionUser();
    await addExpenseItem(user, input);
    revalidatePath('/programs');
    return { success: true, message: 'Expense item added successfully.' };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to add expense item.',
    };
  }
}

export async function endEventAction(eventId: number) {
  try {
    const user = await requireSessionUser();
    await endEvent(user, eventId);
    revalidatePath('/programs');
    return { success: true, message: 'Event ended and locked successfully.' };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to end event.',
    };
  }
}

export async function setEventVisibilityAction(input: Parameters<typeof setEventVisibility>[1]) {
  try {
    const user = await requireSessionUser();
    await setEventVisibility(user, input);
    revalidatePath('/programs');
    return { success: true, message: 'Event dashboard visibility updated.' };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update event visibility.',
    };
  }
}

export async function createStandaloneContributionLedgerAction(
  input: Parameters<typeof createStandaloneContributionLedger>[1]
) {
  try {
    const user = await requireSessionUser();
    await createStandaloneContributionLedger(user, input);
    revalidatePath('/programs');
    return { success: true, message: 'Standalone contribution ledger created successfully.' };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create contribution ledger.',
    };
  }
}

export async function createStandaloneExpenseLedgerAction(
  input: Parameters<typeof createStandaloneExpenseLedger>[1]
) {
  try {
    const user = await requireSessionUser();
    await createStandaloneExpenseLedger(user, input);
    revalidatePath('/programs');
    return { success: true, message: 'Standalone expense ledger created successfully.' };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create expense ledger.',
    };
  }
}
