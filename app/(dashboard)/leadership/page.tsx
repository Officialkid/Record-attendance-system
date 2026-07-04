import { redirect } from 'next/navigation';

import { getSession } from '@/lib/cap/auth';
import { listAllDepartments } from '@/lib/cap/services';

export default async function LeadershipPage() {
  const session = await getSession();
  if (!session?.user) {
    redirect('/login');
  }

  const departments = await listAllDepartments();

  return (
    <section className="space-y-6">
      <div className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Leadership</p>
        <h2 className="mt-2 text-3xl font-semibold text-[#241c33]">Leadership overview</h2>
        <p className="mt-2 max-w-3xl text-sm text-[#5f5673]">
          Leadership now has a dedicated entry point for cross-department visibility without entering day-to-day
          submission screens first.
        </p>
      </div>

      <section className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
        <h3 className="text-2xl font-semibold text-[#241c33]">Departments in the portal</h3>
        <p className="mt-2 text-sm text-[#5f5673]">
          This is the current live department list available to leadership from the administration side.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {departments.map((department) => (
            <article key={department.id} className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#C9A461]">
                Department #{department.id}
              </p>
              <h4 className="mt-2 text-lg font-semibold text-[#241c33]">{department.name}</h4>
              <p className="mt-2 text-sm text-[#5f5673]">
                {department.description || 'No department description added yet.'}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
        <h3 className="text-2xl font-semibold text-[#241c33]">Leadership use right now</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4 text-sm text-[#5f5673]">
            Review departments that are already live in CIOM Portal.
          </div>
          <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4 text-sm text-[#5f5673]">
            Use Admin to inspect departments, invitations, and user access.
          </div>
          <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4 text-sm text-[#5f5673]">
            Use Programs for department-level meeting, records, and reporting shortcuts.
          </div>
        </div>
      </section>
    </section>
  );
}
