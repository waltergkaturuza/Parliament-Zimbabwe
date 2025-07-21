// src/types/index.ts
export * from './models';
export * from './fuel';
export * from './admin';

// Additional types for the pages we created
export interface ParliamentSession {
  id: string;
  title: string;
  name?: string; // For backward compatibility
  description?: string; // For backward compatibility
  session_type: 'SITTING' | 'COMMITTEE' | 'NATIONAL_EVENT' | 'SPECIAL_SESSION';
  start_date: string;
  end_date: string;
  venue: string;
  fuel_entitlement_litres: string;
  is_mandatory: boolean;
  is_active: boolean;
  status?: 'active' | 'completed' | 'cancelled' | 'scheduled';
  attendees?: User[];
  attendances?: SessionAttendance[]; // For backward compatibility
  created_at: string;
  updated_at: string;
  // New fields for subcenter management
  session_manager?: string; // User ID
  session_manager_details?: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    role: string;
  };
  managing_subcenter?: string; // SubCenter ID
  managing_subcenter_details?: {
    id: string;
    name: string;
    code: string;
  };
  attendance_count?: number;
  total_fuel_allocated?: number;
}

export interface SessionAttendance {
  id: string;
  session?: ParliamentSession;
  beneficiary?: BeneficiaryProfile;
  date: string;
  status: 'present' | 'absent' | 'excused' | 'late';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface FuelEntitlement {
  id: string;
  beneficiary?: BeneficiaryProfile;
  vehicle_category?: VehicleCategory;
  monthly_allocation: number;
  yearly_allocation: number;
  status: 'active' | 'suspended' | 'expired' | 'pending';
  effective_from: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BeneficiaryProfile {
  id: string;
  user?: User;
  constituency?: Constituency;
  category?: BeneficiaryCategory;
  vehicle_registration?: string;
  fuel_entitlements?: FuelEntitlement[];
  created_at: string;
  updated_at: string;
}

export interface Constituency {
  id: string;
  name: string;
  code: string;
  province: string;
  created_at: string;
  updated_at: string;
}

export interface BeneficiaryCategory {
  id: string;
  name: string;
  description: string;
  monthly_allocation: number;
  created_at: string;
  updated_at: string;
}

export interface VehicleCategory {
  id: string;
  name: string;
  description: string;
  fuel_type: 'PETROL' | 'DIESEL' | 'BOTH';
  base_allocation: number;
  created_at: string;
  updated_at: string;
}

// Re-export essential types from models
export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  sub_center?: SubCenter;
  is_active: boolean;
  date_joined: string;
}

export interface SubCenter {
  id: string;
  name: string;
  location: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  status: 'active' | 'inactive' | 'maintenance';
  created_at: string;
  updated_at: string;
}

export interface Box {
  id: string;
  box_id: string;
  number_of_books?: number;
  status: string;
  sub_center?: SubCenter;
  books?: Book[];
  created_at: string;
  updated_at: string;
}

export interface Book {
  id: string;
  book_id: string;
  number_of_coupons?: number;
  status: string;
  box?: Box;
  coupons?: Coupon[];
  created_at: string;
  updated_at: string;
}

export interface Coupon {
  id: string;
  coupon_id: string;
  book?: Book;
  beneficiary?: BeneficiaryProfile;
  status: string;
  issued_date?: string;
  used_date?: string;
  fuel_type?: 'PETROL' | 'DIESEL';
  litres?: number;
  created_at: string;
  updated_at: string;
}

export interface Handover {
  id: string;
  from_user?: User;
  to_user?: User;
  handover_type: string;
  items: any;
  status: string;
  handover_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Audit & Compliance Types
export interface ComplianceReport {
  id: string;
  type: string;
  period: string;
  status: 'compliant' | 'non_compliant' | 'pending' | 'warning';
  compliance_score: number;
  created_at: string;
  updated_at: string;
}

export interface AuditTransaction {
  id: string;
  type: string;
  user?: User;
  center?: SubCenter;
  risk_score: number;
  status: 'verified' | 'flagged' | 'suspicious' | 'pending';
  details?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AuditTrail {
  id: string;
  transaction_id: string;
  action_type: 'create' | 'update' | 'delete' | 'view';
  description: string;
  user: string;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
}
