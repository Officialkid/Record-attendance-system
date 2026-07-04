import Link from 'next/link';

export default function OversightPage() {
  return (
    <section className="space-y-6">
      <div className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Leadership</p>
        <h2 className="mt-2 text-3xl font-semibold text-[#241c33]">Leadership oversight</h2>
        <p className="mt-2 max-w-3xl text-sm text-[#5f5673]">
          This is the stable leadership workspace for cross-department visibility, planning, and ministry-wide review.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
          <h3 className="text-2xl font-semibold text-[#241c33]">What leadership can review</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
              <p className="text-sm font-semibold text-[#241c33]">Department visibility</p>
              <p className="mt-2 text-sm text-[#5f5673]">
                Review ministry activity across departments from one place without switching into each workspace manually.
              </p>
            </div>
            <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
              <p className="text-sm font-semibold text-[#241c33]">Programs oversight</p>
              <p className="mt-2 text-sm text-[#5f5673]">
                Follow programs meetings, records, and financial summaries from a single leadership entry point.
              </p>
            </div>
            <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
              <p className="text-sm font-semibold text-[#241c33]">Meeting follow-up</p>
              <p className="mt-2 text-sm text-[#5f5673]">
                Open the shared Meetings workspace for committee decisions, notes, and next actions.
              </p>
            </div>
            <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
              <p className="text-sm font-semibold text-[#241c33]">Next phase</p>
              <p className="mt-2 text-sm text-[#5f5673]">
                This page gives leadership a dependable landing area while richer reporting and charts are hardened.
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
          <h3 className="text-2xl font-semibold text-[#241c33]">Leadership shortcuts</h3>
          <p className="mt-2 text-sm text-[#5f5673]">
            Use these working areas immediately for live ministry visibility and administration.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/programs"
              className="rounded-2xl bg-[#4B248C] px-4 py-3 text-sm font-semibold text-white"
            >
              Open Programs
            </Link>
            <Link
              href="/meetings"
              className="rounded-2xl bg-[#fff8eb] px-4 py-3 text-sm font-semibold text-[#8a6113]"
            >
              Open Meetings
            </Link>
            <Link
              href="/insights"
              className="rounded-2xl border border-[#d9cfee] bg-white px-4 py-3 text-sm font-semibold text-[#241c33]"
            >
              Open Insights
            </Link>
            <Link
              href="/admin"
              className="rounded-2xl border border-[#d9cfee] bg-white px-4 py-3 text-sm font-semibold text-[#241c33]"
            >
              Open Admin
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
