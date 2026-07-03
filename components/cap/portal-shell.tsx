'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Bell, ChevronLeft, ChevronRight, Menu, ShieldCheck, X } from 'lucide-react';

import { PortalNav } from '@/components/cap/portal-nav';
import { cn } from '@/lib/cap/utils';

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

export function PortalShell({
  children,
  role,
  systemRole,
  greeting,
  name,
  email,
  departmentCount,
  unreadNotificationsCount,
  pendingApprovalsCount,
  avatarUrl,
}: {
  children: React.ReactNode;
  role: 'admin' | 'leader' | 'member';
  systemRole: 'main_admin' | 'chief_admin' | 'none';
  greeting: string;
  name: string;
  email: string;
  departmentCount: number;
  unreadNotificationsCount: number;
  pendingApprovalsCount: number;
  avatarUrl: string | null;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const canAccessAdmin =
    systemRole === 'main_admin' || systemRole === 'chief_admin' || role === 'admin' || role === 'leader';

  useEffect(() => {
    const stored = window.localStorage.getItem('cap-sidebar-collapsed');
    if (stored === 'true') {
      setCollapsed(true);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem('cap-sidebar-collapsed', collapsed ? 'true' : 'false');
  }, [collapsed]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#efe7ff_0%,#faf7ff_28%,#f7f2ff_100%)] lg:grid lg:grid-cols-[auto_1fr]">
      <div className="hidden lg:block">
        <div className={cn('sticky top-0 h-screen transition-[width] duration-200', collapsed ? 'w-[92px]' : 'w-[290px]')}>
          <PortalNav
            role={role}
            systemRole={systemRole}
            collapsed={collapsed}
            unreadNotificationsCount={unreadNotificationsCount}
            pendingApprovalsCount={pendingApprovalsCount}
          />
          <button
            type="button"
            onClick={() => setCollapsed((current) => !current)}
            className="absolute right-3 top-6 flex h-9 w-9 items-center justify-center rounded-full border border-[#ffffff30] bg-[#ffffff18] text-white backdrop-blur-sm"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="lg:hidden">
        <div className="sticky top-0 z-40 flex items-center justify-between border-b border-[#ddd3f0] bg-white/90 px-4 py-3 backdrop-blur">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#ddd3f0] bg-[#fbf9fe] text-[#341765]"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#C9A461]">CAP</p>
            <p className="text-sm font-semibold text-[#241c33]">{name}</p>
          </div>

          <Link
            href="/notifications"
            className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-[#ddd3f0] bg-[#fbf9fe] text-[#341765]"
          >
            <Bell className="h-5 w-5" />
            {unreadNotificationsCount > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#fff3d6] px-1.5 text-[10px] font-semibold text-[#7a5a12]">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            ) : null}
          </Link>
        </div>

        {mobileOpen ? (
          <div className="fixed inset-0 z-50 bg-[#1e103d]/55 backdrop-blur-sm">
            <div className="absolute left-0 top-0 h-full w-[86vw] max-w-[320px]">
              <PortalNav
                role={role}
                systemRole={systemRole}
                unreadNotificationsCount={unreadNotificationsCount}
                pendingApprovalsCount={pendingApprovalsCount}
                onNavigate={() => setMobileOpen(false)}
              />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-5 flex h-9 w-9 items-center justify-center rounded-full border border-[#ffffff30] bg-[#ffffff18] text-white"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <button type="button" className="absolute inset-0 -z-10" onClick={() => setMobileOpen(false)} aria-label="Close menu overlay" />
          </div>
        ) : null}
      </div>

      <main className="px-4 py-5 sm:px-5 sm:py-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8 rounded-[28px] border border-[#ddd3f0] bg-white px-5 py-5 shadow-sm sm:px-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Christhood Accountability Platform</p>
                <h1 className="mt-2 text-3xl font-semibold text-[#241c33]">{greeting}, {name}.</h1>
                <p className="mt-3 text-sm text-[#5f5673]">
                  You&apos;re inside the ministry operations portal with{' '}
                  <span className="font-semibold text-[#241c33]">{systemRole !== 'none' ? systemRole : role}</span>{' '}
                  access.
                </p>
                <p className="mt-2 text-sm text-[#7a7190]">Signed in as {email}</p>
                <p className="mt-4 max-w-2xl text-sm text-[#5f5673]">
                  Use Weekly Record for new submissions, Records for history, Insights for trends, Meetings for follow-up, and Notifications for ministry updates.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/notifications"
                  className="inline-flex items-center gap-2 rounded-2xl border border-[#e6def4] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33]"
                >
                  <Bell className="h-4 w-4 text-[#4B248C]" />
                  <span>Updates</span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-[#4B248C]">
                    {unreadNotificationsCount}
                  </span>
                </Link>

                {canAccessAdmin ? (
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-2 rounded-2xl border border-[#eadfb8] bg-[#fff8eb] px-4 py-3 text-sm text-[#241c33]"
                  >
                    <ShieldCheck className="h-4 w-4 text-[#b6841a]" />
                    <span>Invites</span>
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-[#7a5a12]">
                      {pendingApprovalsCount}
                    </span>
                  </Link>
                ) : null}

                <Link href="/settings/profile" className="inline-flex items-center gap-3 rounded-2xl border border-[#e6def4] bg-white px-4 py-3">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt={name} className="h-10 w-10 rounded-2xl object-cover" />
                  ) : (
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ede7f7] text-sm font-semibold text-[#4B248C]">
                      {initials(name)}
                    </span>
                  )}
                  <span className="text-left">
                    <span className="block text-sm font-semibold text-[#241c33]">{name}</span>
                    <span className="block text-xs text-[#7a7190]">Departments assigned: {departmentCount}</span>
                  </span>
                </Link>
              </div>
            </div>
          </header>

          {children}
        </div>
      </main>
    </div>
  );
}
