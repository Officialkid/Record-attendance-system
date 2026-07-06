'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { InsightsPayload } from '@/lib/cap/types';

const palette = ['#4B248C', '#C9A461', '#6C49AE', '#2F7A5D', '#B6974D', '#2F4858'];

function formatMetricNumber(value: number) {
  return Number.isInteger(value) ? value.toLocaleString() : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function InsightsCharts({ insights }: { insights: InsightsPayload }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        {insights.series.map((series, index) => {
          const color = palette[index % palette.length];
          const total = series.points.reduce((sum, point) => sum + point.value, 0);
          const latestPoint = series.points[series.points.length - 1];

          return (
            <article key={series.fieldKey} className="rounded-[28px] border border-[#ddd3f0] bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8a7ca7]">Independent chart</p>
                  <h3 className="mt-2 text-xl font-semibold text-[#241c33]">{series.label}</h3>
                </div>
                <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] px-4 py-3 text-right">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#7a7190]">Total</p>
                  <p className="mt-2 text-xl font-semibold text-[#241c33]">{formatMetricNumber(total)}</p>
                </div>
              </div>

              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={series.points}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ece4f8" />
                    <XAxis dataKey="recordDate" stroke="#5f5673" />
                    <YAxis stroke="#5f5673" />
                    <Tooltip formatter={(value: number) => formatMetricNumber(Number(value || 0))} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      name={series.label}
                      stroke={color}
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 flex flex-wrap gap-3 text-sm text-[#5f5673]">
                <span className="rounded-full bg-[#f4effb] px-3 py-1">
                  Latest: {latestPoint ? formatMetricNumber(latestPoint.value) : 'No data'}
                </span>
                <span className="rounded-full bg-[#fbf9fe] px-3 py-1">
                  Anomalies: {series.points.filter((point) => point.anomaly).length}
                </span>
              </div>
            </article>
          );
        })}
      </div>

      {insights.hasNetPosition ? (
        <article className="rounded-[28px] border border-[#ddd3f0] bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8a7ca7]">Net movement</p>
              <h3 className="mt-2 text-xl font-semibold text-[#241c33]">Net position</h3>
            </div>
            <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-[#7a7190]">Current cumulative</p>
              <p className="mt-2 text-xl font-semibold text-[#241c33]">
                {formatMetricNumber(insights.netPositions[insights.netPositions.length - 1]?.cumulativeNet || 0)}
              </p>
            </div>
          </div>

          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={insights.netPositions}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ece4f8" />
                <XAxis dataKey="recordDate" stroke="#5f5673" />
                <YAxis stroke="#5f5673" />
                <Tooltip formatter={(value: number) => formatMetricNumber(Number(value || 0))} />
                <Area type="monotone" dataKey="weeklyNet" name="Weekly net" stroke="#C9A461" fill="#f2e4c1" />
                <Area
                  type="monotone"
                  dataKey="cumulativeNet"
                  name="Cumulative net"
                  stroke="#4B248C"
                  fill="#e7def8"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>
      ) : null}
    </div>
  );
}
