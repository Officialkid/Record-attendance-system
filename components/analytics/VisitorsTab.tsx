'use client';

import { useEffect, useState, useCallback } from 'react';
import { useOrganization } from '@/lib/OrganizationContext';
import { 
  getServicesByMonth, 
  getVisitorsForService 
} from '@/lib/firestore-multitenant';
import { 
  UserPlus, 
  Users, 
  TrendingUp,
  Mail,
  Phone,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

interface VisitorsTabProps {
  month: number;
  year: number;
}

interface VisitorData {
  id: string;
  visitorName: string | null;
  visitorContact: string | null;
  visitDate: Date;
  serviceId: string;
  serviceDate: Date;
  eventType: string;
}

interface VisitorSummary {
  id: string;
  name: string | null;
  contact: string | null;
  firstVisit: Date;
  visitCount: number;
  lastVisit: Date;
}

interface VisitorStats {
  totalVisitors: number;
  withContact: number;
  contactRate: number;
  weeklyData: WeeklyData[];
}

interface WeeklyData {
  week: string;
  count: number;
}

interface PieData {
  name: string;
  value: number;
}

export default function VisitorsTab({ month, year }: VisitorsTabProps) {
  const { currentOrg, terminology } = useOrganization();
  const [visitors, setVisitors] = useState<VisitorData[]>([]);
  const [visitorSummaries, setVisitorSummaries] = useState<VisitorSummary[]>([]);
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [loading, setLoading] = useState(true);

  const calculateStats = useCallback((visitors: VisitorData[]) => {
    const totalVisitors = visitors.length;
    
    // Visitors with contact info
    const withContact = visitors.filter(v => v.visitorContact).length;
    const contactRate = totalVisitors > 0 ? (withContact / totalVisitors) * 100 : 0;

    // Count by week (for trend)
    const weeklyCount: { [key: string]: number } = {};
    visitors.forEach(v => {
      const week = format(new Date(v.visitDate), 'MMM d');
      weeklyCount[week] = (weeklyCount[week] || 0) + 1;
    });

    const weeklyData: WeeklyData[] = Object.entries(weeklyCount).map(([week, count]) => ({
      week,
      count,
    }));

    setStats({
      totalVisitors,
      withContact,
      contactRate,
      weeklyData,
    });
  }, []);

  const createVisitorSummaries = useCallback((visitors: VisitorData[]) => {
    // Group visitors by contact or name
    const grouped: { [key: string]: VisitorData[] } = {};
    
    visitors.forEach(v => {
      const key = v.visitorContact || v.visitorName || 'unknown';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(v);
    });

    const summaries: VisitorSummary[] = Object.entries(grouped).map(([key, visits]) => {
      const sorted = visits.sort((a, b) => 
        new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime()
      );

      return {
        id: key,
        name: sorted[0].visitorName,
        contact: sorted[0].visitorContact,
        firstVisit: sorted[0].visitDate,
        visitCount: visits.length,
        lastVisit: sorted[sorted.length - 1].visitDate,
      };
    }).filter(s => s.id !== 'unknown');

    // Sort by visit count (returning visitors first)
    summaries.sort((a, b) => b.visitCount - a.visitCount);
    
    setVisitorSummaries(summaries);
  }, []);

  const loadVisitorData = useCallback(async () => {
    if (!currentOrg) return;

    setLoading(true);
    try {
      // Get all services for the period
      const services = await getServicesByMonth(currentOrg.id, month, year);

      // Get all visitors from all services
      const allVisitors: VisitorData[] = [];
      
      for (const service of services) {
        const serviceVisitors = await getVisitorsForService(service.id);
        
        serviceVisitors.forEach((visitor) => {
          allVisitors.push({
            id: visitor.id,
            visitorName: visitor.visitorName,
            visitorContact: visitor.visitorContact,
            visitDate: visitor.visitDate,
            serviceId: service.id,
            serviceDate: service.serviceDate,
            eventType: service.eventType || 'Event',
          });
        });
      }

      setVisitors(allVisitors);
      
      // Calculate statistics
      calculateStats(allVisitors);
      
      // Create visitor summaries (group by contact/name)
      createVisitorSummaries(allVisitors);
    } catch (error) {
      console.error('Error loading visitor data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentOrg, month, year, calculateStats, createVisitorSummaries]);

  useEffect(() => {
    if (currentOrg) {
      loadVisitorData();
    }
  }, [currentOrg, loadVisitorData]);

  // Chart colors
  const COLORS = ['#4b248c', '#0047AB', '#F3CC3C', '#10b981'];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Calculate new vs returning
  const newVisitors = visitorSummaries.filter(v => v.visitCount === 1).length;
  const returningVisitors = visitorSummaries.filter(v => v.visitCount > 1).length;

  const pieData: PieData[] = [
    { name: 'New', value: newVisitors },
    { name: 'Returning', value: returningVisitors },
  ];

  return (
    <div className="space-y-6">
      
      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Visitors */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">
                {stats?.totalVisitors || 0}
              </p>
              <p className="text-sm text-gray-600">
                Total {terminology.visitors}
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            This period
          </div>
        </div>

        {/* Contact Rate */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">
                {stats?.contactRate.toFixed(0)}%
              </p>
              <p className="text-sm text-gray-600">
                Contact Info Collected
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {stats?.withContact} of {stats?.totalVisitors} visitors
          </div>
        </div>

        {/* Returning Rate */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">
                {visitorSummaries.length > 0 
                  ? ((returningVisitors / visitorSummaries.length) * 100).toFixed(0)
                  : 0}%
              </p>
              <p className="text-sm text-gray-600">
                Return Rate
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {returningVisitors} returning visitors
          </div>
        </div>

      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* NEW VS RETURNING PIE */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            New vs Returning
          </h2>
          {pieData.every(d => d.value === 0) ? (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No visitor data available
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => {
                      const safePercent = (percent ?? 0) * 100;
                      return `${name}: ${safePercent.toFixed(0)}%`;
                    }}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{newVisitors}</p>
              <p className="text-sm text-gray-600">New</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{returningVisitors}</p>
              <p className="text-sm text-gray-600">Returning</p>
            </div>
          </div>
        </div>

        {/* WEEKLY TREND */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            {terminology.visitors} by Week
          </h2>
          {!stats?.weeklyData || stats.weeklyData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No weekly data available
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="week" 
                    stroke="#6b7280"
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <Tooltip />
                  <Bar dataKey="count" fill="#4b248c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>

      {/* TOP RETURNING VISITORS */}
      {returningVisitors > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Returning {terminology.visitors}
              </h2>
              <p className="text-sm text-gray-600">
                People who visited multiple times
              </p>
            </div>
            <Link
              href="/visitors"
              className="text-sm text-purple-600 hover:text-purple-700 font-medium inline-flex items-center gap-1"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="divide-y divide-gray-200">
            {visitorSummaries
              .filter(v => v.visitCount > 1)
              .slice(0, 10)
              .map((visitor) => (
                <div key={visitor.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {visitor.name || 'Anonymous'}
                          </p>
                          {visitor.contact && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              {visitor.contact.includes('@') ? (
                                <Mail className="w-3 h-3" />
                              ) : (
                                <Phone className="w-3 h-3" />
                              )}
                              <span>{visitor.contact}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          First: {format(new Date(visitor.firstVisit), 'MMM d')}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Last: {format(new Date(visitor.lastVisit), 'MMM d')}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                        {visitor.visitCount} visits
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {returningVisitors > 10 && (
            <div className="p-4 bg-gray-50 text-center">
              <Link
                href="/visitors"
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                View all {returningVisitors} returning visitors →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* EMPTY STATE */}
      {visitors.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No {terminology.visitors} Yet
          </h3>
          <p className="text-gray-600 mb-6">
            Start collecting visitor information when recording {terminology.events.toLowerCase()}.
          </p>
          <Link
            href="/add-attendance"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
          >
            Record {terminology.Event}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      )}

    </div>
  );
}
