import { db } from './firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  doc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, format } from 'date-fns';
import type { Service, Visitor } from '@/types';

// Collection references
export const servicesCollection = collection(db, 'services');

/**
 * Add attendance record with duplicate detection and batch visitor creation
 */
export async function addAttendanceRecord(
  serviceDate: Date,
  serviceType: string,
  totalAttendance: number,
  visitors: Array<{ name: string; contact: string }>
) {
  try {
    // 1. Check for duplicate service on same date
    const startOfDay = new Date(serviceDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(serviceDate);
    endOfDay.setHours(23, 59, 59, 999);

    const duplicateQuery = query(
      servicesCollection,
      where('serviceDate', '>=', Timestamp.fromDate(startOfDay)),
      where('serviceDate', '<=', Timestamp.fromDate(endOfDay))
    );
    
    const duplicateSnapshot = await getDocs(duplicateQuery);
    
    if (!duplicateSnapshot.empty) {
      throw new Error('Attendance record already exists for this date');
    }

    // 2. Create service document
    const serviceRef = await addDoc(servicesCollection, {
      serviceDate: Timestamp.fromDate(serviceDate),
      serviceType: serviceType,
      totalAttendance: totalAttendance,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 3. Add visitors as sub-collection if any provided (batch write for performance)
    if (visitors && visitors.length > 0) {
      const validVisitors = visitors.filter(v => v.name || v.contact);
      
      // Firestore batch limit is 500, so split if needed
      const batchSize = 500;
      for (let i = 0; i < validVisitors.length; i += batchSize) {
        const batchSlice = validVisitors.slice(i, i + batchSize);
        const currentBatch = writeBatch(db);
        
        batchSlice.forEach((visitor) => {
          const visitorRef = doc(collection(db, `services/${serviceRef.id}/visitors`));
          currentBatch.set(visitorRef, {
            visitorName: visitor.name || null,
            visitorContact: visitor.contact || null,
            visitDate: Timestamp.fromDate(serviceDate),
            createdAt: serverTimestamp(),
          });
        });

        await currentBatch.commit();
      }
    }

    return { success: true, serviceId: serviceRef.id };
    
  } catch (error: unknown) {
    console.error('Error adding attendance:', error);
    const message = (error as { message?: string }).message || 'Failed to add attendance';
    return { success: false, error: message };
  }
}

/**
 * Add a new service record (legacy - kept for compatibility)
 */
export async function addService(data: {
  serviceDate: Date;
  serviceType: string;
  totalAttendance: number;
}) {
  const docRef = await addDoc(servicesCollection, {
    serviceDate: Timestamp.fromDate(data.serviceDate),
    serviceType: data.serviceType,
    totalAttendance: data.totalAttendance,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Add visitors to a service
 */
export async function addVisitors(
  serviceId: string,
  visitors: Array<{ visitorName: string; visitorContact: string; visitDate: Date }>
) {
  const visitorsCollection = collection(db, `services/${serviceId}/visitors`);
  
  const promises = visitors.map((visitor) =>
    addDoc(visitorsCollection, {
      visitorName: visitor.visitorName,
      visitorContact: visitor.visitorContact,
      visitDate: Timestamp.fromDate(visitor.visitDate),
      createdAt: serverTimestamp(),
    })
  );

  await Promise.all(promises);
}

/**
 * Get all services ordered by date
 */
export async function getServices(): Promise<Service[]> {
  const q = query(servicesCollection, orderBy('serviceDate', 'desc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      service_date: data.serviceDate?.toDate().toISOString().split('T')[0] || '',
      service_type: data.serviceType || '',
      total_attendance: data.totalAttendance || 0,
      created_at: data.createdAt?.toDate().toISOString() || '',
      updated_at: data.updatedAt?.toDate().toISOString() || '',
    };
  });
}

/**
 * Get all visitors from all services
 */
export async function getAllVisitors(): Promise<Visitor[]> {
  const servicesSnapshot = await getDocs(servicesCollection);
  const visitors: Visitor[] = [];

  for (const serviceDoc of servicesSnapshot.docs) {
    const visitorsCollection = collection(db, `services/${serviceDoc.id}/visitors`);
    const visitorsSnapshot = await getDocs(query(visitorsCollection, orderBy('visitDate', 'desc')));
    
    visitorsSnapshot.docs.forEach((visitorDoc) => {
      const data = visitorDoc.data();
      visitors.push({
        id: visitorDoc.id,
        service_id: serviceDoc.id,
        visitor_name: data.visitorName || null,
        visitor_contact: data.visitorContact || null,
        visit_date: data.visitDate?.toDate().toISOString().split('T')[0] || '',
        created_at: data.createdAt?.toDate().toISOString() || '',
      });
    });
  }

  // Sort by visit date descending
  visitors.sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime());
  
  return visitors;
}

/**
 * Get visitors for a specific service
 */
export async function getVisitorsByService(serviceId: string): Promise<Visitor[]> {
  const visitorsCollection = collection(db, `services/${serviceId}/visitors`);
  const querySnapshot = await getDocs(visitorsCollection);
  
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      service_id: serviceId,
      visitor_name: data.visitorName || null,
      visitor_contact: data.visitorContact || null,
      visit_date: data.visitDate?.toDate().toISOString().split('T')[0] || '',
      created_at: data.createdAt?.toDate().toISOString() || '',
    };
  });
}

/**
 * Fetch services for a specific month/year
 */
type MonthlyService = {
  id: string;
  serviceDate: Date;
  serviceType: string;
  totalAttendance: number;
  visitorCount: number;
};

export async function getServicesByMonth(month: number, year: number): Promise<MonthlyService[]> {
  try {
    const start = startOfMonth(new Date(year, month - 1));
    const end = endOfMonth(new Date(year, month - 1));

    const q = query(
      collection(db, 'services'),
      where('serviceDate', '>=', Timestamp.fromDate(start)),
      where('serviceDate', '<=', Timestamp.fromDate(end)),
      orderBy('serviceDate', 'desc')
    );

    const snapshot = await getDocs(q);
    
    const services = await Promise.all(
      snapshot.docs.map(async (serviceDoc) => {
        // Get visitor count from sub-collection
        const visitorsSnapshot = await getDocs(
          collection(db, `services/${serviceDoc.id}/visitors`)
        );
        const data = serviceDoc.data();
        const totalAttendance =
          typeof data.totalAttendance === 'number' ? data.totalAttendance : 0;

        return {
          id: serviceDoc.id,
          serviceDate: data.serviceDate?.toDate() || new Date(),
          serviceType: data.serviceType || '',
          totalAttendance,
          visitorCount: visitorsSnapshot.size,
        };
      })
    );

    return services;
  } catch (error) {
    console.error('Error fetching services:', error);
    throw error;
  }
}

/**
 * Fetch visitors for a specific service
 */
export async function getVisitorsForService(serviceId: string) {
  try {
    const visitorsSnapshot = await getDocs(
      collection(db, `services/${serviceId}/visitors`)
    );

    return visitorsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      visitDate: doc.data().visitDate.toDate(),
    }));
  } catch (error) {
    console.error('Error fetching visitors:', error);
    throw error;
  }
}

