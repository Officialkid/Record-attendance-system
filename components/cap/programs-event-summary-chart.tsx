'use client';

type SummaryRow = {
  name: string;
  amount: number;
  fillClass: string;
  trackClass: string;
};

export function ProgramsEventSummaryChart({
  totalCollected,
  totalSpent,
  balanceRetained,
}: {
  totalCollected: number;
  totalSpent: number;
  balanceRetained: number;
}) {
  const data: SummaryRow[] = [
    {
      name: 'Collected',
      amount: totalCollected,
      fillClass: 'bg-[#4B248C]',
      trackClass: 'bg-[#ede7f7]',
    },
    {
      name: 'Spent',
      amount: totalSpent,
      fillClass: 'bg-[#C97A2B]',
      trackClass: 'bg-[#fff1df]',
    },
    {
      name: 'Balance',
      amount: balanceRetained,
      fillClass: balanceRetained >= 0 ? 'bg-[#2B7A4B]' : 'bg-[#B13A3A]',
      trackClass: balanceRetained >= 0 ? 'bg-[#e8f5ec]' : 'bg-[#fdecec]',
    },
  ];

  const maxAmount = Math.max(...data.map((entry) => Math.abs(entry.amount)), 1);
  const totalFlow = totalCollected + totalSpent;
  const stewardshipRate = totalCollected > 0 ? Math.round((balanceRetained / totalCollected) * 100) : 0;

  return (
    <div className="rounded-[24px] bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-[#f6f1fd] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7b67a3]">Collections</p>
          <p className="mt-2 text-2xl font-semibold text-[#241c33]">{totalCollected.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl bg-[#fff6ea] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b87424]">Expenses</p>
          <p className="mt-2 text-2xl font-semibold text-[#241c33]">{totalSpent.toLocaleString()}</p>
        </div>
        <div className={`rounded-2xl px-4 py-3 ${balanceRetained >= 0 ? 'bg-[#eef9f1]' : 'bg-[#fff0f0]'}`}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5f5673]">Balance retained</p>
          <p className="mt-2 text-2xl font-semibold text-[#241c33]">{balanceRetained.toLocaleString()}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[#efe7fb] bg-[#fcfbfe] p-4">
        <div className="space-y-4">
          {data.map((entry) => {
            const width = Math.max(8, Math.round((Math.abs(entry.amount) / maxAmount) * 100));

            return (
              <div key={entry.name} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[#241c33]">{entry.name}</p>
                  <p className="text-sm text-[#5f5673]">{entry.amount.toLocaleString()}</p>
                </div>
                <div className={`h-3 w-full overflow-hidden rounded-full ${entry.trackClass}`}>
                  <div className={`h-full rounded-full ${entry.fillClass}`} style={{ width: `${width}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#efe7fb] bg-[#fbf9fe] px-4 py-3">
          <p className="text-xs text-[#7a7190]">Stewardship rate</p>
          <p className="mt-1 text-lg font-semibold text-[#241c33]">{stewardshipRate}% retained from collections</p>
        </div>
        <div className="rounded-2xl border border-[#efe7fb] bg-[#fbf9fe] px-4 py-3">
          <p className="text-xs text-[#7a7190]">Tracked flow</p>
          <p className="mt-1 text-lg font-semibold text-[#241c33]">{totalFlow.toLocaleString()} total movement</p>
        </div>
      </div>
    </div>
  );
}
