// src/types/index.ts
export * from './models';
export * from './fuel';
export * from './admin';

// Additional types for the pages we created
export interface ParliamentSession {
  id: string;
  title: string;
  description?: string;
  session_type: 'REGULAR' | 'SPECIAL' | 'COMMITTEE' | 'BUDGET' | 'EMERGENCY';
  session_type_display?: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  venue?: string;
  is_active: boolean;
  is_mandatory?: boolean;
  status?: 'active' | 'upcoming' | 'completed' | 'inactive';
  assigned_attendees?: string[];
  
  // Organizer information
  organizer?: string; // User ID
  organizer_name?: string;
  organizer_details?: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  };
  
  // SubCenter management
  managing_subcenter?: string; // SubCenter ID
  managing_subcenter_name?: string;
  managing_subcenter_details?: {
    id: string;
    name: string;
    code: string;
  };
  
  // Program association
  program?: string; // Program ID
  program_details?: {
    id: string;
    name: string;
    description: string;
    status: string;
  };
  
  // Fuel and attendance tracking
  fuel_top_up_litres?: number;
  fuel_top_up_percentage?: number;
  expected_attendance?: number;
  attendance_tracked?: boolean;
  attendance_count?: number;
  attendees_count?: number;
  total_fuel_allocated?: number;
  
  // Calculated fields
  duration_days?: number;
  is_active_session?: boolean;
  
  // Timestamps
  created: string;
  modified: string;
  
  // Legacy support
  name?: string; // For backward compatibility
  venue?: string; // For backward compatibility
  fuel_entitlement_litres?: string; // For backward compatibility
  is_mandatory?: boolean; // For backward compatibility
  attendees?: User[]; // For backward compatibility
  attendances?: SessionAttendance[]; // For backward compatibility
  created_at?: string; // For backward compatibility
  updated_at?: string; // For backward compatibility
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

export interface Batch {
  // Core identification
  id: string;
  batch_id: string;        // Main identifier
  batch_code?: string;     // Backend field name
  barcode?: string;
  
  // Supply chain
  supplier?: string;
  delivery_note?: string;
  invoice_number?: string;
  
  // Structure and fuel
  fuel_type?: 'PETROL' | 'DIESEL';
  denomination?: number;
  number_of_books?: number;
  coupons_per_book?: number;
  total_coupons_calculated?: number;
  total_litres?: number;
  
  // Coupon serials
  first_coupon_number?: string;
  last_coupon_number?: string;
  
  // Financial
  fuel_price_per_litre_usd?: number;
  total_value_usd?: number;
  
  // Receipt and assignment
  received_at?: string;
  received_date?: string;
  received_time?: string;
  received_by_signature?: string;
  
  // Workflow
  status: string;
  verification_notes?: string;
  damage_report?: string;
  
  // Relations
  sub_center?: SubCenter;
  books?: Book[];
  
  // Additional
  qr_code_data?: string;
  notes?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface Book {
  id: string;
  book_id: string;
  number_of_coupons?: number;
  status: string;
  batch?: Batch;
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
