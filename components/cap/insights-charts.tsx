'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { InsightsPayload } from '@/lib/cap/types';

const palette = ['#4B248C', '#C9A461', '#6C49AE', '#2F7A5D', '#B6974D', '#2F4858'];

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

export function InsightsCharts({ insights }: { insights: InsightsPayload }) {
  const chartRowsBySeries = Object.fromEntries(
    insights.series.map((series) => [
      series.fieldKey,
      series.points.map((point) => ({
        ...point,
        shortDate: formatShortDate(point.recordDate),
      })),
    ])
  ) as Record<string, Array<{ recordId: number; recordDate: string; shortDate: string; value: number; anomaly: boolean }>>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        {insights.series.map((series, index) => {
          const color = palette[index % palette.length];
          const total = series.points.reduce((sum, point) => sum + point.value, 0);
          const latestPoint = series.points[series.points.length - 1];
          const average = series.points.length > 0 ? total / series.points.length : 0;
          const detailedRows = chartRowsBySeries[series.fieldKey] || [];
          const isExpenses = series.fieldKey === 'expenses';

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
                    <Tooltip formatter={formatTooltipMetric} />
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

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-3 text-sm text-[#5f5673]">
                  <span className="rounded-full bg-[#f4effb] px-3 py-1">
                    Latest: {latestPoint ? formatMetricNumber(latestPoint.value) : 'No data'}
                  </span>
                  <span className="rounded-full bg-[#fbf9fe] px-3 py-1">
                    Average: {formatMetricNumber(average)}
                  </span>
                  <span className="rounded-full bg-[#fbf9fe] px-3 py-1">
                    Anomalies: {series.points.filter((point) => point.anomaly).length}
                  </span>
                </div>

                <details className="group">
                  <summary className="list-none cursor-pointer rounded-full border border-[#d9cfee] px-3 py-2 text-sm font-medium text-[#4B248C]">
                    View full chart
                  </summary>

                  <div className="mt-4 rounded-[24px] border border-[#e6def4] bg-[#fbf9fe] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h4 className="text-lg font-semibold text-[#241c33]">{series.label} by Saturday</h4>
                        <p className="text-sm text-[#5f5673]">
                          Use this view when leadership needs the exact weekly bar-by-bar story.
                        </p>
                      </div>
                      <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#7a7190]">
                        {detailedRows.length} Saturdays
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                      <div className="h-80 rounded-2xl bg-white p-3">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={detailedRows}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ece4f8" />
                            <XAxis dataKey="shortDate" stroke="#5f5673" />
                            <YAxis stroke="#5f5673" />
                            <Tooltip formatter={formatTooltipMetric} />
                            <Bar dataKey="value" name={series.label} radius={[10, 10, 0, 0]}>
                              {detailedRows.map((row) => (
                                <Cell key={row.recordId} fill={row.anomaly ? '#C96A4A' : color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="space-y-4">
                        {isExpenses ? (
                          <div className="rounded-2xl bg-white p-4">
                            <p className="text-sm font-semibold text-[#241c33]">Expense share by Saturday</p>
                            <p className="mt-1 text-sm text-[#5f5673]">
                              This pie view helps leadership see which Saturdays consumed most of the expense total.
                            </p>
                            <div className="mt-3 h-56">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie data={detailedRows} dataKey="value" nameKey="shortDate" innerRadius={42} outerRadius={74}>
                                    {detailedRows.map((row, pieIndex) => (
                                      <Cell
                                        key={`${row.recordId}-pie`}
                                        fill={palette[pieIndex % palette.length]}
                                      />
                                    ))}
                                  </Pie>
                                  <Tooltip formatter={formatTooltipMetric} />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        ) : null}

                        <div className="rounded-2xl bg-white p-4">
                          <p className="text-sm font-semibold text-[#241c33]">Weekly readings</p>
                          <div className="mt-3 space-y-2 text-sm text-[#5f5673]">
                            {detailedRows.map((row) => (
                              <div key={`${series.fieldKey}-${row.recordId}`} className="flex items-center justify-between gap-3">
                                <span>{row.shortDate}</span>
                                <span className="font-medium text-[#241c33]">{formatMetricNumber(row.value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </details>
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
                <Tooltip formatter={formatTooltipMetric} />
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
