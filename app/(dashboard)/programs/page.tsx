import { redirect } from 'next/navigation';

import { ProgramsHub } from '@/components/cap/programs-hub';
import { getSession } from '@/lib/cap/auth';
import {
  listProgramEventsForUser,
  listStandaloneFinanceLedgers,
  listUserEventMemberships,
} from '@/lib/cap/phase3';
import { listAllDepartments, listUsersVisibleTo } from '@/lib/cap/services';

export default async function ProgramsPage() {
  const session = await getSession();
  if (!session?.user) {
    redirect('/login');
  }

  const departments = await listAllDepartments();
  const programsDepartment = departments.find((department) => department.slug === 'programs');
  const financeDepartment = departments.find((department) => department.slug === 'finance');

  const canManagePrograms = Boolean(
    session.user.systemRole === 'main_admin' ||
      session.user.systemRole === 'chief_admin' ||
      (programsDepartment && session.user.departmentRoles?.[programsDepartment.id] === 'department_admin')
  );
  const hasFinanceAccess = Boolean(
    session.user.systemRole === 'main_admin' ||
      session.user.systemRole === 'chief_admin' ||
      (financeDepartment && session.user.departmentIds.includes(financeDepartment.id))
  );

  const [events, users, eventMemberships, standaloneLedgers] = await Promise.all([
    listProgramEventsForUser(session.user),
    canManagePrograms ? listUsersVisibleTo(session.user) : Promise.resolve([]),
    listUserEventMemberships(session.user),
    hasFinanceAccess
      ? listStandaloneFinanceLedgers(session.user)
      : Promise.resolve({ contributionLedgers: [], expenseLedgers: [] }),
  ]);

  return (
    <ProgramsHub
      events={events}
      users={users}
      canManagePrograms={canManagePrograms}
      hasFinanceAccess={hasFinanceAccess}
      programsDepartmentId={programsDepartment?.id || null}
      eventMemberships={eventMemberships}
      standaloneLedgers={{
        contributionLedgers: standaloneLedgers.contributionLedgers.map((ledger) => ({
          id: ledger.id,
          name: ledger.name,
          status: ledger.status,
        })),
        expenseLedgers: standaloneLedgers.expenseLedgers.map((ledger) => ({
          id: ledger.id,
          name: ledger.name,
          status: ledger.status,
        })),
      }}
    />
  );
}
