'use client';

import { useOrganization } from '@/lib/OrganizationContext';
import { useEffect, useState, useCallback } from 'react';
import { getServicesByMonth, getMonthlyStats } from '@/lib/firestore-multitenant';
import MonthlyAttendanceChart from '@/components/charts/MonthlyAttendanceChart';
import { StatCardSkeleton, ChartSkeleton, TableSkeleton } from '@/components/ui/LoadingSkeletons';
import { Calendar, Users, TrendingUp, Sparkles, CalendarX, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

interface Stats {
  totalServices: number;
  totalAttendance: number;
  totalVisitors: number;
  avgAttendance: number;
}

interface Service {
  id: string;
  serviceDate: Date;
  serviceType: string;
  totalAttendance: number;
  visitorCount: number;
}

interface OverviewTabProps {
  month: number;
  year: number;
}

export default function OverviewTab({ month, year }: OverviewTabProps) {
  const { currentOrg } = useOrganization();
  const [stats, setStats] = useState<Stats | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [indexRequired, setIndexRequired] = useState(false);

  const loadData = useCallback(async () => {
    if (!currentOrg) return;

    setLoading(true);
    try {
      const [statsData, servicesData] = await Promise.all([
        getMonthlyStats(currentOrg.id, month, year),
        getServicesByMonth(currentOrg.id, month, year),
      ]);

      setStats(statsData);
      // Ensure visitorCount is always a number
      const normalizedServices: Service[] = servicesData.map((service) => ({
        id: service.id,
        serviceDate: service.serviceDate,
        serviceType: service.serviceType,
        totalAttendance: service.totalAttendance,
        visitorCount: service.visitorCount ?? 0,
      }));
      setServices(normalizedServices);
    } catch (error) {
      console.error('Error loading overview data:', error);
      if ((error as { message?: string }).message === 'INDEX_REQUIRED') {
        setIndexRequired(true);
      }
      toast.error('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentOrg, month, year]);

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const firebaseIndexesUrl = projectId
    ? `https://console.firebase.google.com/project/${projectId}/firestore/indexes`
    : 'https://console.firebase.google.com/';

  useEffect(() => {
    if (currentOrg) {
      loadData();
    }
  }, [currentOrg, loadData]);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        {/* Chart Skeleton */}
        <ChartSkeleton />
        {/* Table Skeleton */}
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {indexRequired && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Firestore index required</p>
              <p className="text-sm text-amber-800 mt-1">
                Create the composite index for services on organizationId and serviceDate to load analytics.
              </p>
              <Link
                href={firebaseIndexesUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center mt-3 text-sm font-semibold text-amber-900 hover:text-amber-700"
              >
                Open Firebase Indexes
              </Link>
            </div>
          </div>
        </div>
      )}
      
      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Services */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {stats?.totalServices || 0}
          </div>
          <div className="text-sm text-gray-600">Total Services</div>
        </div>

        {/* Total Attendance */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {stats?.totalAttendance.toLocaleString() || 0}
          </div>
          <div className="text-sm text-gray-600">Total Attendance</div>
        </div>

        {/* Average Attendance */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {stats?.avgAttendance || 0}
          </div>
          <div className="text-sm text-gray-600">Average per Service</div>
        </div>

        {/* New Visitors */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {stats?.totalVisitors || 0}
          </div>
          <div className="text-sm text-gray-600">New Visitors</div>
        </div>

      </div>

      {/* MONTHLY CHART */}
      {services.length > 0 && (
        <MonthlyAttendanceChart 
          services={services}
          selectedMonth={month}
          selectedYear={year}
        />
      )}

      {/* SERVICE LIST */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Services</h3>
          <p className="text-sm text-gray-600 mt-1">
            Service records for this period
          </p>
        </div>

        {services.length === 0 ? (
          // Empty State
          <div className="p-12 text-center">
            <CalendarX className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              No Services Recorded
            </h4>
            <p className="text-gray-600 mb-6">
              No attendance records found for this period.
            </p>
            <Link
              href="/add-attendance"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
            >
              <Calendar className="w-4 h-4" />
              Add First Service
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Service Type
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Attendance
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Visitors
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {services.map((service) => (
                    <tr key={service.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {format(service.serviceDate, 'EEEE, MMM d')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(service.serviceDate, 'h:mm a')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {service.serviceType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-semibold text-gray-900">
                          {service.totalAttendance.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                          {service.visitorCount}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden p-4 space-y-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="bg-gray-50 rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {format(service.serviceDate, 'EEEE, MMM d')}
                      </div>
                      <div className="text-sm text-gray-600">
                        {format(service.serviceDate, 'h:mm a')}
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {service.serviceType}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Attendance</div>
                      <div className="font-bold text-gray-900">
                        {service.totalAttendance.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Visitors</div>
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                        {service.visitorCount}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

    </div>
  );
}
