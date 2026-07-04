'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRightLeft, Building2, Loader2, Plus } from 'lucide-react';

import { setActiveUserContextAction } from '@/app/actions/cap';
import type { Department } from '@/lib/cap/types';

export function DepartmentCommandCenter({
  departments,
  activeDepartmentId,
  isMainAdmin = false,
}: {
  departments: Department[];
  activeDepartmentId?: number | null;
  isMainAdmin?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');

  return (
    <section className="space-y-5 rounded-[30px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Super admin controls</p>
          <h3 className="mt-2 text-2xl font-semibold text-[#241c33]">Department command center</h3>
          <p className="mt-2 text-sm text-[#5f5673]">
            Create departments quickly, jump into one department at a time, and open the exact records, meetings, or
            insights area you want without hunting through the sidebar first.
          </p>
        </div>

        <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] px-4 py-3 text-sm text-[#5f5673]">
          {pending ? (
            <span className="inline-flex items-center gap-2 text-[#4B248C]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Switching department...
            </span>
          ) : (
            <span>
              Departments available: <span className="font-semibold text-[#241c33]">{departments.length}</span>
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {departments.map((department) => {
          const isActive = activeDepartmentId === department.id;
          const departmentRecordsHref = `/records?departmentId=${department.id}`;
          const departmentNewRecordHref = `/records/new?departmentId=${department.id}`;

          return (
            <article key={department.id} className="rounded-[26px] border border-[#e6def4] bg-[#fbf9fe] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#4B248C]">
                    <Building2 className="h-3.5 w-3.5" />
                    Department #{department.id}
                  </div>
                  <h4 className="mt-3 text-xl font-semibold text-[#241c33]">{department.name}</h4>
                  <p className="mt-2 text-sm text-[#5f5673]">
                    {department.description || 'No description added yet for this department.'}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    setError('');
                    startTransition(async () => {
                      const result = await setActiveUserContextAction({
                        contextType: department.name === 'Leadership' ? 'leadership' : 'department',
                        targetId: department.id,
                      });

                      if (!result.success) {
                        setError(result.message);
                        return;
                      }

                      router.push(department.name === 'Leadership' ? '/leadership' : '/dashboard');
                      router.refresh();
                    });
                  }}
                  className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold ${
                    isActive
                      ? 'bg-[#ede7f7] text-[#4B248C]'
                      : 'bg-[#4B248C] text-white disabled:opacity-60'
                  }`}
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  {isActive ? 'Active now' : 'Switch here'}
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={departmentNewRecordHref}
                  className="rounded-2xl bg-[#fff8eb] px-4 py-2 text-sm font-medium text-[#8a6113]"
                >
                  New record
                </Link>
                <Link
                  href={departmentRecordsHref}
                  className="rounded-2xl bg-white px-4 py-2 text-sm font-medium text-[#241c33]"
                >
                  Records archive
                </Link>
                <Link href="/meetings" className="rounded-2xl bg-white px-4 py-2 text-sm font-medium text-[#241c33]">
                  Meetings
                </Link>
                <Link href="/insights" className="rounded-2xl bg-white px-4 py-2 text-sm font-medium text-[#241c33]">
                  Insights
                </Link>
                <Link href="/admin" className="rounded-2xl bg-white px-4 py-2 text-sm font-medium text-[#241c33]">
                  Admin tools
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      {isMainAdmin ? (
        <div className="rounded-[26px] border border-dashed border-[#cdb6ef] bg-[linear-gradient(135deg,#fdfaff_0%,#f6efff_100%)] p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-white p-3 text-[#4B248C]">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-[#241c33]">Create departments from here too</h4>
              <p className="mt-1 text-sm text-[#5f5673]">
                Main admin can add a new department directly from the Admin page below this dashboard card as well.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {error ? <p className="rounded-2xl bg-[#fff1ec] px-4 py-3 text-sm text-[#a63e1c]">{error}</p> : null}
    </section>
  );
}
