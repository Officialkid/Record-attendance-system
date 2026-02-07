/**
 * MULTI-TENANT FIRESTORE FUNCTIONS
 * 
 * This file replaces lib/firestore.ts with multi-tenant support.
 * All functions now require organizationId parameter to ensure data isolation.
 * 
 * CRITICAL: Each organization can ONLY access their own data.
 * All queries include organizationId filtering to prevent data leakage.
 */

import { db } from './firebase';
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
  updateDoc,
  arrayUnion,
  limit,
} from 'firebase/firestore';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, startOfDay, endOfDay } from 'date-fns';

const isIndexRequiredError = (error: unknown) => {
  const err = error as { code?: string; message?: string };
  const message = err?.message?.toLowerCase() ?? '';
  return err?.code === 'failed-precondition' || message.includes('requires an index') || message.includes('index required');
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPESCRIPT TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface Organization {
  id: string;
  name: string;
  type: string;
  country: string;
  phone: string;
  ownerId: string;
  members: string[];
  settings: {
    currency: 'KES' | 'USD';
    timezone: string;
  };
  estimatedAttendance?: string;
  howDidYouHear?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  organizations: string[];
  createdAt: Date;
  lastLoginAt: Date;
}

export interface Service {
  id: string;
  organizationId: string;
  serviceDate: Date;
  serviceType: string;
  totalAttendance: number;
  visitorCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Visitor {
  id: string;
  visitorName: string | null;
  visitorContact: string | null;
  visitDate: Date;
  createdAt: Date;
}

export interface MonthlyStats {
  totalServices: number;
  totalAttendance: number;
  totalVisitors: number;
  avgAttendance: number;
}

export interface MonthlyTotal {
  month: number;
  monthName: string;
  totalAttendance: number;
  serviceCount: number;
}

export interface YearComparison {
  month: string;
  [key: number]: number; // Dynamic year keys
  growth: number;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. ORGANIZATION FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Create a new organization
 */
export async function createOrganization(data: {
  name: string;
  type: string;
  country: string;
  phone: string;
  ownerId: string;
  estimatedAttendance?: string;
  howDidYouHear?: string;
}): Promise<string> {
  try {
    // Set currency based on country
    const currency = data.country === 'Kenya' ? 'KES' : 'USD';

    // Set timezone based on country (simplified - you can expand this)
    const timezoneMap: { [key: string]: string } = {
      'Kenya': 'Africa/Nairobi',
      'Uganda': 'Africa/Kampala',
      'Tanzania': 'Africa/Dar_es_Salaam',
      'United States': 'America/New_York',
      'United Kingdom': 'Europe/London',
    };
    const timezone = timezoneMap[data.country] || 'UTC';

    const orgData = {
      name: data.name,
      type: data.type,
      country: data.country,
      phone: data.phone,
      ownerId: data.ownerId,
      members: [data.ownerId],
      settings: {
        currency,
        timezone,
      },
      ...(data.estimatedAttendance && { estimatedAttendance: data.estimatedAttendance }),
      ...(data.howDidYouHear && { howDidYouHear: data.howDidYouHear }),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, 'organizations'), orgData);
    console.log('Organization created:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating organization:', error);
    throw new Error('Failed to create organization');
  }
}

/**
 * Get organization by ID
 */
export async function getOrganization(orgId: string): Promise<Organization | null> {
  try {
    const docRef = doc(db, 'organizations', orgId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: data.name,
      type: data.type,
      country: data.country,
      phone: data.phone,
      ownerId: data.ownerId,
      members: data.members || [],
      settings: {
        currency: data.settings?.currency || 'USD',
        timezone: data.settings?.timezone || 'UTC',
      },
      estimatedAttendance: data.estimatedAttendance,
      howDidYouHear: data.howDidYouHear,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  } catch (error) {
    console.error('Error fetching organization:', error);
    throw new Error('Failed to fetch organization');
  }
}

/**
 * Get all organizations for a user
 */
export async function getUserOrganizations(userId: string): Promise<Organization[]> {
  try {
    // Get user document to find their organizations
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.log('User not found:', userId);
      return [];
    }

    const userData = userSnap.data();
    const orgIds = userData.organizations || [];

    if (orgIds.length === 0) {
      return [];
    }

    // Fetch each organization
    const organizations: Organization[] = [];
    for (const orgId of orgIds) {
      const org = await getOrganization(orgId);
      if (org) {
        organizations.push(org);
      }
    }

    return organizations;
  } catch (error) {
    console.error('Error fetching user organizations:', error);
    throw new Error('Failed to fetch user organizations');
  }
}

/**
 * Update organization details
 */
export async function updateOrganization(
  orgId: string,
  updates: Partial<Omit<Organization, 'id' | 'createdAt'>>
): Promise<boolean> {
  try {
    const docRef = doc(db, 'organizations', orgId);
    
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });

    console.log('Organization updated:', orgId);
    return true;
  } catch (error) {
    console.error('Error updating organization:', error);
    throw new Error('Failed to update organization');
  }
}

