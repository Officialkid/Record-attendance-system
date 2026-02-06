'use client';

import { useState, useEffect } from 'react';
import { getServicesByMonth, getMonthlyStats, getVisitorsForService } from '@/lib/firestore-multitenant';
import { useOrganization } from '@/lib/OrganizationContext';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Users, TrendingUp, UserPlus, CalendarX, X, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import MonthlyAttendanceChart from '@/components/charts/MonthlyAttendanceChart';
import YearOverYearChart from '@/components/charts/YearOverYearChart';

interface Service {
  id: string;
  serviceDate: Date;
  serviceType: string;
  totalAttendance: number;
  visitorCount: number;
}

interface Visitor {
  id: string;
  visitorName: string;
  visitorContact: string;
  visitDate: Date;
}

interface Stats {
  totalServices: number;
  totalAttendance: number;
  totalVisitors: number;
  avgAttendance: number;
}

export default function ViewAnalyticsPage() {
  const { currentOrg } = useOrganization();
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [services, setServices] = useState<Service[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loadingVisitors, setLoadingVisitors] = useState(false);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 11 }, (_, i) => 2020 + i);

  useEffect(() => {
    if (currentOrg) {
      loadData();
    } else {
      setLoading(true);
    }
  }, [selectedMonth, selectedYear, currentOrg?.id]);

  const loadData = async () => {
    if (!currentOrg) return;

    setLoading(true);
    try {
      const [servicesData, statsData] = await Promise.all([
        getServicesByMonth(currentOrg.id, selectedMonth, selectedYear),
        getMonthlyStats(currentOrg.id, selectedMonth, selectedYear),
      ]);

      setServices(servicesData as Service[]);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleViewVisitors = async (serviceId: string) => {
    setLoadingVisitors(true);
    setSelectedService(serviceId);
    try {
      const visitorsData = await getVisitorsForService(serviceId);
      setVisitors(visitorsData as Visitor[]);
    } catch (error) {
      toast.error('Failed to load visitors');
    } finally {
      setLoadingVisitors(false);
    }
  };

  const handleResetFilters = () => {
    const now = new Date();
    setSelectedMonth(now.getMonth() + 1);
    setSelectedYear(now.getFullYear());
  };

  const isCurrentMonth = selectedMonth === currentDate.getMonth() + 1 && 
                        selectedYear === currentDate.getFullYear();

  const showSkeleton = loading || !currentOrg;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f9f9f9] via-white to-[#f3f4f6] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Analytics Dashboard - {currentOrg?.name}
          </h1>
          <p className="text-gray-600">
            Track and analyze attendance records over time
          </p>
        </motion.div>

        {/* Filters Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#4b248c] focus:outline-none transition-colors"
              >
                {months.map((month, index) => (
                  <option key={month} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#4b248c] focus:outline-none transition-colors"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {!isCurrentMonth && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={handleResetFilters}
                className="px-6 py-3 bg-gradient-to-r from-[#4b248c] to-[#0047AB] text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
              >
                Reset to Current Month
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Stats Cards */}
        {showSkeleton ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-200 rounded-2xl h-32 animate-pulse" />
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Services Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-[#4b248c] to-[#0047AB] rounded-2xl shadow-lg p-6 text-white hover:shadow-2xl transition-all duration-300"
            >
              <Calendar className="w-8 h-8 mb-3 opacity-80" />
              <div className="text-5xl font-bold mb-2">{stats.totalServices}</div>
              <div className="text-sm opacity-90">Services This Month</div>
            </motion.div>

            {/* Total Attendance Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-[#0047AB] to-[#0056d1] rounded-2xl shadow-lg p-6 text-white hover:shadow-2xl transition-all duration-300"
            >
              <Users className="w-8 h-8 mb-3 opacity-80" />
              <div className="text-5xl font-bold mb-2">
                {stats.totalAttendance.toLocaleString()}
              </div>
              <div className="text-sm opacity-90">Total Attendance</div>
            </motion.div>

            {/* Average Attendance Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2 * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-[#4b248c] to-[#6b34bc] rounded-2xl shadow-lg p-6 text-white hover:shadow-2xl transition-all duration-300"
            >
              <TrendingUp className="w-8 h-8 mb-3 opacity-80" />
              <div className="text-5xl font-bold mb-2">{stats.avgAttendance}</div>
              <div className="text-sm opacity-90">Average per Service</div>
            </motion.div>

            {/* New Visitors Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3 * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-[#F3CC3C] to-[#f5d76e] rounded-2xl shadow-lg p-6 text-gray-900 hover:shadow-2xl transition-all duration-300"
            >
              <UserPlus className="w-8 h-8 mb-3 opacity-80" />
              <div className="text-5xl font-bold mb-2">{stats.totalVisitors}</div>
              <div className="text-sm opacity-90 font-medium">New Visitors</div>
            </motion.div>
          </div>
        ) : null}

        {/* Monthly Attendance Chart */}
        {showSkeleton ? (
          <div className="mb-8 bg-gray-200 rounded-2xl h-80 animate-pulse" />
        ) : (!loading && services.length > 0 && (
          <div className="mb-8">
            <MonthlyAttendanceChart 
              services={services}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
            />
          </div>
        ))}

        {/* Year-over-Year Comparison Chart */}
        <div className="mb-8">
          <YearOverYearChart selectedYear={selectedYear} />
        </div>

        {/* Attendance Records */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="px-6 py-4 bg-gradient-to-r from-[#4b248c] to-[#0047AB]">
            <h2 className="text-2xl font-bold text-white">Attendance Records</h2>
            <p className="text-white/80 text-sm mt-1">
              {months[selectedMonth - 1]} {selectedYear}
            </p>
          </div>

          {showSkeleton ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : services.length === 0 ? (
            // Empty State
            <div className="p-12 text-center">
              <CalendarX className="w-24 h-24 mx-auto text-gray-300 mb-4" />
              <h3 className="text-2xl font-bold text-gray-700 mb-2">
                No Services Recorded
              </h3>
              <p className="text-gray-500 mb-6">
                No attendance records found for {months[selectedMonth - 1]} {selectedYear}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/add-attendance"
                  className="px-6 py-3 bg-gradient-to-r from-[#4b248c] to-[#0047AB] text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
                >
                  Add First Service
                </Link>
                <button
                  onClick={handleResetFilters}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:border-[#4b248c] hover:text-[#4b248c] transition-all duration-300 font-medium"
                >
                  Try Different Month
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Service Type
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                        Total Attendance
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                        Visitors
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((service, index) => (
                      <motion.tr
                        key={service.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className={`
                          border-t border-gray-100 hover:bg-blue-50 transition-colors
                          ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                        `}
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">
                            {format(service.serviceDate, 'EEEE, MMMM d, yyyy')}
                          </div>
                          <div className="text-sm text-gray-500">
                            {format(service.serviceDate, 'h:mm a')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                            {service.serviceType}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex items-center justify-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-bold text-lg">
                            {service.totalAttendance.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold bg-[#F3CC3C] text-gray-900">
                            {service.visitorCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleViewVisitors(service.id)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#4b248c] to-[#0047AB] text-white rounded-lg hover:shadow-lg transition-all duration-300 font-medium text-sm"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden p-4 space-y-4">
                {services.map((service, index) => (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white border-2 border-gray-100 rounded-xl p-4 hover:border-[#4b248c] transition-all duration-300"
                  >
                    <div className="font-bold text-lg text-gray-900 mb-2">
                      {format(service.serviceDate, 'EEEE, MMM d, yyyy')}
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Service Type:</span>
                        <span className="font-medium text-purple-700">{service.serviceType}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Attendance:</span>
                        <span className="font-bold text-blue-700 text-lg">
                          {service.totalAttendance.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Visitors:</span>
                        <span className="px-3 py-1 rounded-full bg-[#F3CC3C] text-gray-900 font-bold">
                          {service.visitorCount}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleViewVisitors(service.id)}
                      className="w-full py-2 bg-gradient-to-r from-[#4b248c] to-[#0047AB] text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300"
                    >
                      View Visitor Details
                    </button>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Visitor Details Modal */}
      <AnimatePresence>
        {selectedService && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedService(null)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-[#4b248c] to-[#0047AB] px-6 py-4 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold text-white">Visitor Details</h3>
                  <p className="text-white/80 text-sm mt-1">
                    {services.find(s => s.id === selectedService) &&
                      format(services.find(s => s.id === selectedService)!.serviceDate, 'EEEE, MMMM d, yyyy')}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedService(null)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                {loadingVisitors ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : visitors.length === 0 ? (
                  <div className="text-center py-12">
                    <UserPlus className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg">No visitor details recorded</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {visitors.map((visitor, index) => (
                      <motion.div
                        key={visitor.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-gradient-to-r from-gray-50 to-white border-2 border-gray-100 rounded-xl p-4 hover:border-[#4b248c] transition-all duration-300"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#4b248c] to-[#0047AB] rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-gray-900 text-lg mb-1">
                              {visitor.visitorName || 'Anonymous'}
                            </div>
                            <div className="text-gray-600 mb-2">
                              {visitor.visitorContact || 'No contact provided'}
                            </div>
                            <div className="text-sm text-gray-500">
                              Visited: {format(visitor.visitDate, 'MMM d, yyyy')}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
