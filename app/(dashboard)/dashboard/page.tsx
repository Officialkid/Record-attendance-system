'use client';

import { useCallback, useEffect, useState } from 'react';
import { useOrganization } from '@/lib/OrganizationContext';
import { useAuth } from '@/lib/AuthContext';
import { getServicesByMonth, getMonthlyStats, type Service, type MonthlyStats } from '@/lib/firestore-multitenant';
import { format } from 'date-fns';
import StatCard from '@/components/dashboard/StatCard';
import QuickActions from '@/components/dashboard/QuickActions';
import RecentActivity from '@/components/dashboard/RecentActivity';
import MiniTrendChart from '@/components/dashboard/MiniTrendChart';
import { StatCardSkeleton, QuickActionsSkeleton, TableSkeleton, ChartSkeleton, PageHeaderSkeleton } from '@/components/ui/LoadingSkeletons';
import { Users, TrendingUp, Calendar, Sparkles, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { currentOrg } = useOrganization();
  const { user } = useAuth();
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [recentServices, setRecentServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [indexRequired, setIndexRequired] = useState(false);

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const loadDashboardData = useCallback(async () => {
    if (!currentOrg) return;

    setLoading(true);
    try {
      const [monthStats, services] = await Promise.all([
        getMonthlyStats(currentOrg.id, currentMonth, currentYear),
        getServicesByMonth(currentOrg.id, currentMonth, currentYear),
      ]);

      setStats(monthStats);
      setRecentServices(services.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      if ((error as { message?: string }).message === 'INDEX_REQUIRED') {
        setIndexRequired(true);
      }
    } finally {
      setLoading(false);
    }
  }, [currentOrg, currentMonth, currentYear]);

  useEffect(() => {
    if (currentOrg) {
      loadDashboardData();
    }
  }, [currentOrg, loadDashboardData]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const lastService = recentServices[0];
  const lastServiceDate = lastService
    ? format(new Date(lastService.serviceDate), 'MMM d, yyyy')
    : 'No services yet';

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const firebaseIndexesUrl = projectId
    ? `https://console.firebase.google.com/project/${projectId}/firestore/indexes`
    : 'https://console.firebase.google.com/';

  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeaderSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <QuickActionsSkeleton />
        <TableSkeleton />
        <ChartSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {getGreeting()}, {user?.email?.split('@')[0]}! 👋
        </h1>
        <p className="text-gray-600 mt-2">
          Here&apos;s what&apos;s happening with {currentOrg?.name}
        </p>
      </div>

      {indexRequired && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Firestore index required</p>
              <p className="text-sm text-amber-800 mt-1">
                Create the composite index for services on organizationId and serviceDate to load monthly stats.
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Last Service"
          value={lastService?.totalAttendance || 0}
          subtitle={lastServiceDate}
          icon={Users}
          trend={null}
          color="purple"
        />

        <StatCard
          title="Total Services"
          value={stats?.totalServices || 0}
          subtitle="This month"
          icon={Calendar}
          trend={null}
          color="blue"
        />

        <StatCard
          title="Monthly Average"
          value={stats?.avgAttendance || 0}
          subtitle="Average attendance"
          icon={TrendingUp}
          trend={null}
          color="green"
        />

        <StatCard
          title="New Visitors"
          value={stats?.totalVisitors || 0}
          subtitle="This month"
          icon={Sparkles}
          trend={null}
          color="gold"
        />
      </div>

      <QuickActions />

      <RecentActivity services={recentServices} />

      <MiniTrendChart services={recentServices} />
    </div>
  );
}
