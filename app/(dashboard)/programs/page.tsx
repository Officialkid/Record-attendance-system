import { redirect } from 'next/navigation';

import { ProgramsHub } from '@/components/cap/programs-hub';
import { getSession } from '@/lib/cap/auth';
import {
  listProgramEventsForUser,
  listStandaloneFinanceLedgers,
  listUserEventMemberships,
} from '@/lib/cap/phase3';
import { listAllDepartments, listUsers } from '@/lib/cap/services';

export default async function ProgramsPage() {
  const session = await getSession();
  if (!session?.user) {
    redirect('/login');
  }

  const isSystemAdmin =
    session.user.systemRole === 'main_admin' ||
    session.user.systemRole === 'chief_admin' ||
    session.user.role === 'admin';
  const emptyLedgers = {
    contributionLedgers: [],
    expenseLedgers: [],
  };

  const departments = await listAllDepartments().catch(() => []);
  const programsDepartment = departments.find((department) => department.slug === 'programs') || null;
  const financeDepartment = departments.find((department) => department.slug === 'finance') || null;
  const canManagePrograms =
    isSystemAdmin || session.user.departmentRoles?.[programsDepartment?.id || -1] === 'department_admin';
  const hasFinanceAccess =
    isSystemAdmin || (financeDepartment ? session.user.departmentIds.includes(financeDepartment.id) : false);

  const events = await listProgramEventsForUser(session.user).catch(() => []);
  const eventMemberships = await listUserEventMemberships(session.user).catch(() => []);
  const users = isSystemAdmin ? await listUsers().catch(() => []) : [];
  const standaloneLedgers = hasFinanceAccess
    ? await listStandaloneFinanceLedgers(session.user).catch(() => emptyLedgers)
    : emptyLedgers;

  return (
    <ProgramsHub
      events={events}
      users={users}
      canManagePrograms={canManagePrograms}
      hasFinanceAccess={hasFinanceAccess}
      programsDepartmentId={programsDepartment?.id || null}
      eventMemberships={eventMemberships}
      standaloneLedgers={standaloneLedgers}
    />
  );
}
