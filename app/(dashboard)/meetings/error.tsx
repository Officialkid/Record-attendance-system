'use client';

export default function MeetingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="space-y-6">
      <article className="rounded-[28px] border border-[#ead4d4] bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C97A2B]">Meetings recovery</p>
        <h2 className="mt-2 text-3xl font-semibold text-[#241c33]">The meetings screen hit a loading problem</h2>
        <p className="mt-3 max-w-3xl text-sm text-[#5f5673]">
          The page has been contained so the whole dashboard does not crash. You can retry the screen now while the
          underlying issue is being hardened.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-2xl bg-[#4B248C] px-4 py-3 text-sm font-semibold text-white"
          >
            Retry meetings page
          </button>
          <p className="text-xs text-[#7a7190]">{error.message || 'Unexpected meetings page error.'}</p>
        </div>
      </article>
    </section>
  );
}
