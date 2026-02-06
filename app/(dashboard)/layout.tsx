'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { OrganizationProvider } from '@/lib/OrganizationContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import DashboardTopBar from '@/components/dashboard/DashboardTopBar';
import MobileNavigation from '@/components/dashboard/MobileNavigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isMobileNavOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileNavOpen]);

  useEffect(() => {
    if (!isMobileNavOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileNavOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileNavOpen]);

  return (
    <ProtectedRoute>
      <OrganizationProvider>
        <div className="min-h-screen bg-gray-50">
          {isMobileNavOpen && (
            <button
              type="button"
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              aria-label="Close menu"
              onClick={() => setIsMobileNavOpen(false)}
            />
          )}

          <div
            id="mobile-dashboard-drawer"
            className={`fixed inset-y-0 left-0 z-50 w-[280px] bg-white border-r border-gray-200 transform transition-transform duration-200 lg:hidden ${
              isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
            role="dialog"
            aria-modal="true"
            aria-hidden={!isMobileNavOpen}
          >
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
              <span className="text-sm font-semibold text-gray-900">Menu</span>
              <button
                type="button"
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close menu"
                onClick={() => setIsMobileNavOpen(false)}
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <DashboardSidebar />
          </div>

          <div className="flex h-screen overflow-hidden">
            <aside className="hidden lg:flex lg:flex-shrink-0">
              <DashboardSidebar />
            </aside>

            <div className="flex flex-col flex-1 overflow-hidden">
              <DashboardTopBar
                onMenuClick={() => setIsMobileNavOpen(true)}
                isMenuOpen={isMobileNavOpen}
              />

              <main className="flex-1 overflow-y-auto bg-gray-50 p-4 lg:p-8 pb-20 lg:pb-8">
                <div className="max-w-7xl mx-auto">
                  {children}
                </div>
              </main>
            </div>
          </div>

          <MobileNavigation />
        </div>
      </OrganizationProvider>
    </ProtectedRoute>
  );
}
