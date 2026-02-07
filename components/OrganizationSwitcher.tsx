'use client';

import { useState, useRef, useEffect } from 'react';
import { useOrganization } from '@/lib/OrganizationContext';
import { ChevronDown, Check, Plus, Building2, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function OrganizationSwitcher() {
  const { currentOrg, organizations, switchOrganization, loading } = useOrganization();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showAddOrgModal, setShowAddOrgModal] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showAddOrgModal) {
      toast('Coming soon!', { icon: '✨' });
      setShowAddOrgModal(false);
    }
  }, [showAddOrgModal]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const currentIndex = organizations.findIndex((org) => org.id === currentOrg?.id);
    setActiveIndex(Math.max(currentIndex, 0));
  }, [isOpen, organizations, currentOrg?.id]);

  if (loading) {
    return <div className="h-10 w-48 bg-gray-200 rounded-lg animate-pulse" />;
  }

  if (!currentOrg || organizations.length === 0) {
    return null;
  }

  const planLabel = 'Free plan';
  const hasMultiple = organizations.length > 1;
  const totalItems = organizations.length + 1;

  const handleProClick = () => {
    router.push('/subscribe');
  };

  const handleSwitch = (orgId: string) => {
    switchOrganization(orgId);
    setIsOpen(false);
  };

  const handleAddOrganization = () => {
    setIsOpen(false);
    setShowAddOrgModal(true);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % totalItems);
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => (prev - 1 + totalItems) % totalItems);
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      if (activeIndex < organizations.length) {
        handleSwitch(organizations[activeIndex].id);
      } else {
        handleAddOrganization();
      }
    }
  };

  const triggerClasses = hasMultiple
    ? `flex items-center gap-2 px-4 py-2 border rounded-lg transition-all duration-200 w-full md:w-auto ${
        isOpen ? 'bg-gray-100 border-[#4b248c]' : 'bg-white border-gray-200 hover:bg-gray-50'
      }`
    : 'flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg bg-white w-full md:w-auto';

  if (!hasMultiple) {
    return (
      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
        <div className={triggerClasses}>
          <Building2 className="w-5 h-5 text-[#4b248c]" />
          <span className="font-medium text-gray-900">{currentOrg.name}</span>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
            {planLabel}
          </span>
        </div>
        <button
          type="button"
          onClick={handleProClick}
          className="flex items-center gap-2 px-4 py-2 bg-[#0047AB] text-white rounded-lg text-sm font-medium hover:bg-[#003a8c] transition-colors w-full md:w-auto justify-center"
        >
          <Sparkles className="w-4 h-4" />
          Pro
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full md:w-auto" ref={dropdownRef}>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          aria-label="Switch organization"
          aria-expanded={isOpen}
          className={triggerClasses}
        >
          <Building2 className="w-5 h-5 text-[#4b248c]" />
          <span className="font-medium text-gray-900 truncate max-w-[160px]">
            {currentOrg.name}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-gray-500 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
        <button
          type="button"
          onClick={handleProClick}
          className="flex items-center gap-2 px-4 py-2 bg-[#0047AB] text-white rounded-lg text-sm font-medium hover:bg-[#003a8c] transition-colors w-full md:w-auto justify-center"
        >
          <Sparkles className="w-4 h-4" />
          Pro
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              role="menu"
              tabIndex={-1}
              onKeyDown={handleKeyDown}
              className="fixed md:absolute md:top-full md:left-0 left-0 right-0 bottom-0 md:bottom-auto md:mt-2 bg-white border border-gray-200 md:rounded-lg rounded-t-2xl shadow-lg z-50 max-h-[50vh] md:max-h-[300px] overflow-y-auto"
            >
              <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <span className="text-sm font-semibold text-gray-700">Switch Organization</span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-2">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                  Your Organizations
                </div>
                {organizations.map((org, index) => (
                  <button
                    key={org.id}
                    role="menuitem"
                    onClick={() => handleSwitch(org.id)}
                    className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition-colors cursor-pointer ${
                      org.id === currentOrg.id
                        ? 'bg-purple-100 text-[#4b248c]'
                        : index === activeIndex
                          ? 'bg-purple-50 text-gray-700'
                          : 'hover:bg-purple-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className="w-4 h-4" />
                      <span className="text-sm font-medium">{org.name}</span>
                    </div>
                    {org.id === currentOrg.id && (
                      <Check className="w-5 h-5 text-[#4b248c]" />
                    )}
                  </button>
                ))}

                <div className="border-t border-gray-200 my-2" />

                <button
                  type="button"
                  role="menuitem"
                  onClick={handleAddOrganization}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors ${
                    activeIndex === organizations.length ? 'bg-gray-50' : ''
                  }`}
                >
                  <Plus className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium">Add New Organization</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
