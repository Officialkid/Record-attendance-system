'use client';

import { useEffect, useRef, useState } from 'react';
import { useOrganization } from '@/lib/OrganizationContext';
import { useAuth } from '@/lib/AuthContext';
import { Menu, Search, ChevronDown, MoreVertical, Plus, Building2, Check } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import MobileDrawer from './MobileDrawer';
import AddOrganizationModal from '@/components/modals/AddOrganizationModal';
import NotificationBell from '@/components/NotificationBell';

interface DashboardTopBarProps {
  onMenuClick?: () => void;
  isMenuOpen?: boolean;
}

export default function DashboardTopBar({ onMenuClick, isMenuOpen }: DashboardTopBarProps) {
  const { currentOrg, organizations, switchOrganization, terminology } = useOrganization();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showOrgMenu, setShowOrgMenu] = useState(false);
  const [showAddOrgModal, setShowAddOrgModal] = useState(false);
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

  return (
    <>
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
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm lg:hidden">
                <Image
                  src="/icons/Logo.png"
                  alt="Insight Tracker"
                  width={24}
                  height={24}
                  className="w-6 h-6 object-contain"
                  unoptimized
                />
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

            {organizations.length > 0 && (
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setShowOrgMenu(!showOrgMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  type="button"
                >
                  <Building2 className="w-5 h-5 text-gray-600" />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">
                      {currentOrg?.name}
                    </p>
                    <p className="text-xs text-gray-500">{currentOrg?.type}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {showOrgMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowOrgMenu(false)}
                    />
                    <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                      <div className="p-2">
                        <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                          Your Organizations
                        </p>
                        {organizations.map((org) => (
                          <button
                            key={org.id}
                            onClick={() => {
                              switchOrganization(org.id);
                              setShowOrgMenu(false);
                            }}
                            className={`
                              w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors
                              ${currentOrg?.id === org.id
                                ? 'bg-purple-50 text-purple-700'
                                : 'hover:bg-gray-50 text-gray-700'
                              }
                            `}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{org.name}</p>
                              <p className="text-xs text-gray-500">{org.type}</p>
                            </div>
                            {currentOrg?.id === org.id && (
                              <Check className="w-5 h-5 text-purple-600 flex-shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>

                      <div className="border-t border-gray-200 p-2">
                        <button
                          onClick={() => {
                            setShowOrgMenu(false);
                            setShowAddOrgModal(true);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-purple-600 font-medium transition-colors"
                          type="button"
                        >
                          <Plus className="w-5 h-5" />
                          Add Organization
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${terminology.events.toLowerCase()}, ${terminology.visitors.toLowerCase()}...`}
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

          <NotificationBell />

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              type="button"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden">
                {user?.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt="Profile"
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-white font-semibold text-xs">
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-700">{currentOrg?.name || 'Organization'}</p>
                <p className="text-xs text-gray-500">{user?.email?.split('@')[0]}</p>
              </div>

              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{currentOrg?.name || 'Organization'}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <Link
                  href="/settings"
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex"
                  onClick={() => setShowUserMenu(false)}
                >
                  Account Settings
                </Link>
                <Link
                  href="/help"
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex"
                  onClick={() => setShowUserMenu(false)}
                >
                  Help & Support
                </Link>
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    type="button"
                    onClick={handleLogout}
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

      {/* MOBILE DRAWER */}
      <MobileDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      <AddOrganizationModal
        isOpen={showAddOrgModal}
        onClose={() => setShowAddOrgModal(false)}
        onSuccess={() => window.location.reload()}
      />
    </>
  );
}