/**
 * Ensure a user has access to an organization
 */
export async function ensureUserOrgAccess(userId: string, organizationId: string): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', userId);

    await updateDoc(userRef, {
      organizations: arrayUnion(organizationId),
      lastLoginAt: Timestamp.now(),
    });

    return true;
  } catch (error) {
    console.error('Error ensuring user organization access:', error);
    throw new Error('Failed to update user access');
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. ATTENDANCE FUNCTIONS (MULTI-TENANT)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Add attendance record for a specific organization
 * CRITICAL: Includes organizationId to ensure data isolation
 */
export async function addAttendanceRecord(
  organizationId: string,
  serviceDate: Date,
  totalAttendance: number,
  visitors: Array<{ name: string; contact: string }>
): Promise<{ success: boolean; serviceId?: string; error?: string }> {
  try {
    // Step 1: Check for duplicate (same date + same org)
    const dayStart = Timestamp.fromDate(startOfDay(serviceDate));
    const dayEnd = Timestamp.fromDate(endOfDay(serviceDate));

    const duplicateQuery = query(
      collection(db, 'services'),
      where('organizationId', '==', organizationId),
      where('serviceDate', '>=', dayStart),
      where('serviceDate', '<=', dayEnd),
      limit(1)
    );

    const duplicateSnap = await getDocs(duplicateQuery);
    if (!duplicateSnap.empty) {
      return {
        success: false,
        error: 'Attendance already recorded for this date',
      };
    }

    // Step 2: Create service document
    const serviceData = {
      organizationId, // KEY FIELD for multi-tenancy
      serviceDate: Timestamp.fromDate(serviceDate),
      serviceType: 'Saturday Fellowship',
      totalAttendance,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const serviceRef = await addDoc(collection(db, 'services'), serviceData);
    console.log('Service created:', serviceRef.id);

    // Step 3: Add visitors to sub-collection (if any)
    if (visitors && visitors.length > 0) {
      const batch = writeBatch(db);
      const visitorsCollection = collection(db, 'services', serviceRef.id, 'visitors');

      visitors.forEach((visitor) => {
        // Only add visitors with name OR contact (skip empty ones)
        if (visitor.name || visitor.contact) {
          const visitorRef = doc(visitorsCollection);
          batch.set(visitorRef, {
            visitorName: visitor.name || null,
            visitorContact: visitor.contact || null,
            visitDate: Timestamp.fromDate(serviceDate),
            createdAt: Timestamp.now(),
          });
        }
      });

      await batch.commit();
      console.log(`Added ${visitors.length} visitors to service ${serviceRef.id}`);
    }

    return {
      success: true,
      serviceId: serviceRef.id,
    };
  } catch (error) {
    console.error('Error adding attendance record:', error);
    if (isIndexRequiredError(error)) {
      return {
        success: false,
        error: 'INDEX_REQUIRED',
      };
    }
    return {
      success: false,
      error: 'Failed to add attendance record',
    };
  }
}

/**
 * Get all services for a specific organization in a given month
 * CRITICAL: Filters by organizationId to ensure data isolation
 */
export async function getServicesByMonth(
  organizationId: string,
  month: number,
  year: number
): Promise<Service[]> {
  try {
    const monthDate = new Date(year, month - 1, 1);
    const monthStart = Timestamp.fromDate(startOfMonth(monthDate));
    const monthEnd = Timestamp.fromDate(endOfMonth(monthDate));

    const servicesQuery = query(
      collection(db, 'services'),
      where('organizationId', '==', organizationId), // KEY FILTER
      where('serviceDate', '>=', monthStart),
      where('serviceDate', '<=', monthEnd),
      orderBy('serviceDate', 'desc')
    );

    const querySnapshot = await getDocs(servicesQuery);
    const services: Service[] = [];

    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data();

      // Fetch visitor count from sub-collection
      const visitorsSnap = await getDocs(
        collection(db, 'services', docSnap.id, 'visitors')
      );
      const visitorCount = visitorsSnap.size;

      services.push({
        id: docSnap.id,
        organizationId: data.organizationId,
        serviceDate: data.serviceDate.toDate(),
        serviceType: data.serviceType,
        totalAttendance: data.totalAttendance,
        visitorCount,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      });
    }

    return services;
  } catch (error) {
    console.error('Error fetching services by month:', error);
    if (isIndexRequiredError(error)) {
      throw new Error('INDEX_REQUIRED');
    }
    throw new Error('Failed to fetch services');
  }
}

/**
 * Get most recent services for a specific organization
 */
export async function getRecentServices(
  organizationId: string,
  count = 5
): Promise<Service[]> {
  try {
    const servicesQuery = query(
      collection(db, 'services'),
      where('organizationId', '==', organizationId),
      orderBy('serviceDate', 'desc'),
      limit(count)
    );

    const querySnapshot = await getDocs(servicesQuery);
    const services: Service[] = [];

    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data();

      const visitorsSnap = await getDocs(
        collection(db, 'services', docSnap.id, 'visitors')
      );
      const visitorCount = visitorsSnap.size;

      services.push({
        id: docSnap.id,
        organizationId: data.organizationId,
        serviceDate: data.serviceDate.toDate(),
        serviceType: data.serviceType,
        totalAttendance: data.totalAttendance,
        visitorCount,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      });
    }

    return services;
  } catch (error) {
    console.error('Error fetching recent services:', error);
    if (isIndexRequiredError(error)) {
      throw new Error('INDEX_REQUIRED');
    }
    throw new Error('Failed to fetch recent services');
  }
}

