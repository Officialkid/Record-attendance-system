import Link from 'next/link';

export default function LeadershipPage() {
  return (
    <section className="space-y-6">
      <div className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Leadership</p>
        <h2 className="mt-2 text-3xl font-semibold text-[#241c33]">Leadership department workspace</h2>
        <p className="mt-2 max-w-3xl text-sm text-[#5f5673]">
          This is the dedicated Leadership department space inside the wider portal. It should feel separate from
          Programs and Protocol & Admin while still living in the same ministry ecosystem.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
          <h3 className="text-2xl font-semibold text-[#241c33]">What Leadership handles here</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
              <p className="text-sm font-semibold text-[#241c33]">Leadership decisions</p>
              <p className="mt-2 text-sm text-[#5f5673]">
                Keep leadership-specific meeting direction, coordination, and follow-up in one place.
              </p>
            </div>
            <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
              <p className="text-sm font-semibold text-[#241c33]">Department independence</p>
              <p className="mt-2 text-sm text-[#5f5673]">
                Leadership remains its own department workspace and does not merge with Programs or Protocol & Admin.
              </p>
            </div>
            <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
              <p className="text-sm font-semibold text-[#241c33]">Meeting follow-up</p>
              <p className="mt-2 text-sm text-[#5f5673]">
                Open leadership meetings for committee decisions, notes, and next actions.
              </p>
            </div>
            <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-4">
              <p className="text-sm font-semibold text-[#241c33]">Shared platform</p>
              <p className="mt-2 text-sm text-[#5f5673]">
                The departments share one portal, but each workspace should still feel clear and self-contained.
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
          <h3 className="text-2xl font-semibold text-[#241c33]">Leadership shortcuts</h3>
          <p className="mt-2 text-sm text-[#5f5673]">
            Use the leadership workspace directly, then move elsewhere only when your wider access genuinely allows it.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/admin"
              className="rounded-2xl bg-[#4B248C] px-4 py-3 text-sm font-semibold text-white"
            >
              Open admin workspace
            </Link>
            <Link
              href="/meetings"
              className="rounded-2xl bg-[#fff8eb] px-4 py-3 text-sm font-semibold text-[#8a6113]"
            >
              Open Leadership meetings
            </Link>
            <Link
              href="/notifications"
              className="rounded-2xl border border-[#d9cfee] bg-white px-4 py-3 text-sm font-semibold text-[#241c33]"
            >
              Open Notifications
            </Link>
            <Link
              href="/settings/profile"
              className="rounded-2xl border border-[#d9cfee] bg-white px-4 py-3 text-sm font-semibold text-[#241c33]"
            >
              Open Profile
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
