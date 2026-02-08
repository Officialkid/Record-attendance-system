'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import {
  Calendar,
  Users,
  UserPlus,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Edit2,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import type { Service as FirestoreService } from '@/lib/firestore-multitenant';
import { useOrganization } from '@/lib/OrganizationContext';

type Service = FirestoreService & {
  visitorCount?: number;
};

interface RecentActivityProps {
  services: Service[];
  onEdit: (service: Service) => void;
  onDelete: (serviceId: string) => void;
}

export default function RecentActivity({ services, onEdit, onDelete }: RecentActivityProps) {
  const { terminology } = useOrganization();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const getGrowth = (current: number, index: number) => {
    if (index >= services.length - 1) return null;
    const previous = services[index + 1].totalAttendance;
    return current - previous;
  };

  if (services.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent {terminology.Events}</h2>
        <EmptyState
          icon={Calendar}
          title={`No ${terminology.events.toLowerCase()} recorded yet`}
          description={`Start tracking your attendance to see recent ${terminology.events.toLowerCase()} here.`}
          action={
            <Link
              href="/add-attendance"
              className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded-lg transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Add Your First {terminology.Event}
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Recent {terminology.Events}</h2>
        <Link
          href="/view-analytics"
          className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {terminology.Event} Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Attendance
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {terminology.visitors}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Growth
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {services.map((service, index) => {
                const growth = getGrowth(service.totalAttendance, index);
                const isPositive = growth && growth > 0;
                const isMenuOpen = openMenuId === service.id;

                return (
                  <motion.tr
                    key={service.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3, ease: 'easeOut' }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {format(new Date(service.serviceDate), 'MMM d, yyyy')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(service.serviceDate), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700">
                        {service.eventType}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-900">
                          {service.totalAttendance}
                        </span>
                        <span className="text-xs text-gray-500">
                          {terminology.attendees.toLowerCase()}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">
                          {service.visitorCount ?? 0}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {growth !== null && growth !== 0 ? (
                        <div
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md ${
                            isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {isPositive ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          <span className="text-xs font-medium">
                            {isPositive ? '+' : ''}{growth}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="relative inline-block text-left">
                        <button
                          onClick={() => setOpenMenuId(isMenuOpen ? null : service.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          aria-label={`${terminology.Event} actions`}
                        >
                          <MoreVertical className="w-4 h-4 text-gray-500" />
                        </button>

                        {isMenuOpen && (
                          <div
                            className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border border-gray-200 z-10"
                            onMouseLeave={() => setOpenMenuId(null)}
                          >
                            <button
                              onClick={() => {
                                onEdit(service);
                                setOpenMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                              Edit {terminology.Event}
                            </button>
                            <button
                              onClick={() => {
                                onDelete(service.id);
                                setOpenMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete {terminology.Event}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-gray-200">
          {services.map((service, index) => {
            const growth = getGrowth(service.totalAttendance, index);
            const isPositive = growth && growth > 0;
            const isMenuOpen = openMenuId === service.id;

            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3, ease: 'easeOut' }}
                className="p-4"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {format(new Date(service.serviceDate), 'MMM d, yyyy')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(service.serviceDate), { addSuffix: true })}
                    </div>
                    <div className="mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700">
                        {service.eventType}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-semibold text-gray-900">
                        {service.totalAttendance}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <UserPlus className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">
                        {service.visitorCount ?? 0}
                      </span>
                    </div>
                  </div>

                  {growth !== null && growth !== 0 && (
                    <div
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md ${
                        isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {isPositive ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span className="text-xs font-medium">
                        {isPositive ? '+' : ''}{growth}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-end">
                  <div className="relative inline-block text-left">
                    <button
                      onClick={() => setOpenMenuId(isMenuOpen ? null : service.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      aria-label={`${terminology.Event} actions`}
                    >
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>

                    {isMenuOpen && (
                      <div
                        className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border border-gray-200 z-10"
                        onMouseLeave={() => setOpenMenuId(null)}
                      >
                        <button
                          onClick={() => {
                            onEdit(service);
                            setOpenMenuId(null);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit {terminology.Event}
                        </button>
                        <button
                          onClick={() => {
                            onDelete(service.id);
                            setOpenMenuId(null);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete {terminology.Event}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