/**
 * Calculate monthly stats
 */
export async function getMonthlyStats(month: number, year: number) {
  const services = await getServicesByMonth(month, year);

  const totalServices = services.length;
  const totalAttendance = services.reduce((sum, service) => sum + service.totalAttendance, 0);
  const totalVisitors = services.reduce((sum, service) => sum + service.visitorCount, 0);
  const avgAttendance = totalServices > 0 ? Math.round(totalAttendance / totalServices) : 0;

  return {
    totalServices,
    totalAttendance,
    totalVisitors,
    avgAttendance,
  };
}

/**
 * Fetch all services for a specific year
 */
type YearlyService = {
  id: string;
  serviceDate: Date;
  totalAttendance: number;
};

export async function getServicesByYear(year: number): Promise<YearlyService[]> {
  try {
    const start = startOfYear(new Date(year, 0));
    const end = endOfYear(new Date(year, 0));

    const q = query(
      collection(db, 'services'),
      where('serviceDate', '>=', Timestamp.fromDate(start)),
      where('serviceDate', '<=', Timestamp.fromDate(end)),
      orderBy('serviceDate', 'asc')
    );

    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      const totalAttendance =
        typeof data.totalAttendance === 'number' ? data.totalAttendance : 0;

      return {
        id: doc.id,
        serviceDate: data.serviceDate?.toDate() || new Date(),
        totalAttendance,
      };
    });
  } catch (error) {
    console.error('Error fetching yearly services:', error);
    throw error;
  }
}

/**
 * Calculate monthly totals for a year
 */
export async function getMonthlyTotalsByYear(year: number) {
  const services = await getServicesByYear(year);
  
  // Group by month
  const monthlyData = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    monthName: format(new Date(year, i), 'MMM'),
    totalAttendance: 0,
    serviceCount: 0,
  }));

  services.forEach((service: { serviceDate: Date; totalAttendance: number }) => {
    const month = service.serviceDate.getMonth();
    monthlyData[month].totalAttendance += service.totalAttendance;
    monthlyData[month].serviceCount += 1;
  });

  return monthlyData;
}

/**
 * Compare two years
 */
export async function compareYears(currentYear: number, previousYear: number) {
  const [currentData, previousData] = await Promise.all([
    getMonthlyTotalsByYear(currentYear),
    getMonthlyTotalsByYear(previousYear),
  ]);

  return currentData.map((current, index) => ({
    month: current.monthName,
    [currentYear]: current.totalAttendance,
    [previousYear]: previousData[index].totalAttendance,
    growth: previousData[index].totalAttendance > 0
      ? ((current.totalAttendance - previousData[index].totalAttendance) / previousData[index].totalAttendance) * 100
      : current.totalAttendance > 0 ? 100 : 0,
  }));
}
