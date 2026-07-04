import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getSession } from '@/lib/cap/auth';
import { listAllDepartments } from '@/lib/cap/services';

export default async function ProgramsPage() {
  const session = await getSession();
  if (!session?.user) {
    redirect('/login');
  }

  const departments = await listAllDepartments();
  const programsDepartment = departments.find((department) => department.slug === 'programs');

  return (
    <section className="space-y-6">
      <div className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Programs</p>
        <h2 className="mt-2 text-3xl font-semibold text-[#241c33]">Programs workspace</h2>
        <p className="mt-2 max-w-3xl text-sm text-[#5f5673]">
          This department now has a live home inside CIOM Portal for meetings, records, reporting, and event work.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
          <h3 className="text-2xl font-semibold text-[#241c33]">What is live now</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
              <p className="text-sm font-semibold text-[#241c33]">Programs meetings</p>
              <p className="mt-2 text-sm text-[#5f5673]">
                Store committee meetings, minutes, uploads, and follow-up from the normal Meetings area.
              </p>
            </div>
            <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
              <p className="text-sm font-semibold text-[#241c33]">Programs records</p>
              <p className="mt-2 text-sm text-[#5f5673]">
                Keep department records and reporting history inside the same portal.
              </p>
            </div>
            <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
              <p className="text-sm font-semibold text-[#241c33]">Programs insights</p>
              <p className="mt-2 text-sm text-[#5f5673]">
                Review trend summaries from the normal Insights workspace.
              </p>
            </div>
            <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
              <p className="text-sm font-semibold text-[#241c33]">Department setup</p>
              <p className="mt-2 text-sm text-[#5f5673]">
                Programs is available as a live department and can be managed from Admin.
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
          <h3 className="text-2xl font-semibold text-[#241c33]">Programs shortcuts</h3>
          <p className="mt-2 text-sm text-[#5f5673]">
            Use these links while the deeper event-side workspace is being stabilized on production.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={programsDepartment ? `/meetings?departmentId=${programsDepartment.id}` : '/meetings'}
              className="rounded-2xl bg-[#4B248C] px-4 py-3 text-sm font-semibold text-white"
            >
              Open Programs meetings
            </Link>
            <Link
              href={programsDepartment ? `/records/new?departmentId=${programsDepartment.id}` : '/records/new'}
              className="rounded-2xl bg-[#fff8eb] px-4 py-3 text-sm font-semibold text-[#8a6113]"
            >
              Add Programs record
            </Link>
            <Link
              href={programsDepartment ? `/records?departmentId=${programsDepartment.id}` : '/records'}
              className="rounded-2xl border border-[#d9cfee] bg-white px-4 py-3 text-sm font-semibold text-[#241c33]"
            >
              Programs records
            </Link>
            <Link
              href={programsDepartment ? `/insights?departmentId=${programsDepartment.id}` : '/insights'}
              className="rounded-2xl border border-[#d9cfee] bg-white px-4 py-3 text-sm font-semibold text-[#241c33]"
            >
              Programs insights
            </Link>
            <Link
              href="/admin"
              className="rounded-2xl border border-[#d9cfee] bg-white px-4 py-3 text-sm font-semibold text-[#241c33]"
            >
              Admin workspace
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
