import apiClient from './index';
import { authHeader } from '../utils/authHeader'; // Assuming you have a utility for auth headers
import { Coupon } from '@/types/models'; // Assuming you have Coupon type defined

interface MonthlyUsage {
  month: string;
  usage_count: number;
}

interface StatisticsData {
  total_coupons: number;
  available_coupons: number;
  allocated_coupons: number;
  used_coupons: number;
  expired_coupons: number;
  damaged_coupons: number;
  total_users: number;
  beneficiary_count: number;
  sub_center_count: number;
  monthly_coupon_usage: MonthlyUsage[];
  // Additional properties used in Dashboard
  allocated: number;
  allocation_rate: number;
  used: number;
  usage_trend: string;
  status_distribution: any[];
  monthly_trends: any[];
  // Add other statistics properties if your backend returns them
}

async function getStatistics(): Promise<StatisticsData> {
  try {
    const response = await apiClient.get<StatisticsData>('/statistics/', { headers: authHeader() });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching dashboard statistics:', error.message);
    throw error;
  }
}

// Fetch all coupons (permissions based on user role on the backend)
export const fetchCoupons = async (): Promise<Coupon[]> => {
  try {
    const response = await apiClient.get<Coupon[]>('/api/v1/coupons/');
    return response.data;
  } catch (error: any) {
    console.error('Error fetching coupons:', error);
    throw error;
  }
};

// Fetch a single coupon by ID
export const fetchCouponById = async (id: number): Promise<Coupon> => {
  try {
    const response = await apiClient.get<Coupon>(`/coupons/${id}/`);
    return response.data;
  } catch (error: any) {
    console.error(`Error fetching coupon with ID ${id}:`, error);
    throw error;
  }
};

// Allocate a coupon to a beneficiary (Sub-Center officer action)
export const allocateCoupon = async (couponId: number, allocationData: { allocated_to: number }): Promise<Coupon> => {
  try {
    const response = await apiClient.patch<Coupon>(`/coupons/${couponId}/`, allocationData);
    return response.data;
  } catch (error: any) {
    console.error(`Error allocating coupon with ID ${couponId}:`, error);
    throw error;
  }
};

// Mark a coupon as used (potentially Sub-Center or attendant action)
export const markCouponAsUsed = async (couponId: number, usageData: { used_date: string; usage_details?: string }): Promise<Coupon> => {
  try {
    const response = await apiClient.patch<Coupon>(`/coupons/${couponId}/`, usageData);
    return response.data;
  } catch (error: any) {
    console.error(`Error marking coupon with ID ${couponId} as used:`, error);
    throw error;
  }
};

// Create a new coupon (likely Main Center action - backend needs to support this)
export const createCoupon = async (couponData: Omit<Coupon, 'id' | 'status' | 'allocated_to' | 'allocated_date' | 'used_date' | 'created_at' | 'updated_at' | 'status_display' | 'book_number' | 'box_code'>): Promise<Coupon> => {
  try {
    const response = await apiClient.post<Coupon>('/coupons/', couponData);
    return response.data;
  } catch (error: any) {
    console.error('Error creating coupon:', error);
    throw error;
  }
};

// Update an existing coupon (permissions on backend will control who can do this)
export const updateCoupon = async (id: number, couponData: Omit<Coupon, 'id' | 'status' | 'allocated_to' | 'allocated_date' | 'used_date' | 'created_at' | 'updated_at' | 'status_display' | 'book_number' | 'box_code'>): Promise<Coupon> => {
  try {
    const response = await apiClient.put<Coupon>(`/coupons/${id}/`, couponData);
    return response.data;
  } catch (error: any) {
    console.error(`Error updating coupon with ID ${id}:`, error);
    throw error;
  }
};

// Bulk allocate coupons to beneficiaries
async function bulkAllocate(data: { coupon_numbers: string[]; beneficiary_id: number }): Promise<any> {
  try {
    const response = await apiClient.post('/coupons/bulk-allocate/', data, { headers: authHeader() });
    return response.data;
  } catch (error: any) {
    console.error('Error bulk allocating coupons:', error.message);
    throw error;
  }
}

// Delete a coupon (likely Main Center action - backend needs to support this)
export const deleteCoupon = async (id: number): Promise<void> => {
  try {
    await apiClient.delete(`/coupons/${id}/`);
  } catch (error: any) {
    console.error(`Error deleting coupon with ID ${id}:`, error);
    throw error;
  }
};

export const CouponService = {
  getStatistics,
  fetchCoupons,
  fetchCouponById,
  allocateCoupon,
  markCouponAsUsed,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  bulkAllocate,
};