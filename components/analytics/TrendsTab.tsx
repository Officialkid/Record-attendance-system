'use client';

import { useEffect, useState, useCallback } from 'react';
import { useOrganization } from '@/lib/OrganizationContext';
import { 
  compareYears, 
  getMonthlyTotalsByYear
} from '@/lib/firestore-multitenant';
import { 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid,
  Tooltip, 
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Calendar,
  Target,
  Zap
} from 'lucide-react';

interface ComparisonMonth {
  month: string;
  [year: number]: number;
  growth?: number;
}

interface MonthlyData {
  monthName: string;
  totalAttendance: number;
  serviceCount: number;
}

interface Insights {
  overallGrowth: number;
  bestMonth: MonthlyData;
  avgAttendance: number;
  recentTrend: 'growing' | 'declining' | 'stable' | 'insufficient_data';
  totalCurrent: number;
  totalPrevious: number;
}

interface TrendsTabProps {
  year: number;
}

interface TooltipPayload {
  color: string;
  name: string;
  value: number;
  payload: ComparisonMonth;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
}

export default function TrendsTab({ year }: TrendsTabProps) {
  const { currentOrg, terminology } = useOrganization();
  const [comparisonData, setComparisonData] = useState<ComparisonMonth[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<Insights | null>(null);

  const previousYear = year - 1;

  const calculateInsights = useCallback((comparison: ComparisonMonth[], monthly: MonthlyData[]) => {
    // Overall growth
    const totalCurrent = comparison.reduce((sum, m) => sum + (m[year] || 0), 0);
    const totalPrevious = comparison.reduce((sum, m) => sum + (m[previousYear] || 0), 0);
    const overallGrowth = totalPrevious > 0 
      ? ((totalCurrent - totalPrevious) / totalPrevious) * 100 
      : 0;

    // Best month
    const bestMonth = monthly.reduce((max, m) => 
      m.totalAttendance > max.totalAttendance ? m : max
    );

    // Average attendance
    const monthsWithData = monthly.filter(m => m.serviceCount > 0);
    const avgAttendance = monthsWithData.length > 0
      ? Math.round(
          monthsWithData.reduce((sum, m) => sum + m.totalAttendance, 0) / 
          monthsWithData.reduce((sum, m) => sum + m.serviceCount, 0)
        )
      : 0;

    // Growth trend (last 3 months)
    const recentMonths = monthly.slice(-3).filter(m => m.serviceCount > 0);
    const recentTrend = recentMonths.length >= 2
      ? recentMonths[recentMonths.length - 1].totalAttendance > recentMonths[0].totalAttendance
        ? 'growing' as const
        : recentMonths[recentMonths.length - 1].totalAttendance < recentMonths[0].totalAttendance
        ? 'declining' as const
        : 'stable' as const
      : 'insufficient_data' as const;

    setInsights({
      overallGrowth,
      bestMonth,
      avgAttendance,
      recentTrend,
      totalCurrent,
      totalPrevious,
    });
  }, [year, previousYear]);

  const loadTrendsData = useCallback(async () => {
    if (!currentOrg) return;

    setLoading(true);
    try {
      const [comparison, monthly] = await Promise.all([
        compareYears(currentOrg.id, year, previousYear),
        getMonthlyTotalsByYear(currentOrg.id, year),
      ]);

      setComparisonData(comparison);
      setMonthlyData(monthly);
      
      // Calculate insights
      calculateInsights(comparison, monthly);
    } catch (error) {
      console.error('Error loading trends:', error);
    } finally {
      setLoading(false);
    }
  }, [currentOrg, year, previousYear, calculateInsights]);

  useEffect(() => {
    if (currentOrg) {
      loadTrendsData();
    }
  }, [currentOrg, loadTrendsData]);

  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-4 py-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-900 mb-2">
            {payload[0].payload.month}
          </p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600">{entry.name}:</span>
              <span className="font-semibold text-gray-900">{entry.value}</span>
            </div>
          ))}
          {payload[0].payload.growth !== undefined && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <span className={`text-sm font-semibold ${
                payload[0].payload.growth > 0 ? 'text-green-600' : 
                payload[0].payload.growth < 0 ? 'text-red-600' : 
                'text-gray-600'
              }`}>
                {payload[0].payload.growth > 0 ? '+' : ''}{payload[0].payload.growth.toFixed(1)}% growth
              </span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-100 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* INSIGHTS CARDS */}
      {insights && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Overall Growth */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Year-over-Year</span>
              {insights.overallGrowth > 0 ? (
                <TrendingUp className="w-5 h-5 text-green-600" />
              ) : insights.overallGrowth < 0 ? (
                <TrendingDown className="w-5 h-5 text-red-600" />
              ) : (
                <Minus className="w-5 h-5 text-gray-600" />
              )}
            </div>
            <p className={`text-2xl font-bold ${
              insights.overallGrowth > 0 ? 'text-green-600' : 
              insights.overallGrowth < 0 ? 'text-red-600' : 
              'text-gray-900'
            }`}>
              {insights.overallGrowth > 0 ? '+' : ''}{insights.overallGrowth.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {insights.totalCurrent} vs {insights.totalPrevious}
            </p>
          </div>

          {/* Best Month */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Best Month</span>
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {insights.bestMonth.monthName}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {insights.bestMonth.totalAttendance} total
            </p>
          </div>

          {/* Average Attendance */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Avg per {terminology.Event}</span>
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {insights.avgAttendance}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              This year
            </p>
          </div>

          {/* Recent Trend */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Recent Trend</span>
              <Zap className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 capitalize">
              {insights.recentTrend === 'insufficient_data' ? 'N/A' : insights.recentTrend}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Last 3 months
            </p>
          </div>

        </div>
      )}

      {/* YEAR-OVER-YEAR COMPARISON CHART */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Year-over-Year Comparison
          </h2>
          <p className="text-sm text-gray-600">
            Compare {year} vs {previousYear} attendance
          </p>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="month" 
                stroke="#6b7280"
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <YAxis 
                stroke="#6b7280"
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey={year} 
                fill="#4b248c" 
                name={`${year}`}
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey={previousYear} 
                fill="#9ca3af" 
                name={`${previousYear}`}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* MONTHLY TREND LINE */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {year} Monthly Trend
          </h2>
          <p className="text-sm text-gray-600">
            Attendance pattern throughout the year
          </p>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4b248c" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#4b248c" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="monthName" 
                stroke="#6b7280"
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <YAxis 
                stroke="#6b7280"
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="totalAttendance" 
                stroke="#4b248c" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorAttendance)"
                name="Total Attendance"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* GROWTH RATE BY MONTH */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Growth Rate by Month
          </h2>
          <p className="text-sm text-gray-600">
            Month-over-month percentage change
          </p>
        </div>

        <div className="space-y-3">
          {comparisonData.map((month, index) => {
            const growth = month.growth || 0;
            const isPositive = growth > 0;
            const isNegative = growth < 0;

            return (
              <div key={index} className="flex items-center gap-4">
                <div className="w-20 text-sm font-medium text-gray-700">
                  {month.month}
                </div>
                <div className="flex-1">
                  <div className="h-8 bg-gray-100 rounded-lg overflow-hidden relative">
                    <div
                      className={`h-full transition-all ${
                        isPositive ? 'bg-green-500' : isNegative ? 'bg-red-500' : 'bg-gray-300'
                      }`}
                      style={{ 
                        width: `${Math.min(Math.abs(growth), 100)}%`,
                        opacity: 0.8
                      }}
                    />
                    <div className="absolute inset-0 flex items-center px-3">
                      <span className={`text-sm font-semibold ${
                        Math.abs(growth) > 20 ? 'text-white' : 'text-gray-900'
                      }`}>
                        {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="w-24 text-right">
                  {isPositive && (
                    <span className="inline-flex items-center gap-1 text-sm text-green-600 font-medium">
                      <TrendingUp className="w-4 h-4" />
                      Growing
                    </span>
                  )}
                  {isNegative && (
                    <span className="inline-flex items-center gap-1 text-sm text-red-600 font-medium">
                      <TrendingDown className="w-4 h-4" />
                      Declining
                    </span>
                  )}
                  {!isPositive && !isNegative && (
                    <span className="text-sm text-gray-500">
                      Stable
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
