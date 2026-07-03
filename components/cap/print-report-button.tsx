'use client';

export function PrintReportButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-2xl border border-[#d9cfee] px-4 py-2 text-sm font-semibold text-[#241c33]"
    >
      Print / Save PDF
    </button>
  );
}