/**
 * Get monthly statistics for a specific organization
 * CRITICAL: Uses organizationId to ensure data isolation
 */
export async function getMonthlyStats(
  organizationId: string,
  month: number,
  year: number
): Promise<MonthlyStats> {
  try {
    const services = await getServicesByMonth(organizationId, month, year);

    const totalServices = services.length;
    const totalAttendance = services.reduce((sum, s) => sum + s.totalAttendance, 0);
    const totalVisitors = services.reduce((sum, s) => sum + (s.visitorCount || 0), 0);
    const avgAttendance = totalServices > 0 ? Math.round(totalAttendance / totalServices) : 0;

    return {
      totalServices,
      totalAttendance,
      totalVisitors,
      avgAttendance,
    };
  } catch (error) {
    console.error('Error calculating monthly stats:', error);
    if ((error as { message?: string }).message === 'INDEX_REQUIRED') {
      throw new Error('INDEX_REQUIRED');
    }
    throw new Error('Failed to calculate monthly stats');
  }
}

/**
 * Get all visitors for a specific service
 * Note: No organizationId filter needed - serviceId is already scoped to an org
 */
export async function getVisitorsForService(serviceId: string): Promise<Visitor[]> {
  try {
    const visitorsSnap = await getDocs(
      collection(db, 'services', serviceId, 'visitors')
    );

    const visitors: Visitor[] = [];
    visitorsSnap.forEach((docSnap) => {
      const data = docSnap.data();
      visitors.push({
        id: docSnap.id,
        visitorName: data.visitorName,
        visitorContact: data.visitorContact,
        visitDate: data.visitDate.toDate(),
        createdAt: data.createdAt.toDate(),
      });
    });

    return visitors;
  } catch (error) {
    console.error('Error fetching visitors:', error);
    throw new Error('Failed to fetch visitors');
  }
}

