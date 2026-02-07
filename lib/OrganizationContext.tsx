'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getUserOrganizations, Organization } from './firestore-multitenant';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPESCRIPT INTERFACES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface OrganizationContextType {
  currentOrg: Organization | null;
  organizations: Organization[];
  loading: boolean;
  switchOrganization: (orgId: string) => void;
  refreshOrganizations: () => Promise<void>;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CREATE CONTEXT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const OrganizationContext = createContext<OrganizationContextType>({} as OrganizationContextType);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PROVIDER COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Load organizations for current user
   */
  const loadOrganizations = useCallback(async () => {
    if (!user) {
      setOrganizations([]);
      setCurrentOrg(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Fetch all organizations for this user
      const userOrgs = await getUserOrganizations(user.uid);
      setOrganizations(userOrgs);

      if (userOrgs.length === 0) {
        // User has no organizations - this shouldn't happen if sign-up works correctly
        console.warn('User has no organizations');
        setCurrentOrg(null);
        setLoading(false);
        return;
      }

      // Try to load saved organization from localStorage
      const savedOrgId = localStorage.getItem('currentOrgId');
      
      if (savedOrgId) {
        // Check if saved org is in user's organizations
        const savedOrg = userOrgs.find(org => org.id === savedOrgId);
        if (savedOrg) {
          setCurrentOrg(savedOrg);
          console.log('Loaded saved organization:', savedOrg.name);
        } else {
          // Saved org not found, use first org
          setCurrentOrg(userOrgs[0]);
          localStorage.setItem('currentOrgId', userOrgs[0].id);
          console.log('Saved org not found, using first:', userOrgs[0].name);
        }
      } else {
        // No saved org, use first organization
        setCurrentOrg(userOrgs[0]);
        localStorage.setItem('currentOrgId', userOrgs[0].id);
        console.log('No saved org, using first:', userOrgs[0].name);
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
      toast.error('Failed to load organizations');
      setOrganizations([]);
      setCurrentOrg(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Switch to a different organization
   */
  const switchOrganization = (orgId: string) => {
    const org = organizations.find(o => o.id === orgId);
    
    if (!org) {
      toast.error('Organization not found');
      return;
    }

    setCurrentOrg(org);
    localStorage.setItem('currentOrgId', orgId);
    toast.success(`Switched to ${org.name}`);
    console.log('Switched to organization:', org.name);

    // Optional: Trigger a page reload or event to refresh data
    // window.dispatchEvent(new CustomEvent('organizationChanged', { detail: org }));
  };

  /**
   * Refresh organizations list (useful after creating a new org)
   */
  const refreshOrganizations = async () => {
    await loadOrganizations();
  };

  // Load organizations when user changes
  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  // Don't render children until organizations are loaded
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-[#4b248c] to-[#0047AB] rounded-full mx-auto mb-4 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Organization...</h2>
          <p className="text-gray-600">Please wait while we set things up</p>
        </div>
      </div>
    );
  }

  // Handle case where user has no organizations
  if (!currentOrg && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-red-600 text-2xl font-bold">!</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Organization Found</h2>
          <p className="text-gray-600 mb-6">
            You don&apos;t have access to any organizations. Please contact support or create a new organization.
          </p>
          <button
            onClick={() => window.location.href = '/sign-up'}
            className="px-6 py-3 bg-[#0047AB] text-white rounded-lg hover:bg-[#4b248c] transition-colors"
          >
            Create Organization
          </button>
        </div>
      </div>
    );
  }

  return (
    <OrganizationContext.Provider
      value={{
        currentOrg,
        organizations,
        loading,
        switchOrganization,
        refreshOrganizations,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXPORT HOOK
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Hook to access organization context
 * 
 * Usage:
 * ```typescript
 * const { currentOrg, organizations, switchOrganization } = useOrganization();
 * ```
 */
export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  
  return context;
};
