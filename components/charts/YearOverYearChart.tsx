'use client';

import { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { compareYears, type YearComparison } from '@/lib/firestore-multitenant';
import { useOrganization } from '@/lib/OrganizationContext';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  selectedYear: number;
}

export default function YearOverYearChart({ selectedYear }: Props) {
  const { currentOrg } = useOrganization();
  const [comparisonData, setComparisonData] = useState<YearComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const currentYear = selectedYear;
  const previousYear = selectedYear - 1;

  const loadComparisonData = useCallback(async () => {
    if (!currentOrg) return;

    setLoading(true);
    try {
      const data = await compareYears(currentOrg.id, currentYear, previousYear);
      setComparisonData(data);
    } catch (error) {
      console.error('Error loading comparison:', error);
    } finally {
      setLoading(false);
    }
  }, [currentOrg, currentYear, previousYear]);

  useEffect(() => {
    if (currentOrg) {
      loadComparisonData();
    } else {
      setLoading(true);
    }
  }, [currentOrg, loadComparisonData, selectedYear]);

  // Calculate overall stats
  const currentYearTotal = comparisonData.reduce((sum, m) => sum + (m[currentYear] || 0), 0);
  const previousYearTotal = comparisonData.reduce((sum, m) => sum + (m[previousYear] || 0), 0);
  const overallGrowth = previousYearTotal > 0 
    ? ((currentYearTotal - previousYearTotal) / previousYearTotal) * 100 
    : 0;

  const bestMonth = comparisonData.reduce((best, current) => 
    (current[currentYear] || 0) > (best[currentYear] || 0) ? current : best
  , comparisonData[0] || {});

  const worstMonth = comparisonData.reduce((worst, current) => 
    (current[currentYear] || 0) < (worst[currentYear] || 0) && (current[currentYear] || 0) > 0 ? current : worst
  , comparisonData[0] || {});

  const avgMonthly = currentYearTotal / 12;

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey: number; value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
      const current = payload.find((p) => p.dataKey === currentYear);
      const previous = payload.find((p) => p.dataKey === previousYear);
      const growth = comparisonData.find((d) => d.month === label)?.growth || 0;

      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-blue-500">
          <p className="font-semibold text-gray-800 mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-blue-600 font-semibold">
              {currentYear}: {(current?.value || 0).toLocaleString()}
            </p>
            <p className="text-gray-500">
              {previousYear}: {(previous?.value || 0).toLocaleString()}
            </p>
            <div className="flex items-center gap-1 mt-2">
              {growth > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : growth < 0 ? (
                <TrendingDown className="w-4 h-4 text-red-500" />
              ) : (
                <Minus className="w-4 h-4 text-gray-400" />
              )}
              <span className={growth > 0 ? 'text-green-600 font-semibold' : growth < 0 ? 'text-red-600 font-semibold' : 'text-gray-500'}>
                {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="bg-white rounded-2xl shadow-lg overflow-hidden"
    >
      {/* Header with collapse toggle */}
      <div 
        className="p-6 bg-gradient-to-r from-[#4b248c] to-[#0047AB] text-white cursor-pointer hover:from-[#5c2fa0] hover:to-[#0056d1] transition-all duration-300"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Growth Trends - Year Comparison</h2>
            <p className="text-white/80 mt-1">
              Comparing {currentYear} vs {previousYear}
            </p>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2"
          >
            <span className="text-sm font-medium hidden md:inline">
              {isExpanded ? 'Click to collapse' : 'Click to expand'}
            </span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </div>
      </div>

      {/* Expandable content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-gradient-to-br from-gray-50 to-white">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-center p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow"
              >
                <p className="text-sm text-gray-600 mb-2">Overall Growth</p>
                <div className="flex items-center justify-center gap-2">
                  {overallGrowth > 0 ? (
                    <TrendingUp className="w-6 h-6 text-green-500" />
                  ) : overallGrowth < 0 ? (
                    <TrendingDown className="w-6 h-6 text-red-500" />
                  ) : (
                    <Minus className="w-6 h-6 text-gray-400" />
                  )}
                  <p className={`text-3xl font-bold ${overallGrowth > 0 ? 'text-green-600' : overallGrowth < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                    {overallGrowth > 0 ? '+' : ''}{overallGrowth.toFixed(1)}%
                  </p>
                </div>
              </motion.div>

              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow"
              >
                <p className="text-sm text-gray-600 mb-2">Best Month</p>
                <p className="text-2xl font-bold text-purple-600">{bestMonth?.month}</p>
                <p className="text-sm text-gray-500 mt-1">{(bestMonth?.[currentYear] || 0).toLocaleString()} attendees</p>
              </motion.div>

              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow"
              >
                <p className="text-sm text-gray-600 mb-2">Lowest Month</p>
                <p className="text-2xl font-bold text-blue-600">{worstMonth?.month}</p>
                <p className="text-sm text-gray-500 mt-1">{(worstMonth?.[currentYear] || 0).toLocaleString()} attendees</p>
              </motion.div>

              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-center p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow"
              >
                <p className="text-sm text-gray-600 mb-2">Monthly Average</p>
                <p className="text-3xl font-bold text-[#F3CC3C]">{avgMonthly.toFixed(0)}</p>
                <p className="text-sm text-gray-500 mt-1">{currentYear}</p>
              </motion.div>
            </div>

            {/* Line Chart */}
            <div className="p-6">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="month" 
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
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="line"
                  />
                  <Line 
                    type="monotone" 
                    dataKey={currentYear} 
                    stroke="#0047AB" 
                    strokeWidth={3}
                    dot={{ fill: '#0047AB', r: 5 }}
                    activeDot={{ r: 8 }}
                    animationDuration={1500}
                    name={`${currentYear} (Current)`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey={previousYear} 
                    stroke="#9ca3af" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: '#9ca3af', r: 4 }}
                    animationDuration={1500}
                    name={`${previousYear} (Previous)`}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Insights Section */}
            <div className="px-6 pb-6">
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100">
                <h3 className="text-lg font-bold text-gray-800 mb-3">Key Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                    <div>
                      <p className="font-semibold text-gray-700">Total Attendance</p>
                      <p className="text-gray-600">
                        {currentYear}: <span className="font-bold text-blue-600">{currentYearTotal.toLocaleString()}</span>
                      </p>
                      <p className="text-gray-600">
                        {previousYear}: <span className="font-bold text-gray-500">{previousYearTotal.toLocaleString()}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                    <div>
                      <p className="font-semibold text-gray-700">Year-over-Year Change</p>
                      <p className="text-gray-600">
                        {currentYearTotal > previousYearTotal ? 'Increased' : currentYearTotal < previousYearTotal ? 'Decreased' : 'No change'} by{' '}
                        <span className={`font-bold ${overallGrowth > 0 ? 'text-green-600' : overallGrowth < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                          {Math.abs(currentYearTotal - previousYearTotal).toLocaleString()}
                        </span>{' '}
                        attendees
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
