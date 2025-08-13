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
    return response.data;
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

}

// Export a singleton instance
export const adminService = new AdminService();

// Type exports
export type { AdminDashboardStats, FuelStats };
