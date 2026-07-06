import { z } from 'zod';
import { isIsoDateString } from './utils';

const requiredIsoDate = z.string().refine((value) => isIsoDateString(value), {
  message: 'Enter a valid date in YYYY-MM-DD format.',
});

const optionalIsoDate = z
  .string()
  .refine((value) => value === '' || isIsoDateString(value), {
    message: 'Enter a valid date in YYYY-MM-DD format.',
  })
  .optional()
  .default('');

const strongPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long.')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*(?:\d|[^A-Za-z0-9])).+$/,
    'Use at least one uppercase letter, one lowercase letter, and one number or special character.'
  );

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const publicSignupSchema = z
  .object({
    name: z.string().min(2, 'Enter your full name.'),
    email: z.string().email('Enter a valid email address.'),
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, 'Confirm your password.'),
    departmentIds: z.array(z.number().int().positive()).min(1, 'Select at least one department.'),
  })
  .superRefine((value, context) => {
    if (value.password !== value.confirmPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match.',
        path: ['confirmPassword'],
      });
    }
  });

export const createDepartmentSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional().default(''),
});

export const createFieldDefinitionSchema = z.object({
  departmentId: z.coerce.number().int().positive(),
  fieldKey: z.string().min(2),
  label: z.string().min(2),
  fieldType: z.enum(['number', 'text', 'date', 'currency', 'list']),
  displayOrder: z.coerce.number().int().min(0),
  isRequired: z.boolean(),
});

export const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  systemRole: z.enum(['main_admin', 'chief_admin', 'none']),
  departmentIds: z.array(z.number().int().positive()).default([]),
  departmentRole: z.enum(['department_admin', 'member']).default('member'),
});

export const departmentAccessRequestSchema = z.object({
  departmentIds: z.array(z.number().int().positive()).min(1, 'Select at least one department.'),
});

export const departmentMembershipDecisionSchema = z.object({
  membershipId: z.number().int().positive(),
  decision: z.enum(['approved', 'rejected']),
  role: z.enum(['department_admin', 'member']).optional().default('member'),
});

export const createDepartmentInviteSchema = z.object({
  departmentId: z.number().int().positive(),
  role: z.enum(['department_admin', 'member']).default('member'),
  note: z.string().max(240).optional().default(''),
  expiresInDays: z.number().int().min(0).max(36500).default(7),
});

export const acceptDepartmentInviteSchema = z.object({
  token: z.string().min(20, 'Invite token is invalid.'),
});

export const acceptDepartmentInviteWithSignupSchema = acceptDepartmentInviteSchema
  .extend({
    name: z.string().min(2, 'Enter your full name.'),
    email: z.string().email('Enter a valid email address.'),
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, 'Confirm your password.'),
  })
  .superRefine((value, context) => {
    if (value.password !== value.confirmPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match.',
        path: ['confirmPassword'],
      });
    }
  });

export const generateDepartmentReportSchema = z
  .object({
    departmentId: z.number().int().positive(),
    periodType: z.enum(['monthly', 'quarterly', 'yearly', 'custom']),
    start: optionalIsoDate,
    end: optionalIsoDate,
  })
  .superRefine((value, context) => {
    if (value.periodType !== 'custom') {
      return;
    }

    if (!value.start || !value.end) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Choose both a start and end date for a custom report.',
        path: ['start'],
      });
      return;
    }

    if (value.start > value.end) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'The custom report start date must be before the end date.',
        path: ['start'],
      });
    }
  });

export const createMeetingSchema = z.object({
  departmentId: z.number().int().positive().nullable().optional(),
  title: z.string().min(3),
  meetingDate: requiredIsoDate,
  agenda: z.string().optional().default(''),
  decisions: z.string().optional().default(''),
  aiSummary: z.string().optional().default(''),
  sourceDocumentR2Key: z.string().optional().default(''),
  nextMeetingDate: optionalIsoDate,
  attendeeUserIds: z.array(z.number().int().positive()).default([]),
  actionItems: z
    .array(
      z.object({
        id: z.number().int().positive().optional(),
        description: z.string().min(3),
        ownerUserId: z.number().int().positive().nullable().optional(),
        status: z.enum(['open', 'done']).optional().default('open'),
        dueDate: optionalIsoDate,
      })
    )
    .default([]),
});

export const updateMeetingSchema = createMeetingSchema.extend({
  meetingId: z.number().int().positive(),
});

export const processMeetingMinutesSchema = z.object({
  notes: z.string().min(20, 'Paste enough meeting notes for CIOM Portal to extract useful suggestions.'),
});

export const updateOwnProfileSchema = z.object({
  name: z.string().min(2, 'Enter your full name.'),
  avatarUrl: z.string().url('Enter a valid avatar URL.').nullable().optional(),
});

export const setActiveUserContextSchema = z.object({
  contextType: z.enum(['department', 'event_side', 'leadership']),
  targetId: z.number().int().positive(),
});

export const createEventSchema = z.object({
  name: z.string().min(3, 'Enter an event name.'),
  defaultExpectedAmount: z.coerce.number().positive('Enter a positive expected amount.'),
});

export const createStandaloneContributionLedgerSchema = z.object({
  name: z.string().min(3, 'Enter a ledger name.'),
  defaultExpectedAmount: z.coerce.number().positive('Enter a positive expected amount.'),
});

export const createStandaloneExpenseLedgerSchema = z.object({
  name: z.string().min(3, 'Enter a ledger name.'),
});

export const addEventMembershipSchema = z.object({
  eventId: z.number().int().positive(),
  userId: z.number().int().positive(),
  side: z.enum(['organizer', 'finance', 'admin']),
});

export const addContributionParticipantSchema = z.object({
  ledgerId: z.number().int().positive(),
  name: z.string().min(2, 'Enter a participant name.'),
  expectedAmount: z.coerce.number().positive().optional(),
});

export const recordContributionPaymentSchema = z.object({
  participantId: z.number().int().positive(),
  amount: z.coerce.number().positive('Enter a payment amount above zero.'),
  paymentDate: optionalIsoDate,
});

export const addExpenseCategorySchema = z.object({
  ledgerId: z.number().int().positive(),
  name: z.string().min(2, 'Enter a category name.'),
});

export const addExpenseItemSchema = z.object({
  categoryId: z.number().int().positive(),
  description: z.string().min(3, 'Enter an expense description.'),
  expectedAmount: z.coerce.number().nonnegative().nullable().optional(),
  actualAmount: z.coerce.number().nonnegative().nullable().optional(),
  paidBy: z.string().max(160).optional().default(''),
  paymentStatus: z.enum(['paid', 'reimbursement_pending', 'reimbursed']).default('paid'),
});

export const endEventSchema = z.object({
  eventId: z.number().int().positive(),
});

export const deleteEventSchema = z.object({
  eventId: z.number().int().positive(),
});

export const setEventVisibilitySchema = z.object({
  membershipId: z.number().int().positive(),
  remainVisible: z.boolean(),
});

export const createRecordSchema = z.object({
  departmentId: z.number().int().positive(),
  recordDate: requiredIsoDate,
  handledByUserId: z.number().int().positive(),
  values: z.record(
    z.string(),
    z.union([z.string(), z.number(), z.null(), z.array(z.string())])
  ),
  visitors: z
    .array(
      z.object({
        name: z.string().min(1),
        contact: z.string().optional().default(''),
      })
    )
    .default([]),
});

export const updateRecordSchema = createRecordSchema.extend({
  recordId: z.number().int().positive(),
});
