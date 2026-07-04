'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export function ProgramsEventSummaryChart({
  totalCollected,
  totalSpent,
  balanceRetained,
}: {
  totalCollected: number;
  totalSpent: number;
  balanceRetained: number;
}) {
  const data = [
    { name: 'Collected', amount: totalCollected, fill: '#4B248C' },
    { name: 'Spent', amount: totalSpent, fill: '#C97A2B' },
    { name: 'Balance', amount: balanceRetained, fill: balanceRetained >= 0 ? '#2B7A4B' : '#B13A3A' },
  ];
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

      <div className="mt-4 h-[220px] w-full rounded-2xl border border-[#efe7fb] bg-[#fcfbfe] p-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid stroke="#efe7fb" strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fill: '#5f5673', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#5f5673', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="amount" radius={[10, 10, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
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
