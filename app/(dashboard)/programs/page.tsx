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

  const departments = await listAllDepartments();
  const programsDepartment = departments.find((department) => department.slug === 'programs') || null;
  const financeDepartment = departments.find((department) => department.slug === 'finance') || null;

  const isSystemAdmin =
    session.user.systemRole === 'main_admin' ||
    session.user.systemRole === 'chief_admin' ||
    session.user.role === 'admin';
  const canManagePrograms =
    isSystemAdmin || session.user.departmentRoles?.[programsDepartment?.id || -1] === 'department_admin';
  const hasFinanceAccess = isSystemAdmin || (financeDepartment ? session.user.departmentIds.includes(financeDepartment.id) : false);

  const [events, eventMemberships] = await Promise.all([
    listProgramEventsForUser(session.user),
    listUserEventMemberships(session.user),
  ]);

  const users = isSystemAdmin
    ? await listUsers().catch(() => [])
    : [];
  const standaloneLedgers = hasFinanceAccess
    ? await listStandaloneFinanceLedgers(session.user).catch(() => ({
        contributionLedgers: [],
        expenseLedgers: [],
      }))
    : {
        contributionLedgers: [],
        expenseLedgers: [],
      };

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
