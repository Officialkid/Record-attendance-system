export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'feature' | 'update' | 'announcement' | 'maintenance';
  date: string; // ISO date
  read: boolean;
  link?: string;
}

export const NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-003',
    title: 'PWA Support Added',
    message: 'You can now install Insight Tracker on your phone like a native app. Look for the install prompt or use your browser menu.',
    type: 'feature',
    date: '2026-02-09T10:00:00Z',
    read: false,
    link: '/help',
  },
  {
    id: 'notif-002',
    title: 'Edit & Delete Events Now Available',
    message: 'You can now edit past event records or delete them if needed. Just click the menu button next to any event in your dashboard or analytics.',
    type: 'feature',
    date: '2026-02-08T14:00:00Z',
    read: false,
  },
  {
    id: 'notif-001',
    title: 'Visitor Directory Launched',
    message: 'Access all visitor information in one place! Search, filter, and export contact details from the new Visitors page in your sidebar.',
    type: 'feature',
    date: '2026-02-08T10:00:00Z',
    read: false,
  },
];

export function getUnreadCount(): number {
  const readNotifs = JSON.parse(localStorage.getItem('readNotifications') || '[]');
  return NOTIFICATIONS.filter((n) => !readNotifs.includes(n.id)).length;
}

export function markAsRead(notificationId: string) {
  const readNotifs = JSON.parse(localStorage.getItem('readNotifications') || '[]');
  if (!readNotifs.includes(notificationId)) {
    readNotifs.push(notificationId);
    localStorage.setItem('readNotifications', JSON.stringify(readNotifs));
  }
}

export function markAllAsRead() {
  const allIds = NOTIFICATIONS.map((n) => n.id);
  localStorage.setItem('readNotifications', JSON.stringify(allIds));
}

export function isRead(notificationId: string): boolean {
  const readNotifs = JSON.parse(localStorage.getItem('readNotifications') || '[]');
  return readNotifs.includes(notificationId);
}
