// src/api/admin.ts

import apiClient from './index';
import { toast } from 'react-toastify';
import type { AdminDashboardStats } from '@/types/admin';
import type { FuelStats } from '@/types/fuel';

interface TokenRefreshResponse {
  access: string;
  refresh?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  role_display?: string;
  is_active: boolean;
  is_approved: boolean;
  date_joined: string;
  last_login?: string;
  phone?: string;
  
  // Profile fields
  digital_signature?: string;
  signature_uploaded_at?: string;
  profile_picture?: string;
  full_address?: string;
  national_id?: string;
  last_activity?: string;
  
  // Approval workflow
  approved_by?: number;
  approved_by_details?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  approved_at?: string;
  registration_justification?: string;
  rejection_reason?: string;
  approval_status?: string;
  
  // Sub center relationship
  sub_center?: number;
  sub_center_details?: {
    id: number;
    name: string;
    code: string;
  };
  
  // Computed fields
  full_name?: string;
  can_login?: boolean;
}

export interface UserStats {
  total_users: number;
  active_users: number;
  new_users_today: number;
  users_by_role: Record<string, number>;
}

export interface SubCenter {
  id: number;
  code: string;
  name: string;
  location?: string;
  is_active: boolean;
}

class AdminService {
  /**
   * Get admin dashboard statistics
   */
  async getAdminStatistics(): Promise<AdminDashboardStats> {
    const response = await apiClient.get('/admin/dashboard/');
    const data = response.data;

    // If backend already matches the expected shape, return as-is
    if (
      typeof data === 'object' && data !== null &&
      (
        // Full shape already provided by backend
        ('total_users' in data && 'total_coupons' in data) ||
        // Or explicit distribution provided (and likely others)
        'coupon_status_distribution' in data
      )
    ) {
      return data as AdminDashboardStats;
    }

    // Map nested backend payload (users/inventory/coupons/operations/system)
    // into the flat AdminDashboardStats shape expected by the UI
  const users = data?.users ?? {};
  const coupons = data?.coupons ?? {};
  const operations = data?.operations ?? {};
  const system = data?.system ?? {};

    const totalCoupons: number = Number(coupons.total ?? 0);
    const allocatedCoupons: number = Number(coupons.allocated ?? 0);
    const usedCoupons: number = Number(coupons.used ?? 0);
    const availableCoupons: number = Number(coupons.available ?? 0);

    const mapped: AdminDashboardStats = {
      // Prefer top-level values if backend provided them; otherwise use nested
      total_users: Number((data?.total_users ?? users.total) ?? 0),
      active_today: Number((data?.active_today ?? users.active) ?? 0),
      system_status: system.active_alerts > 0 ? 'degraded' : 'ok',
      system_health: system.active_alerts > 0 ? 'warning' : 'good',
      pending_actions: Number(users.pending_approvals ?? data?.pending_actions ?? 0),

      total_coupons: Number((data?.total_coupons ?? totalCoupons) ?? 0),
      total_coupons_available: Number((data?.total_coupons_available ?? availableCoupons) ?? 0),
      total_coupons_allocated: Number((data?.total_coupons_allocated ?? allocatedCoupons) ?? 0),
      total_coupons_used: Number((data?.total_coupons_used ?? usedCoupons) ?? 0),

      coupon_allocation_rate: (Number((data?.total_coupons ?? totalCoupons) ?? 0) > 0)
        ? Math.round((Number((data?.total_coupons_allocated ?? allocatedCoupons) ?? 0) / Number((data?.total_coupons ?? totalCoupons) ?? 0)) * 100)
        : 0,
      coupon_usage_rate: (Number((data?.total_coupons ?? totalCoupons) ?? 0) > 0)
        ? Math.round((Number((data?.total_coupons_used ?? usedCoupons) ?? 0) / Number((data?.total_coupons ?? totalCoupons) ?? 0)) * 100)
        : 0,

      coupon_status_distribution: data?.coupon_status_distribution ?? {
        AVAILABLE: availableCoupons,
        ALLOCATED: allocatedCoupons,
        USED: usedCoupons,
      },

      // Fuel volumes — use backend-provided top-level values when present
      total_fuel_volume_available: Number(data?.total_fuel_volume_available ?? 0),
      total_fuel_volume_consumed: Number(data?.total_fuel_volume_consumed ?? 0),

      // Recent activity items (pass through when available)
      recent_activity: Array.isArray(data?.recent_activity) ? data.recent_activity : [],
      recently_allocated_coupons: Array.isArray(data?.recently_allocated_coupons) ? data.recently_allocated_coupons : [],
    };

    return mapped;
  }

  /**
   * Get fuel statistics
   */
  async getFuelStatistics(): Promise<FuelStats> {
    const response = await apiClient.get('/fuel-stats/');
    return response.data;
  }

  /**
   * Get all users for admin management
   */
  async getUsers(params?: {
    search?: string;
    role?: string;
    is_active?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<{ results: User[]; count: number }> {
  const response = await apiClient.get('/users/', { params });
    return response.data;
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<UserStats> {
  const response = await apiClient.get('/users/stats/');
    return response.data;
  }

  /**
   * Create a new user
   */
  async createUser(userData: Partial<User>): Promise<User> {
  const response = await apiClient.post('/users/', userData);
    return response.data;
  }

  /**
   * Update user
   */
  async updateUser(userId: number, userData: Partial<User>): Promise<User> {
  const response = await apiClient.patch(`/users/${userId}/`, userData);
    return response.data;
  }

  /**
   * Delete user
   */
  async deleteUser(userId: number): Promise<void> {
  await apiClient.delete(`/users/${userId}/`);
  }

  /**
   * Approve user
   */
  async approveUser(userId: number): Promise<User> {
  const response = await apiClient.post(`/users/${userId}/approve_user/`);
    return response.data;
  }

  /**
   * Reject user
   */
  async rejectUser(userId: number, reason: string): Promise<void> {
  await apiClient.post(`/users/${userId}/reject_user/`, { reason });
  }

  /**
   * Get pending user approvals
   */
  async getPendingApprovals(): Promise<{ count: number; users: User[] }> {
  const response = await apiClient.get('/users/pending_approvals/');
    return response.data;
  }

  /**
   * Get all sub-centers
   */
  async getSubCenters(): Promise<SubCenter[]> {
    const response = await apiClient.get('/subcenters/');
    return response.data.results || response.data;
  }

  /**
   * Get available user roles from backend
   */
  async getRoles(): Promise<Array<{ code: string; name: string }>> {
    const response = await apiClient.get('/auth/roles/');
    return response.data.roles || [];
  }

}

// Export a singleton instance
export const adminService = new AdminService();

// Type exports
export type { AdminDashboardStats, FuelStats };
