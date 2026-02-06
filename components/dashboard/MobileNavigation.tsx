'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Plus, BarChart3, Settings } from 'lucide-react';

export default function MobileNavigation() {
  const pathname = usePathname();

  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Add',
      href: '/add-attendance',
      icon: Plus,
      highlight: true,
    },
    {
      name: 'Analytics',
      href: '/view-analytics',
      icon: BarChart3,
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
    },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg min-w-[64px] ${
                item.highlight ? 'relative' : ''
              } ${
                active && !item.highlight
                  ? 'text-[#4b248c]'
                  : active && item.highlight
                    ? 'text-white'
                    : 'text-gray-600'
              }`}
            >
              {item.highlight ? (
                <div
                  className={`absolute -top-4 w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${
                    active
                      ? 'bg-gradient-to-br from-purple-600 to-blue-600'
                      : 'bg-gradient-to-br from-yellow-400 to-yellow-500'
                  }`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
              ) : (
                <>
                  <Icon className={`w-6 h-6 ${active ? 'stroke-[2.5]' : ''}`} />
                  <span className="text-xs font-medium">{item.name}</span>
                </>
              )}

              {item.highlight && (
                <span className="text-xs font-medium mt-3">{item.name}</span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
