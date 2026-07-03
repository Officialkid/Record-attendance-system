'use client';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  AreaChart,
  Area,
} from 'recharts';

import type { InsightsPayload } from '@/lib/cap/types';

const palette = ['#4B248C', '#C9A461', '#6C49AE', '#8D74C8', '#B6974D', '#2F4858'];

export function InsightsCharts({ insights }: { insights: InsightsPayload }) {
  const combinedRows = insights.records.map((record) => {
    const values = record.values as Record<string, number | string>;
    const row: Record<string, string | number> = {
      recordDate: record.recordDate,
      visitor_count: record.visitorCount,
    };

    for (const [key, value] of Object.entries(values)) {
      row[key] = Number(value || 0);
    }

    return row;
  });

  return (
    <div className="space-y-6">
      <div className={`grid gap-6 ${insights.hasNetPosition ? 'xl:grid-cols-2' : 'xl:grid-cols-1'}`}>
        <div className="rounded-[28px] border border-[#ddd3f0] bg-white p-5">
          <h3 className="text-lg font-semibold text-[#241c33]">Metrics over time</h3>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={combinedRows}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ece4f8" />
                <XAxis dataKey="recordDate" stroke="#5f5673" />
                <YAxis stroke="#5f5673" />
                <Tooltip />
                <Legend />
                {insights.series.map((series, index) => (
                  <Line
                    key={series.fieldKey}
                    type="monotone"
                    dataKey={series.fieldKey}
                    name={series.label}
                    stroke={palette[index % palette.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {insights.hasNetPosition ? (
          <div className="rounded-[28px] border border-[#ddd3f0] bg-white p-5">
            <h3 className="text-lg font-semibold text-[#241c33]">Net position</h3>
            <div className="mt-4 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={insights.netPositions}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ece4f8" />
                  <XAxis dataKey="recordDate" stroke="#5f5673" />
                  <YAxis stroke="#5f5673" />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="weeklyNet" name="Weekly net" stroke="#C9A461" fill="#f2e4c1" />
                  <Area type="monotone" dataKey="cumulativeNet" name="Cumulative net" stroke="#4B248C" fill="#e7def8" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
