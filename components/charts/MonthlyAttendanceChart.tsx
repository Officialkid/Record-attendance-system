'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { CalendarX } from 'lucide-react';
import { useOrganization } from '@/lib/OrganizationContext';

interface Service {
  id: string;
  serviceDate: Date;
  totalAttendance: number;
  visitorCount: number;
}

interface Props {
  services: Service[];
  selectedMonth: number;
  selectedYear: number;
}

export default function MonthlyAttendanceChart({ services, selectedMonth, selectedYear }: Props) {
  const { currentOrg } = useOrganization();

  // Transform data for chart
  const chartData = services.map((service) => ({
    date: format(service.serviceDate, 'MMM d'),
    fullDate: format(service.serviceDate, 'EEEE, MMMM d, yyyy'),
    attendance: service.totalAttendance,
    visitors: service.visitorCount,
  })).reverse(); // Reverse to show chronologically

  // Find highest attendance for highlighting
  const maxAttendance = Math.max(...services.map(s => s.totalAttendance), 0);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-purple-500">
          <p className="font-semibold text-gray-800">{payload[0].payload.fullDate}</p>
          <p className="text-blue-600 font-bold text-xl mt-2">
            {payload[0].value.toLocaleString()} attendees
          </p>
          <p className="text-gray-600 mt-1">
            {payload[0].payload.visitors} new visitors
          </p>
        </div>
      );
    }
    return null;
  };

  if (services.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-lg p-12 text-center"
      >
        <CalendarX className="w-24 h-24 mx-auto text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          No Data Available
        </h3>
        <p className="text-gray-500">
          No services recorded for {format(new Date(selectedYear, selectedMonth - 1), 'MMMM yyyy')}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-2xl shadow-lg p-6"
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {currentOrg?.name ? `${currentOrg.name} - Monthly Attendance` : 'Monthly Attendance Overview'}
        </h2>
        <p className="text-gray-600 mt-1">
          {format(new Date(selectedYear, selectedMonth - 1), 'MMMM yyyy')}
        </p>
      </div>

      {/* Chart */}
      <div className="w-full">
        <ResponsiveContainer width="100%" height={400} className="hidden md:block">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              tick={{ fill: '#6b7280' }}
              style={{ fontSize: '14px' }}
            />
            <YAxis 
              stroke="#6b7280"
              tick={{ fill: '#6b7280' }}
              label={{ value: 'Attendance', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
              style={{ fontSize: '14px' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(75, 36, 140, 0.1)' }} />
            <Bar 
              dataKey="attendance" 
              radius={[8, 8, 0, 0]}
              animationDuration={1000}
              animationBegin={0}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.attendance === maxAttendance ? '#F3CC3C' : '#4b248c'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Tablet View */}
        <ResponsiveContainer width="100%" height={350} className="hidden sm:block md:hidden">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              tick={{ fill: '#6b7280' }}
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6b7280"
              tick={{ fill: '#6b7280' }}
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(75, 36, 140, 0.1)' }} />
            <Bar 
              dataKey="attendance" 
              radius={[6, 6, 0, 0]}
              animationDuration={1000}
              animationBegin={0}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.attendance === maxAttendance ? '#F3CC3C' : '#4b248c'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Mobile View */}
        <ResponsiveContainer width="100%" height={300} className="block sm:hidden">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              tick={{ fill: '#6b7280' }}
              style={{ fontSize: '10px' }}
            />
            <YAxis 
              stroke="#6b7280"
              tick={{ fill: '#6b7280' }}
              style={{ fontSize: '10px' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(75, 36, 140, 0.1)' }} />
            <Bar 
              dataKey="attendance" 
              radius={[6, 6, 0, 0]}
              animationDuration={1000}
              animationBegin={0}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.attendance === maxAttendance ? '#F3CC3C' : '#4b248c'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 md:gap-6 text-xs md:text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#4b248c' }}></div>
          <span className="text-gray-600">Regular Service</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#F3CC3C' }}></div>
          <span className="text-gray-600">Highest Attendance</span>
        </div>
      </div>

      {/* Stats Summary Below Chart */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center p-4 bg-purple-50 rounded-lg border border-purple-100"
        >
          <p className="text-sm text-gray-600">Total Services</p>
          <p className="text-2xl md:text-3xl font-bold text-purple-700">{services.length}</p>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100"
        >
          <p className="text-sm text-gray-600">Total Attendance</p>
          <p className="text-2xl md:text-3xl font-bold text-blue-700">
            {services.reduce((sum, s) => sum + s.totalAttendance, 0).toLocaleString()}
          </p>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-100"
        >
          <p className="text-sm text-gray-600">Peak Attendance</p>
          <p className="text-2xl md:text-3xl font-bold text-yellow-700">{maxAttendance.toLocaleString()}</p>
        </motion.div>
      </div>
    </motion.div>
  );
}
