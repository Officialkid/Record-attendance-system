'use client';

import { useEffect, useRef, useState } from 'react';
import { useOrganization } from '@/lib/OrganizationContext';
import { useAuth } from '@/lib/AuthContext';
import { Menu, Search, Bell, ChevronDown, MoreVertical } from 'lucide-react';
import MobileDrawer from './MobileDrawer';

interface DashboardTopBarProps {
  onMenuClick?: () => void;
  isMenuOpen?: boolean;
}

export default function DashboardTopBar({ onMenuClick, isMenuOpen }: DashboardTopBarProps) {
  const { currentOrg } = useOrganization();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showUserMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showUserMenu]);

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
  };

  ret>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Open menu"
              aria-controls="mobile-dashboard-drawer"
              aria-expanded={isMenuOpen ?? false}
              type="button"
              onClick={onMenuClick}
            >
              <Menu className="w-6 h-6 text-gray-600" />
              <Menu className="w-6 h-6 text-gray-600" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center lg:hidden">
              <span className="text-white font-bold text-sm">
                {currentOrg?.name.charAt(0)}
              </span>
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-gray-900 truncate">
                {currentOrg?.name || 'Loading...'}
              </h2>
              <p className="text-xs text-gray-500 hidden sm:block truncate">
                {currentOrg?.type}
              </p>
            </div>
          </div>
        </div>

        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search services, visitors..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled
            />
          </div>
          <span className="ml-2 text-xs text-gray-400 self-center">(Coming soon)</span>
        </div>

        <div className="flex items-center gap-2">
          {/* MOBILE DRAWER TRIGGER (SECONDARY MENU) */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Open secondary menu"
            type="button"
          >
            <MoreVertical className="w-5 h-5 text-gray-600" />
          </button>

          <button
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
            aria-label="Notifications"
            disabled
            type="button"
          >
            <Bell className="w-5 h-5 text-gray-400" />
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              type="button"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-xs">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>

              <span className="hidden sm:block text-sm font-medium text-gray-700">
                {user?.email?.split('@')[0]}
              </span>

              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                  <p className="text-xs text-gray-500">Free Plan</p>
                </div>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  type="button"
                >
                  Account Settings
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  type="button"
                >
                  Help & Support
                </button>
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    type="button"
                    onClick={handleLogout}

      {/* MOBILE DRAWER */}
      <MobileDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
