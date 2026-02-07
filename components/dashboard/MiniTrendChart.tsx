'use client';

import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Service {
  id: string;
  serviceDate: Date;
  totalAttendance: number;
}

interface MiniTrendChartProps {
  services: Service[];
}

export default function MiniTrendChart({ services }: MiniTrendChartProps) {
  const chartData = services
    .slice()
    .reverse()
    .map((service) => ({
      date: format(new Date(service.serviceDate), 'MMM d'),
      fullDate: format(new Date(service.serviceDate), 'EEEE, MMMM d, yyyy'),
      attendance: service.totalAttendance,
    }));

  const calculateTrend = () => {
    if (services.length < 2) return null;

    const first = services[services.length - 1].totalAttendance;
    const last = services[0].totalAttendance;
    const change = last - first;
    const percentage = first === 0 ? '0.0' : ((change / first) * 100).toFixed(1);

    return {
      change,
      percentage,
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'same',
    };
  };

  const trend = calculateTrend();

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: { fullDate: string } }>; }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-200">
          <p className="text-xs text-gray-600">{payload[0].payload.fullDate}</p>
          <p className="text-sm font-bold text-purple-600">
            {payload[0].value} attendees
          </p>
        </div>
      );
    }
    return null;
  };

  if (services.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="bg-white rounded-xl border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Attendance Trend</h2>
          <p className="text-sm text-gray-600 mt-1">Last {services.length} services</p>
        </div>

        {trend && (
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              trend.direction === 'up'
                ? 'bg-green-50 text-green-700'
                : trend.direction === 'down'
                  ? 'bg-red-50 text-red-700'
                  : 'bg-gray-50 text-gray-700'
            }`}
          >
            {trend.direction === 'up' && <TrendingUp className="w-5 h-5" />}
            {trend.direction === 'down' && <TrendingDown className="w-5 h-5" />}
            {trend.direction === 'same' && <Minus className="w-5 h-5" />}

            <div>
              <p className="text-xs font-medium">
                {trend.direction === 'up'
                  ? 'Growing'
                  : trend.direction === 'down'
                    ? 'Declining'
                    : 'Stable'}
              </p>
              <p className="text-sm font-bold">
                {trend.change > 0 ? '+' : ''}{trend.change} ({trend.percentage}%)
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              stroke="#9ca3af"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickLine={{ stroke: '#e5e7eb' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="attendance"
              stroke="#4b248c"
              strokeWidth={3}
              dot={{ fill: '#4b248c', r: 5 }}
              activeDot={{ r: 7, fill: '#0047AB' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {trend && (
        <div className="mt-6 p-4 bg-purple-50 rounded-lg">
          <p className="text-sm text-purple-900">
            <span className="font-semibold">Insight:</span>{' '}
            {trend.direction === 'up'
              ? `Attendance is up ${trend.percentage}% compared to ${services.length} services ago! 🎉`
              : trend.direction === 'down'
                ? `Attendance is down ${Math.abs(Number(trend.percentage))}% compared to ${services.length} services ago.`
                : `Attendance has remained stable over the last ${services.length} services.`}
          </p>
        </div>
      )}
    </motion.div>
  );
}
