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
  
  export interface Box {
    id: number;
    box_code: string;
    first_coupon_number: string;
    last_coupon_number: string;
    total_litres: number;
    received_at: string;
    assigned_to?: SubCenter;
    received_by?: User;
  }
  
  export interface Book {
    id: number;
    book_number: string;
    box: Box;
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
    id: number;
    title: string;
    program_type: 'TRAINING' | 'DISTRIBUTION' | 'MEETING' | 'ACTIVITY';
    scheduled_date: string;
    end_date?: string;
    description?: string;
    location?: string;
    organizer?: User;
    sub_center?: SubCenter;
    is_active: boolean;
    attendees?: User[];
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