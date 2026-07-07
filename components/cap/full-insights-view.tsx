'use client';

import Link from 'next/link';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { InsightsPayload } from '@/lib/cap/types';

const palette = ['#4B248C', '#C9A461', '#6C49AE', '#2F7A5D', '#B6974D', '#2F4858'];

type RangeKey = '1m' | '3m' | '6m' | '12m' | 'custom';

function formatMetricNumber(value: number) {
  return Number.isInteger(value)
    ? value.toLocaleString()
    : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatTooltipMetric(value: number | string | undefined) {
  return formatMetricNumber(Number(value ?? 0));
}

function formatShortDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-KE', {
    day: 'numeric',
    month: 'short',
  }).format(parsed);
}

export function FullInsightsView({
  insights,
  departmentId,
  activeRange,
  start,
  end,
  focusMetric,
}: {
  insights: InsightsPayload;
  departmentId: number;
  activeRange: RangeKey;
  start: string;
  end: string;
  focusMetric?: string;
}) {
  const buildRangeHref = (range: RangeKey) => {
    const params = new URLSearchParams();
    params.set('departmentId', String(departmentId));
    params.set('range', range);
    if (range === 'custom') {
      params.set('start', start);
      params.set('end', end);
    }
    return `/insights/full?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-[#ddd3f0] bg-white p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#4B248C]">Full analysis</p>
          <h3 className="mt-2 text-2xl font-semibold text-[#241c33]">All insights in one page</h3>
          <p className="mt-2 text-sm text-[#5f5673]">
            Review every tracked metric in stacked sections, then compare the exact weekly movement without opening many separate pages.
          </p>
        </div>
        <Link
          href={`/insights?departmentId=${departmentId}&start=${start}&end=${end}`}
          className="rounded-2xl border border-[#d9cfee] bg-white px-4 py-3 text-sm font-medium text-[#241c33]"
        >
          Back to insights summary
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        {(['1m', '3m', '6m', '12m'] as RangeKey[]).map((range) => (
          <Link
            key={range}
            href={buildRangeHref(range)}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              activeRange === range
                ? 'bg-[#4B248C] text-white'
                : 'border border-[#d9cfee] bg-white text-[#241c33]'
            }`}
          >
            {range === '1m' ? '1 month' : range === '3m' ? '3 months' : range === '6m' ? '6 months' : '12 months'}
          </Link>
        ))}
      </div>

      <form className="grid gap-3 rounded-[24px] border border-[#ddd3f0] bg-white p-5 md:grid-cols-[auto_auto_auto_auto_auto]">
        <input type="hidden" name="departmentId" value={departmentId} />
        <input type="hidden" name="range" value="custom" />
        <input type="date" name="start" defaultValue={start} className="rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33] outline-none" />
        <input type="date" name="end" defaultValue={end} className="rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33] outline-none" />
        <button type="submit" className="rounded-2xl bg-[#4B248C] px-4 py-3 text-sm font-semibold text-white">
          Apply custom range
        </button>
        <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] px-4 py-3 text-sm text-[#5f5673] md:col-span-2">
          Showing {start} to {end}
        </div>
      </form>

      {insights.series.map((series, index) => {
        const color = palette[index % palette.length];
        const rows = series.points.map((point) => ({
          ...point,
          shortDate: formatShortDate(point.recordDate),
        }));
        const total = series.points.reduce((sum, point) => sum + point.value, 0);
        const average = series.points.length > 0 ? total / series.points.length : 0;
        const anomalies = series.points.filter((point) => point.anomaly).length;
        const isExpenses = series.fieldKey === 'expenses';
        const isFocused = focusMetric === series.fieldKey;

        return (
          <article
            id={series.fieldKey}
            key={series.fieldKey}
            className={`rounded-[28px] border bg-white p-6 shadow-sm ${
              isFocused ? 'border-[#4B248C] ring-2 ring-[#ede3ff]' : 'border-[#ddd3f0]'
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8a7ca7]">Metric section</p>
                <h3 className="mt-2 text-2xl font-semibold text-[#241c33]">{series.label}</h3>
                <p className="mt-2 text-sm text-[#5f5673]">
                  Weekly bar-by-bar view for leadership and department review.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] px-4 py-3 text-right">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#7a7190]">Total</p>
                  <p className="mt-2 text-xl font-semibold text-[#241c33]">{formatMetricNumber(total)}</p>
                </div>
                <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] px-4 py-3 text-right">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#7a7190]">Average</p>
                  <p className="mt-2 text-xl font-semibold text-[#241c33]">{formatMetricNumber(average)}</p>
                </div>
                <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] px-4 py-3 text-right">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#7a7190]">Anomalies</p>
                  <p className="mt-2 text-xl font-semibold text-[#241c33]">{anomalies}</p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
              <div className="rounded-[24px] border border-[#e6def4] bg-[#fbf9fe] p-4">
                <div className="h-80 rounded-2xl bg-white p-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rows}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ece4f8" />
                      <XAxis dataKey="shortDate" stroke="#5f5673" />
                      <YAxis stroke="#5f5673" />
                      <Tooltip formatter={formatTooltipMetric} />
                      <Bar dataKey="value" name={series.label} radius={[10, 10, 0, 0]}>
                        {rows.map((row) => (
                          <Cell key={row.recordId} fill={row.anomaly ? '#C96A4A' : color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-4">
                {isExpenses ? (
                  <div className="rounded-[24px] border border-[#e6def4] bg-[#fbf9fe] p-4">
                    <p className="text-sm font-semibold text-[#241c33]">Expense share by Saturday</p>
                    <div className="mt-3 h-56 rounded-2xl bg-white p-3">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={rows} dataKey="value" nameKey="shortDate" innerRadius={42} outerRadius={74}>
                            {rows.map((row, pieIndex) => (
                              <Cell key={`${row.recordId}-pie`} fill={palette[pieIndex % palette.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={formatTooltipMetric} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : null}

                <div className="rounded-[24px] border border-[#e6def4] bg-[#fbf9fe] p-4">
                  <p className="text-sm font-semibold text-[#241c33]">Weekly readings</p>
                  <div className="mt-3 space-y-2 text-sm text-[#5f5673]">
                    {rows.map((row) => (
                      <div key={`${series.fieldKey}-${row.recordId}`} className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3">
                        <span>{row.shortDate}</span>
                        <span className="font-medium text-[#241c33]">{formatMetricNumber(row.value)}</span>
                      </div>
                    ))}
                    {rows.length === 0 ? (
                      <div className="rounded-2xl bg-white px-4 py-3 text-sm text-[#5f5673]">
                        No readings available for this range.
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
