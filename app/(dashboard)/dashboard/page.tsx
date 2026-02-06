'use client';

import { useEffect, useState } from 'react';
import { useOrganization } from '@/lib/OrganizationContext';
import { useAuth } from '@/lib/AuthContext';
import { getServicesByMonth, getMonthlyStats, type Service, type MonthlyStats } from '@/lib/firestore-multitenant';
import { format } from 'date-fns';
import StatCard from '@/components/dashboard/StatCard';
import QuickActions from '@/components/dashboard/QuickActions';
import RecentActivity from '@/components/dashboard/RecentActivity';
import MiniTrendChart from '@/components/dashboard/MiniTrendChart';
import { Users, TrendingUp, Calendar, Sparkles } from 'lucide-react';

export default function DashboardPage() {
  const { currentOrg } = useOrganization();
  const { user } = useAuth();
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [recentServices, setRecentServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  useEffect(() => {
    if (currentOrg) {
      loadDashboardData();
    }
  }, [currentOrg]);

  const loadDashboardData = async () => {
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
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
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
          Here's what's happening with {currentOrg?.name}
        </p>
      </div>

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
