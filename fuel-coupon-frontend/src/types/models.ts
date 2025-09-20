// src/types/models.ts

export interface User {
    id: number;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
    role: 'MAIN_CENTER' | 'SUB_CENTER' | 'APPROVER' | 'BENEFICIARY' | 'AUDITOR' | 'ADMIN';
    sub_center?: SubCenter;
    phone?: string;
    is_active: boolean;
    last_login?: string;
    date_joined?: string;
  }
  
  export interface SubCenter {
    id: number;
    code: string;
    name: string;
    location: string;
    created_at: string;
    managed_by?: User;
    is_active: boolean;
  }
  
  export interface Batch {
    // Core identification
    id: number;
    batch_code: string;
    batchId?: string;      // Frontend alias for batch_code
    barcode?: string;
    
    // Supply chain
    supplier?: string;
    delivery_note?: string;
    invoice_number?: string;
    
    // Fuel specifications
    fuel_type: 'PETROL' | 'DIESEL';
    denomination: number; // 5, 10, 20, 50 litres
    
    // Structure
    number_of_books: number;
    coupons_per_book: number;
    total_coupons_calculated: number;
    total_litres: number;
    
    // Coupon serial numbers
    first_coupon_number: string;
    last_coupon_number: string;
    
    // Financial
    fuel_price_per_litre_usd: number;
    exchange_rate_zwg_usd: number;
    total_value_usd: number;
    total_value_zwg: number;
    
    // Receipt tracking
    received_at: string;
    received_date?: string;
    received_time?: string;
    received_by?: User;
    received_by_signature?: string;
    
    // Assignment and workflow
    assigned_to?: SubCenter;
    status: 'PENDING' | 'RECEIVED' | 'VERIFIED' | 'DISPATCHED' | 'DAMAGED' | 'ARCHIVED';
    
    // Quality control
    verification_notes?: string;
    damage_report?: string;
    verified_at?: string;
    verified_by?: User;
    
    // Additional data
    qr_code_data?: string;
    notes?: string;
    calculation_mode?: string;
    book_details_json?: any[];
  }
  
  export interface Book {
    id: number;
    book_number: string;
    batch: Batch;
    first_coupon_number: string;
    last_coupon_number: string;
    is_assigned: boolean;
  }
  
  export interface Coupon {
    id: number;
    coupon_number: string;
    litres: number;
    status: 'AVAILABLE' | 'ALLOCATED' | 'USED' | 'EXPIRED' | 'DAMAGED';
    allocated_to?: User;
    allocated_date?: string;
    used_date?: string;
    created_at: string;
    updated_at: string;
    book: Book;
    // Additional properties used in the frontend
    book_number: string;
    box_code: string;
    status_display: string;
    allocated_to_name?: string;
  }
  
  export interface Program {
    // === CORE IDENTITY ===
    id: number;
    title: string;
    
    // === TYPE & DISPLAY ===
    program_type: 'SESSION' | 'COMMITTEE' | 'WORKSHOP' | 'OUTREACH' | 'CONFERENCE' | 
                  'CEREMONY' | 'INSPECTION' | 'CAMPAIGN' | 'NATIONAL_EVENT' | 'CONSTITUENCY' |
                  'DEBATE' | 'BUDGET_SESSION' | 'POLICY_MEETING' | 'PUBLIC_HEARING' | 
                  'DIPLOMATIC' | 'OTHER';
    program_type_display: string;
    status_display: string;
    
    // === SCHEDULING ===
    scheduled_date: string;
    end_date?: string;
    duration_days: number;
    
    // === DETAILS ===
    description?: string;
    location: string;
    notes?: string;
    
    // === RELATIONSHIPS ===
    organizer?: number;           // User ID (backend format)
    organizer_details?: User;     // Nested user object
    organizer_name?: string;      // Formatted name for display
    
    sub_center?: number;          // SubCenter ID (backend format)
    sub_center_details?: SubCenter; // Nested sub-center object
    sub_center_name?: string;     // Sub-center name for display
    
    attendees?: User[];           // Full attendees list (detailed views)
    
    // === MANAGEMENT ===
    expected_participants: number;
    fuel_allocation_approved: boolean;
    is_active: boolean;
    
    // === COMPUTED STATUS & PROGRESS ===
    is_upcoming: boolean;
    is_ongoing: boolean;
    is_completed: boolean;
    attendees_count: number;
    completion_percentage: number;
    
    // === TIMESTAMPS ===
    created: string;    // ISO datetime string
    modified: string;   // ISO datetime string
  }
  
  export interface Attendance {
    id: number;
    user: User;
    program: Program;
    attended: boolean;
    signed_at: string;
    notes?: string;
  }
  
  export interface Handover {
    id: number;
    from_user: User;
    to_user: User;
    coupon: Coupon;
    handover_date: string;
    confirmed: boolean;
    confirmation_date?: string;
    witness?: User;
    notes?: string;
  }
  
  export interface ApiResponse<T> {
    count?: number;
    next?: string;
    previous?: string;
    results: T[];
  }
  // src/types/models.ts
export interface SubCenter {
  id: number;
  code: string;
  name: string;
  location: string;
  is_active: boolean;
  created_at: string;
  managed_by?: User;
}

  // Additional utility types
  export type Role = User['role'];
  export type CouponStatus = Coupon['status'];
  export type ProgramType = Program['program_type'];
  
  // Type guards
  export function isMainCenterOfficer(user: User): boolean {
    return user.role === 'MAIN_CENTER';
  }
  
  export function isBeneficiary(user: User): boolean {
    return user.role === 'BENEFICIARY';
  }