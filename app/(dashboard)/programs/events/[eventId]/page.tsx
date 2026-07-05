import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { ProgramsEventWorkspace } from '@/components/cap/programs-event-workspace';
import { getSession } from '@/lib/cap/auth';
import { getEventDetail } from '@/lib/cap/phase3';

export default async function EventWorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ side?: string }>;
}) {
  const session = await getSession();
  if (!session?.user) {
    redirect('/login');
  }

  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const eventId = Number(resolvedParams.eventId);
  const selectedView =
    resolvedSearch.side === 'organizer' || resolvedSearch.side === 'finance' ? resolvedSearch.side : null;

  if (!Number.isFinite(eventId) || eventId <= 0) {
    notFound();
  }

  let detail;
  try {
    detail = await getEventDetail(session.user, eventId, selectedView);
  } catch (error) {
    if (error instanceof Error && error.message === 'Event not found.') {
      notFound();
    }

    throw error;
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Programs workspace</p>
          <h2 className="mt-2 text-3xl font-semibold text-[#241c33]">Event dashboard</h2>
          <p className="mt-2 text-sm text-[#5f5673]">
            Enter the event first, then move into Organizer or Expenses from the event cards below.
          </p>
        </div>

        <Link
          href="/programs"
          className="rounded-2xl border border-[#d9cfee] bg-white px-4 py-3 text-sm font-medium text-[#241c33]"
        >
          Back to Programs
        </Link>
      </div>

      <ProgramsEventWorkspace detail={detail} selectedView={selectedView} />
    </section>
  );
}
