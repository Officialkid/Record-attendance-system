'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  BarChart3,
  Bell,
  BookCopy,
  BookOpenText,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Settings2,
  ShieldCheck,
} from 'lucide-react';

import { cn } from '@/lib/cap/utils';

const links = [
  { href: '/dashboard', label: 'Dashboard', description: 'Overview and next steps', icon: LayoutDashboard },
  { href: '/records/new', label: 'Weekly Record', description: 'Submit a new weekly entry', icon: ClipboardList, accent: 'amber' as const },
  { href: '/records', label: 'Records', description: 'Browse record history', icon: BookCopy, accent: 'lilac' as const },
  { href: '/insights', label: 'Insights', description: 'See trends and anomalies', icon: BarChart3 },
  { href: '/meetings', label: 'Meetings', description: 'Track decisions and follow-up', icon: CalendarDays },
  { href: '/programs', label: 'Programs', description: 'Events, ledgers, and reconciliation', icon: CalendarDays },
  { href: '/leadership', label: 'Leadership', description: 'Read-only cross-platform visibility', icon: BarChart3 },
  { href: '/notifications', label: 'Notifications', description: 'Reminders and updates', icon: Bell },
  { href: '/docs', label: 'Setup Docs', description: 'Environment and launch notes', icon: BookOpenText },
  { href: '/admin', label: 'Admin', description: 'Users, roles, and departments', icon: ShieldCheck },
  { href: '/settings/profile', label: 'Profile', description: 'Your access and account', icon: Settings2 },
] as const;

function isLinkActive(pathname: string, href: string) {
  if (href === '/records') {
    return pathname === '/records' || (pathname.startsWith('/records/') && !pathname.startsWith('/records/new'));
  }

  if (href === '/records/new') {
    return pathname === '/records/new';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PortalNav({
  role,
  systemRole,
  collapsed = false,
  onNavigate,
  pendingApprovalsCount = 0,
  unreadNotificationsCount = 0,
  hasLeadershipAccess = false,
}: {
  role: 'admin' | 'leader' | 'member';
  systemRole: 'main_admin' | 'chief_admin' | 'none';
  collapsed?: boolean;
  onNavigate?: () => void;
  pendingApprovalsCount?: number;
  unreadNotificationsCount?: number;
  hasLeadershipAccess?: boolean;
}) {
  const pathname = usePathname();
  const canAccessAdmin =
    systemRole === 'main_admin' || systemRole === 'chief_admin' || role === 'admin' || role === 'leader';
  const canAccessSetupDocs = systemRole === 'main_admin' || systemRole === 'chief_admin';
  const canAccessLeadership = canAccessAdmin || hasLeadershipAccess;

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden border-r border-[#3d1f72] bg-[linear-gradient(180deg,#341765_0%,#4B248C_62%,#5b32a3_100%)] px-3 py-5 text-white">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
        <div className={cn('mb-6 rounded-3xl border border-[#ffffff1f] bg-[#ffffff12] backdrop-blur-sm', collapsed ? 'px-3 py-4' : 'p-4')}>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#C9A461]">C.I.O.M.</p>
          <h1 className="mt-2 text-xl font-semibold">CIOM Portal</h1>
          {!collapsed ? (
            <p className="mt-2 text-sm text-[#efe7ff]">
              One place for ministry-wide records, meetings, invites, and oversight.
            </p>
          ) : null}
        </div>

        <nav className="space-y-2 pb-4">
          {links.map((link) => {
            if (link.href === '/admin' && !canAccessAdmin) {
              return null;
            }

            if (link.href === '/docs' && !canAccessSetupDocs) {
              return null;
            }

            if (link.href === '/leadership' && !canAccessLeadership) {
              return null;
            }

            const Icon = link.icon;
            const active = isLinkActive(pathname, link.href);
            const badgeCount =
              link.href === '/notifications'
                ? unreadNotificationsCount
                : link.href === '/admin'
                  ? pendingApprovalsCount
                  : 0;

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onNavigate}
                title={collapsed ? link.label : undefined}
                className={cn(
                  'group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition-colors',
                  collapsed && 'justify-center',
                  active
                    ? link.href === '/records/new'
                      ? 'bg-[#C9A461] text-[#341765]'
                      : link.href === '/records'
                        ? 'bg-[#efe7ff] text-[#341765]'
                        : 'bg-[#ffffff1f] text-white'
                    : 'text-[#f3ecff] hover:bg-[#ffffff14] hover:text-white'
                )}
              >
                <div
                  className={cn(
                    'relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
                    active
                      ? link.href === '/records/new'
                        ? 'bg-[#ffffff66]'
                        : link.href === '/records'
                          ? 'bg-[#ffffff]'
                          : 'bg-[#ffffff14]'
                      : 'bg-[#ffffff12]'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {badgeCount > 0 ? (
                    <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#fff3d6] px-1.5 text-[10px] font-semibold text-[#7a5a12]">
                      {badgeCount > 9 ? '9+' : badgeCount}
                    </span>
                  ) : null}
                </div>

                {!collapsed ? (
                  <span className="min-w-0">
                    <span className="block font-medium">{link.label}</span>
                    <span className={cn('block text-xs', active ? 'text-current/80' : 'text-[#d8c9f4]')}>
                      {link.description}
                    </span>
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: '/login' })}
        className={cn(
          'mt-4 flex shrink-0 items-center gap-3 rounded-2xl border border-[#ffffff26] px-3 py-3 text-sm text-white transition-colors hover:bg-[#ffffff14]',
          collapsed && 'justify-center'
        )}
        title={collapsed ? 'Sign out' : undefined}
      >
        <LogOut className="h-4 w-4 shrink-0" />
        {!collapsed ? <span>Sign out</span> : null}
      </button>
    </aside>
  );
}
