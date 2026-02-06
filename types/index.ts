// Database Types
export interface Service {
  id: string;
  service_date: string;
  service_type: string;
  total_attendance: number;
  created_at: string;
  updated_at: string;
}

export interface Visitor {
  id: string;
  service_id: string;
  visitor_name: string | null;
  visitor_contact: string | null;
  visit_date: string;
  created_at: string;
}

// Form Types
export interface AttendanceFormData {
  service_date: string;
  service_type: string;
  total_attendance: number;
  visitors: VisitorFormData[];
}

export interface VisitorFormData {
  visitor_name: string;
  visitor_contact: string;
}

// Analytics Types
export interface AttendanceStats {
  totalServices: number;
  averageAttendance: number;
  totalVisitors: number;
  growthRate: number;
}

export interface ServiceWithVisitors extends Service {
  visitors: Visitor[];
}
