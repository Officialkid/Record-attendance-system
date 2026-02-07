'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, BarChart3, CalendarPlus, Home, LogOut, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import OrganizationSwitcher from '@/components/OrganizationSwitcher';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navLinks = [
    { href: '/dashboard', label: 'Home', icon: Home },
    { href: '/add-attendance', label: 'Add Attendance', icon: CalendarPlus },
    { href: '/view-analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const isActive = (href: string) => pathname === href;

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-nav-bg/80 backdrop-blur-md shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center space-x-2 group">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-royal-purple to-primary-blue rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
              <div className="relative bg-white px-3 py-2 rounded-lg">
                <span className="text-2xl font-bold bg-gradient-to-r from-royal-purple to-primary-blue bg-clip-text text-transparent">
                  Christhood
                </span>
              </div>
            </div>
          </Link>

          {/* Organization Switcher */}
          {user && (
            <div className="hidden md:flex items-center ml-6">
              <OrganizationSwitcher />
            </div>
          )}

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 group ${
                    isActive(link.href)
                      ? 'text-primary-blue'
                      : 'text-gray-700 hover:text-royal-purple'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                  {isActive(link.href) && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-primary-blue/10 rounded-lg"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}

            {/* Auth Buttons - Desktop */}
            {user ? (
              <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-200">
                <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700">
                  <User className="w-4 h-4" />
                  <span className="hidden lg:inline">{user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-royal-purple to-primary-blue rounded-lg hover:shadow-lg transition-all duration-300"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-200">
                <Link
                  href="/sign-in"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-royal-purple transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-royal-purple to-primary-blue rounded-lg hover:shadow-lg transition-all duration-300"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white/95 backdrop-blur-md border-t border-gray-200"
          >
            <div className="px-4 py-4 space-y-2">
              {user && (
                <div className="mb-4">
                  <OrganizationSwitcher />
                </div>
              )}
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                      isActive(link.href)
                        ? 'bg-primary-blue/10 text-primary-blue'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}

              {/* Auth Buttons - Mobile */}
              <div className="pt-4 border-t border-gray-200 space-y-2">
                {user ? (
                  <>
                    <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700">
                      <User className="w-4 h-4" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-royal-purple to-primary-blue rounded-lg hover:shadow-lg transition-all duration-300"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/sign-in"
                      onClick={() => setIsOpen(false)}
                      className="block w-full px-4 py-3 text-center text-sm font-medium text-gray-700 border-2 border-gray-300 rounded-lg hover:border-royal-purple hover:text-royal-purple transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/sign-up"
                      onClick={() => setIsOpen(false)}
                      className="block w-full px-4 py-3 text-center text-sm font-medium text-white bg-gradient-to-r from-royal-purple to-primary-blue rounded-lg hover:shadow-lg transition-all duration-300"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