/**
 * Get all services for a specific organization in a given year
 * CRITICAL: Filters by organizationId to ensure data isolation
 */
export async function getServicesByYear(
  organizationId: string,
  year: number
): Promise<Service[]> {
  try {
    const yearDate = new Date(year, 0, 1);
    const yearStart = Timestamp.fromDate(startOfYear(yearDate));
    const yearEnd = Timestamp.fromDate(endOfYear(yearDate));

    const servicesQuery = query(
      collection(db, 'services'),
      where('organizationId', '==', organizationId), // KEY FILTER
      where('serviceDate', '>=', yearStart),
      where('serviceDate', '<=', yearEnd),
      orderBy('serviceDate', 'asc')
    );

    const querySnapshot = await getDocs(servicesQuery);
    const services: Service[] = [];

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      services.push({
        id: docSnap.id,
        organizationId: data.organizationId,
        serviceDate: data.serviceDate.toDate(),
        serviceType: data.serviceType,
        totalAttendance: data.totalAttendance,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      });
    });

    return services;
  } catch (error) {
    console.error('Error fetching services by year:', error);
    if (isIndexRequiredError(error)) {
      throw new Error('INDEX_REQUIRED');
    }
    throw new Error('Failed to fetch services');
  }
}

/**
 * Get monthly attendance totals for a specific organization for an entire year
 * CRITICAL: Uses organizationId to ensure data isolation
 */
export async function getMonthlyTotalsByYear(
  organizationId: string,
  year: number
): Promise<MonthlyTotal[]> {
  try {
    const services = await getServicesByYear(organizationId, year);

    // Initialize array with all 12 months
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTotals: MonthlyTotal[] = monthNames.map((name, index) => ({
      month: index + 1,
      monthName: name,
      totalAttendance: 0,
      serviceCount: 0,
    }));

    // Aggregate attendance by month
    services.forEach((service) => {
      const month = service.serviceDate.getMonth(); // 0-11
      monthlyTotals[month].totalAttendance += service.totalAttendance;
      monthlyTotals[month].serviceCount += 1;
    });

    return monthlyTotals;
  } catch (error) {
    console.error('Error getting monthly totals:', error);
    if ((error as { message?: string }).message === 'INDEX_REQUIRED') {
      throw new Error('INDEX_REQUIRED');
    }
    throw new Error('Failed to get monthly totals');
  }
}

/**
 * Compare attendance between two years for a specific organization
 * CRITICAL: Uses organizationId to ensure data isolation
 */
export async function compareYears(
  organizationId: string,
  currentYear: number,
  previousYear: number
): Promise<YearComparison[]> {
  try {
    const currentYearData = await getMonthlyTotalsByYear(organizationId, currentYear);
    const previousYearData = await getMonthlyTotalsByYear(organizationId, previousYear);

    const comparison: YearComparison[] = currentYearData.map((current, index) => {
      const previous = previousYearData[index];
      const currentTotal = current.totalAttendance;
      const previousTotal = previous.totalAttendance;

      // Calculate growth percentage (handle division by zero)
      let growth = 0;
      if (previousTotal > 0) {
        growth = Math.round(((currentTotal - previousTotal) / previousTotal) * 100);
      } else if (currentTotal > 0) {
        growth = 100; // If previous was 0 and current is positive, that's 100% growth
      }

      return {
        month: current.monthName,
        [currentYear]: currentTotal,
        [previousYear]: previousTotal,
        growth,
      };
    });

    return comparison;
  } catch (error) {
    console.error('Error comparing years:', error);
    throw new Error('Failed to compare years');
  }
}
