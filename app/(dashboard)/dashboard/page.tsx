import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ArrowRight,
  BookCopy,
  CalendarDays,
  ClipboardList,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';

import { submitDepartmentFormAction } from '@/app/actions/cap';
import { InviteAccessGuidanceCard } from '@/components/cap/invite-access-guidance-card';
import { OnboardingChecklist } from '@/components/cap/onboarding-checklist';
import { getSession } from '@/lib/cap/auth';
import {
  getCalendarConnectionForUser,
  getDashboardSummary,
  getDepartmentFieldDefinitions,
  listAllDepartments,
  listDepartmentsForUser,
} from '@/lib/cap/services';
import type { DepartmentFieldDefinition } from '@/lib/cap/types';
import { formatCurrency, formatDisplayDate } from '@/lib/cap/utils';

export default async function DashboardPage() {
  const session = await getSession();

  const isPendingOnly =
    session!.user.status === 'pending' &&
    session!.user.departmentIds.length === 0 &&
    session!.user.systemRole === 'none';

  if (isPendingOnly) {
    return (
      <div className="space-y-6">
        <section className="rounded-[32px] border border-[#ddd3f0] bg-[linear-gradient(135deg,#ffffff_0%,#f8f4ff_45%,#f4ecff_100%)] p-7 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#C9A461]">Onboarding dashboard</p>
          <h2 className="mt-3 text-3xl font-semibold text-[#241c33]">
            Welcome to CIOM Portal, {session!.user.name || 'friend'}.
          </h2>
          <p className="mt-3 max-w-3xl text-sm text-[#5f5673]">
            Your account is signed in, but your ministry workspace is not unlocked yet. Use the steps below to get a
            department access link from the correct department lead and claim access directly.
          </p>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {[
              {
                title: '1. Contact your department lead',
                body: 'Ask the head of department, chief admin, or main admin to share your department access link.',
              },
              {
                title: '2. Open the shared link',
                body: 'Sign in from that invite link with Google or email/password so CIOM Portal can bind you to the right department.',
              },
              {
                title: '3. Start guided onboarding',
                body: 'Once the invite is claimed, this dashboard turns into your working ministry homepage automatically.',
              },
            ].map((step) => (
              <article key={step.title} className="rounded-3xl border border-[#e6def4] bg-white p-5">
                <h3 className="text-lg font-semibold text-[#241c33]">{step.title}</h3>
                <p className="mt-2 text-sm text-[#5f5673]">{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <InviteAccessGuidanceCard email={session!.user.email} />

          <article className="space-y-4 rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">What happens next</p>
              <h3 className="mt-2 text-2xl font-semibold text-[#241c33]">After you claim the department access link</h3>
            </div>

            {[
              'Weekly Record opens for fresh ministry submissions.',
              'Records becomes the separate archive for history and edits.',
              'Meetings, Notifications, and Insights appear as your team starts using the platform.',
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4 text-sm text-[#5f5673]">
                {item}
              </div>
            ))}
          </article>
        </section>
      </div>
    );
  }

  const summary = await getDashboardSummary(session!.user);
  const calendarConnection = await getCalendarConnectionForUser(Number(session!.user.id));
  const departmentsForUser = await listDepartmentsForUser(session!.user);
  const departmentSlugs = departmentsForUser.map((department) => department.slug);
  const hasRecordAccess =
    session!.user.systemRole === 'main_admin' ||
    session!.user.systemRole === 'chief_admin' ||
    departmentSlugs.some((slug) => slug === 'protocol-admin' || slug === 'protocol' || slug === 'admin');
  const allDepartments =
    session!.user.systemRole === 'main_admin' || session!.user.systemRole === 'chief_admin'
      ? await listAllDepartments()
      : [];
  const fieldDefinitionsByDepartment = Object.fromEntries(
    await Promise.all(
      summary.latestRecords.map(async (record) => [
        record.departmentId,
        await getDepartmentFieldDefinitions(record.departmentId),
      ])
    )
  ) as Record<number, DepartmentFieldDefinition[]>;

  const cards = [
    { label: 'Departments', value: summary.departmentCount, icon: Users },
    ...(hasRecordAccess
      ? [
          { label: 'Weekly records', value: summary.recordCount, icon: ClipboardList },
          { label: 'Open action items', value: summary.openActionItemCount, icon: CalendarDays },
          { label: 'Visitors logged', value: summary.visitorCount, icon: TrendingUp },
        ]
      : [
          { label: 'Upcoming meetings', value: summary.upcomingMeetings.length, icon: CalendarDays },
          { label: 'Open action items', value: summary.openActionItemCount, icon: TrendingUp },
        ]),
  ];

  const onboardingSteps = hasRecordAccess
    ? [
        {
          title: 'Submit your first weekly record',
          description:
            "Capture this week's ministry figures so your archive, insights, and summaries all start from real data.",
          href: '/records/new',
          actionLabel: 'Open Weekly Record',
          done: summary.recordCount > 0,
        },
        {
          title: 'Document your first meeting and action items',
          description: 'Store ministry decisions, minutes, and follow-up ownership so teams know what happens next.',
          href: '/meetings',
          actionLabel: 'Open Meetings',
          done: summary.upcomingMeetings.length > 0 || summary.openActionItemCount > 0,
        },
        {
          title: 'Review history and trends',
          description: 'Open Records and Insights to confirm where history lives and how leadership summaries are generated.',
          href: '/insights',
          actionLabel: 'Open Insights',
          done: summary.recordCount > 0,
        },
        {
          title: 'Connect Google Calendar when you are ready',
          description:
            'Calendar connection is optional, but it prepares the account for future reminder and event mirroring.',
          href: '/settings/profile',
          actionLabel: 'Open Profile',
          done: Boolean(calendarConnection),
        },
      ]
    : [
        {
          title: 'Open your department workspace',
          description: 'Go straight to your main ministry area so the portal stays focused and light.',
          href: departmentSlugs.includes('programs') ? '/programs' : '/meetings',
          actionLabel: departmentSlugs.includes('programs') ? 'Open Programs' : 'Open Meetings',
          done: true,
        },
        {
          title: 'Capture the next meeting',
          description: 'Use Meetings to store decisions, minutes, and follow-up without mixing in record tools.',
          href: '/meetings',
          actionLabel: 'Open Meetings',
          done: summary.upcomingMeetings.length > 0 || summary.openActionItemCount > 0,
        },
        {
          title: 'Review your account setup',
          description: 'Keep profile details and optional calendar connection ready for later coordination.',
          href: '/settings/profile',
          actionLabel: 'Open Profile',
          done: Boolean(calendarConnection),
        },
      ];

  return (
    <div className="space-y-6">
      <OnboardingChecklist name={session!.user.name || 'friend'} steps={onboardingSteps} />

      {hasRecordAccess ? (
      <section className="rounded-[32px] border border-[#ddd3f0] bg-[linear-gradient(135deg,#ffffff_0%,#f8f4ff_58%,#f2ebff_100%)] p-7 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#C9A461]">Daily focus</p>
            <h2 className="mt-3 text-3xl font-semibold text-[#241c33]">Today&apos;s ministry workflow</h2>
            <p className="mt-3 text-sm text-[#5f5673]">
              Keep weekly submissions current, review older records without confusion, and move from raw ministry data
              into trends and follow-up with less friction.
            </p>
          </div>

          <div className="rounded-2xl border border-[#e6def4] bg-white px-4 py-3 text-sm text-[#5f5673]">
            Signed in as <span className="font-semibold text-[#241c33]">{session!.user.email}</span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Link
            href="/records/new"
            className="group rounded-3xl border border-[#eadfb8] bg-[#fff8eb] p-5 transition-transform hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#b6841a]">Weekly record</p>
                <h3 className="mt-2 text-2xl font-semibold text-[#241c33]">Submit this week&apos;s figures</h3>
                <p className="mt-2 text-sm text-[#5f5673]">
                  Open the entry form for today&apos;s or the latest service record, visitors, and accountability figures.
                </p>
              </div>
              <ClipboardList className="h-6 w-6 text-[#b6841a]" />
            </div>
          </Link>

          <Link
            href="/records"
            className="group rounded-3xl border border-[#ddd3f0] bg-[#f8f5fd] p-5 transition-transform hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#4B248C]">Records archive</p>
                <h3 className="mt-2 text-2xl font-semibold text-[#241c33]">Review previous submissions</h3>
                <p className="mt-2 text-sm text-[#5f5673]">
                  Browse the full history, check visitor counts, and edit older records without mixing that screen up
                  with the weekly entry form.
                </p>
              </div>
              <BookCopy className="h-6 w-6 text-[#4B248C]" />
            </div>
          </Link>
        </div>
      </section>
      ) : null}

      <section className={`grid gap-4 md:grid-cols-2 ${hasRecordAccess ? 'xl:grid-cols-4' : 'xl:grid-cols-3'}`}>
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.label} className="rounded-[28px] border border-[#ddd3f0] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#5f5673]">{card.label}</p>
                <div className="rounded-2xl bg-[#ede7f7] p-3 text-[#4B248C]">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-6 text-4xl font-semibold text-[#241c33]">{card.value}</p>
            </article>
          );
        })}
      </section>

      {session!.user.systemRole === 'main_admin' ? (
        <section className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Department setup</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#241c33]">Create a new department from your dashboard</h2>
            <p className="mt-2 text-sm text-[#5f5673]">
              This keeps the super-admin flow simple when you need to open a new ministry workspace quickly.
            </p>
          </div>

          <form action={submitDepartmentFormAction} className="mt-5 grid gap-3 xl:grid-cols-[1fr_0.8fr_1.2fr_auto]">
            <input
              name="name"
              required
              placeholder="Department name"
              className="rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33] outline-none"
            />
            <input
              name="slug"
              required
              placeholder="department-slug"
              className="rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33] outline-none"
            />
            <input
              name="description"
              placeholder="Short description"
              className="rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33] outline-none"
            />
            <button
              type="submit"
              className="rounded-2xl bg-[#4B248C] px-5 py-3 text-sm font-semibold text-white"
            >
              Create department
            </button>
          </form>
        </section>
      ) : null}

      <section className={`grid gap-6 ${hasRecordAccess ? 'xl:grid-cols-[1.1fr_0.9fr]' : ''}`}>
        {hasRecordAccess ? (
        <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">
                Recent accountability
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[#241c33]">Latest submitted records</h2>
              <p className="mt-2 text-sm text-[#5f5673]">
                Latest snapshot only.
              </p>
            </div>
            <Link href="/records" className="inline-flex items-center gap-2 text-sm font-medium text-[#4B248C]">
              <span>View all</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {summary.latestRecords.length === 0 ? (
              <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4 text-sm text-[#5f5673]">
                No records yet. Add one from Weekly Record and it will appear here automatically.
              </div>
            ) : summary.latestRecords.slice(0, 2).map((record) => {
              const values = record.values as Record<string, number | string | string[]>;
              const fieldDefinitions = fieldDefinitionsByDepartment[record.departmentId] || [];
              const previewFields = fieldDefinitions.slice(0, 3);

              return (
                <div key={record.id} className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-semibold text-[#241c33]">{record.departmentName}</h3>
                      <p className="text-sm text-[#5f5673]">
                        {formatDisplayDate(record.recordDate)} - handled by {record.handledByName}
                      </p>
                    </div>
                    <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#C9A461]">
                      {record.visitorCount} visitors
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {previewFields.map((field) => {
                      const rawValue = values[field.fieldKey];
                      const displayValue =
                        field.fieldType === 'currency'
                          ? formatCurrency(Number(rawValue || 0))
                          : Array.isArray(rawValue)
                            ? rawValue.join(', ')
                            : rawValue ?? '-';

                      return (
                        <div key={`${record.id}-${field.fieldKey}`} className="rounded-2xl bg-white p-3">
                          <p className="text-xs text-[#5f5673]">{field.label}</p>
                          <p className="mt-1 text-lg font-semibold text-[#241c33]">{String(displayValue)}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </article>
        ) : null}

        <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Coordination</p>
              <h2 className="mt-2 text-2xl font-semibold text-[#241c33]">Meetings and follow-up</h2>
            </div>
            <Link href="/meetings" className="inline-flex items-center gap-2 text-sm font-medium text-[#4B248C]">
              <span>Open meetings</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {summary.upcomingMeetings.length === 0 ? (
              <p className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] px-4 py-4 text-sm text-[#5f5673]">
                No meetings recorded yet. Use the meetings page to document ministry decisions and action items.
              </p>
            ) : (
              summary.upcomingMeetings.map((meeting) => (
                <div key={meeting.id} className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-semibold text-[#241c33]">{meeting.title}</h3>
                      <p className="text-sm text-[#5f5673]">
                        {formatDisplayDate(meeting.meetingDate)}
                        {meeting.departmentName ? ` - ${meeting.departmentName}` : ' - Cross-department'}
                      </p>
                    </div>
                    {meeting.actionItems.filter((item) => item.status === 'open').length > 0 ? (
                      <details className="group">
                        <summary className="list-none rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#C9A461] cursor-pointer">
                          {meeting.actionItems.filter((item) => item.status === 'open').length} open actions
                        </summary>
                        <div className="mt-3 space-y-2 rounded-2xl border border-[#efe7fb] bg-white p-3 text-xs text-[#5f5673]">
                          {meeting.actionItems
                            .filter((item) => item.status === 'open')
                            .slice(0, 3)
                            .map((item) => (
                              <p key={item.id}>{item.description}</p>
                            ))}
                        </div>
                      </details>
                    ) : (
                      <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#8a7ca7]">
                        No open actions
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      {allDepartments.length > 0 ? (
        <section className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Admin shortcuts</p>
              <h2 className="mt-2 text-2xl font-semibold text-[#241c33]">Run the platform from one super-admin view</h2>
              <p className="mt-2 text-sm text-[#5f5673]">
                Open the department admin tools, invite workspace, and super-admin maintenance area without leaving the dashboard.
              </p>
            </div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#4B248C] px-4 py-3 text-sm font-semibold text-white"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Open admin workspace</span>
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
