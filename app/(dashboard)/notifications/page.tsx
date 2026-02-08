'use client';

import { useEffect, useState } from 'react';
import { Bell, Sparkles, Megaphone, Wrench } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import {
  NOTIFICATIONS,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
  isRead,
} from '@/lib/notifications';
import UpdatesAndFeedbackTab from '@/components/updates/UpdatesAndFeedbackTab';

export default function NotificationsPage() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [readIds, setReadIds] = useState<string[]>([]);

  useEffect(() => {
    setUnreadCount(getUnreadCount());
    setReadIds(JSON.parse(localStorage.getItem('readNotifications') || '[]'));
  }, []);

  const handleMarkAllRead = () => {
    markAllAsRead();
    setUnreadCount(0);
    setReadIds(NOTIFICATIONS.map((n) => n.id));
  };

  const handleNotificationClick = (notifId: string) => {
    markAsRead(notifId);
    setUnreadCount(getUnreadCount());
    setReadIds(JSON.parse(localStorage.getItem('readNotifications') || '[]'));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'feature':
        return <Sparkles className="w-5 h-5 text-purple-600" />;
      case 'update':
        return <Bell className="w-5 h-5 text-blue-600" />;
      case 'announcement':
        return <Megaphone className="w-5 h-5 text-green-600" />;
      case 'maintenance':
        return <Wrench className="w-5 h-5 text-yellow-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'feature':
        return 'bg-purple-100 text-purple-800';
      case 'update':
        return 'bg-blue-100 text-blue-800';
      case 'announcement':
        return 'bg-green-100 text-green-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <nav className="text-sm text-gray-500 mb-2">
          <span>Dashboard</span>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">Notifications</span>
        </nav>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
        <p className="text-gray-600">
          All product updates, announcements, and important notices in one place.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">What&apos;s New</h2>
            <p className="text-sm text-gray-600">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              type="button"
            >
              Mark all read
            </button>
          )}
        </div>

        {NOTIFICATIONS.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {NOTIFICATIONS.map((notif) => {
              const read = readIds.includes(notif.id) || isRead(notif.id);

              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif.id)}
                  className={`
                    p-4 hover:bg-gray-50 transition-colors cursor-pointer relative
                    ${!read ? 'bg-purple-50/50' : ''}
                  `}
                >
                  {!read && (
                    <div className="absolute top-4 left-2 w-2 h-2 bg-purple-600 rounded-full" />
                  )}

                  <div className="flex gap-3 ml-3">
                    <div
                      className={`
                        w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                        ${getTypeColor(notif.type)}
                      `}
                    >
                      {getIcon(notif.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 text-sm">
                          {notif.title}
                        </h4>
                        <span
                          className={`
                            px-2 py-0.5 text-xs font-semibold rounded uppercase
                            ${getTypeColor(notif.type)}
                          `}
                        >
                          {notif.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2 leading-relaxed">
                        {notif.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(notif.date), { addSuffix: true })}
                        </p>
                        {notif.link && (
                          <Link
                            href={notif.link}
                            onClick={() => setUnreadCount(getUnreadCount())}
                            className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                          >
                            Learn more {'>'}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <Link
            href="/help?tab=updates"
            className="block text-center text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            Need help? Go to Help & Support {'>'}
          </Link>
        </div>
      </div>

      <UpdatesAndFeedbackTab />
    </div>
  );
}
