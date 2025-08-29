// src/api/beneficiaryDashboard.ts
import apiClient from './index';

// Types for beneficiary dashboard data
export interface BeneficiaryProfile {
  id: string;
  parliamentaryId: string;
  name: string;
  title: string;
  category: string;
  constituency?: string;
  party: string;
  phoneNumber: string;
  email: string;
  address: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  profilePhoto?: string;
  vehicleInfo?: {
    make: string;
    model: string;
    year: number;
    engineSize: string;
    registrationNumber: string;
    fuelType: 'PETROL' | 'DIESEL';
  };
  allocationProfile: {
    monthlyAllocation: number;
    currentBalance: number;
    usedThisMonth: number;
    lastUpdated: string;
    baseAllocation: number;
    multiplier: number;
  };
  joinDate: string;
  lastLogin: string;
}

export interface CouponAllocation {
  id: string;
  allocationDate: string;
  sessionName: string;
  programName: string;
  eventName?: string;
  couponsAllocated: number;
  totalLitres: number;
  totalValue: number;
  couponsUsed: number;
  couponsRemaining: number;
  status: 'ACTIVE' | 'USED' | 'EXPIRED' | 'VOIDED';
  allocatedBy: string;
  subCenterName: string;
  firstCouponSerial: string;
  lastCouponSerial: string;
  expiryDate: string;
  notes?: string;
  coupons: CouponDetail[];
}

export interface CouponDetail {
  id: string;
  couponSerial: string;
  status: 'ALLOCATED' | 'USED' | 'EXPIRED' | 'VOIDED';
  usedDate?: string;
  usedLocation?: string;
  litres: number;
  value: number;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  sessionName: string;
  sessionType: 'PLENARY' | 'COMMITTEE' | 'SPECIAL' | 'WORKSHOP';
  startTime: string;
  endTime: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  duration: number;
  location: string;
  notes?: string;
}

export interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'SESSION' | 'COMMITTEE' | 'EVENT' | 'MEETING';
  location: string;
  description: string;
  fuelAllocationEligible: boolean;
  estimatedFuelRequirement?: number;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
}

export interface BeneficiaryDashboardData {
  profile: BeneficiaryProfile;
  allocations: CouponAllocation[];
  attendance: AttendanceRecord[];
  upcomingEvents: UpcomingEvent[];
  stats: {
    totalAllocations: number;
    totalUsed: number;
    currentBalance: number;
    attendanceRate: number;
  };
}

const BeneficiaryDashboardService = {
  // Get current beneficiary profile
  getBeneficiaryProfile: async (): Promise<BeneficiaryProfile> => {
    try {
      const response = await apiClient.get<BeneficiaryProfile>('/beneficiaries/me/profile/');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching beneficiary profile:', error);
      throw error;
    }
  },

  // Get beneficiary's fuel allocations
  getBeneficiaryAllocations: async (params?: {
    status?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ results: CouponAllocation[]; count: number }> => {
    try {
      const response = await apiClient.get('/beneficiaries/me/allocations/', { params });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching beneficiary allocations:', error);
      throw error;
    }
  },

  // Get specific allocation details with coupons
  getAllocationDetails: async (allocationId: string): Promise<CouponAllocation> => {
    try {
      const response = await apiClient.get<CouponAllocation>(`/beneficiaries/me/allocations/${allocationId}/`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching allocation details:', error);
      throw error;
    }
  },

  // Get beneficiary's attendance records
  getBeneficiaryAttendance: async (params?: {
    start_date?: string;
    end_date?: string;
    session_type?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ results: AttendanceRecord[]; count: number }> => {
    try {
      const response = await apiClient.get('/beneficiaries/me/attendance/', { params });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching beneficiary attendance:', error);
      throw error;
    }
  },

  // Get upcoming events/sessions for beneficiary
  getUpcomingEvents: async (): Promise<UpcomingEvent[]> => {
    try {
      const response = await apiClient.get<UpcomingEvent[]>('/beneficiaries/me/upcoming-events/');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching upcoming events:', error);
      throw error;
    }
  },

  // Get beneficiary dashboard stats
  getDashboardStats: async (): Promise<BeneficiaryDashboardData['stats']> => {
    try {
      const response = await apiClient.get('/beneficiaries/me/stats/');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  // Get all dashboard data in one call
  getDashboardData: async (): Promise<BeneficiaryDashboardData> => {
    try {
      const response = await apiClient.get<BeneficiaryDashboardData>('/beneficiaries/me/dashboard/');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  },

  // Update beneficiary profile
  updateProfile: async (data: Partial<BeneficiaryProfile>): Promise<BeneficiaryProfile> => {
    try {
      const response = await apiClient.patch<BeneficiaryProfile>('/beneficiaries/me/profile/', data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating beneficiary profile:', error);
      throw error;
    }
  },
};

export default BeneficiaryDashboardService;
