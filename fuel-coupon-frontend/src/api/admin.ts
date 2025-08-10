// src/api/admin.ts

import apiClient from './index';
import { toast } from 'react-toastify';
import type { AdminDashboardStats } from '@/types/admin';
import type { FuelStats } from '@/types/fuel';

interface TokenRefreshResponse {
  access: string;
  refresh?: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  is_approved: boolean;
  date_joined: string;
  last_login?: string;
  phone?: string;
  sub_center?: {
    id: number;
    name: string;
  };
}

interface UserStats {
  total_users: number;
  active_users: number;
  new_users_today: number;
  users_by_role: Record<string, number>;
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
    const response = await apiClient.get('/api/v1/users/', { params });
    return response.data;
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<UserStats> {
    const response = await apiClient.get('/api/v1/users/stats/');
    return response.data;
  }

  /**
   * Create a new user
   */
  async createUser(userData: Partial<User>): Promise<User> {
    const response = await apiClient.post('/api/v1/users/', userData);
    return response.data;
  }

  /**
   * Update user
   */
  async updateUser(userId: number, userData: Partial<User>): Promise<User> {
    const response = await apiClient.patch(`/api/v1/users/${userId}/`, userData);
    return response.data;
  }

  /**
   * Delete user
   */
  async deleteUser(userId: number): Promise<void> {
    await apiClient.delete(`/api/v1/users/${userId}/`);
  }

  /**
   * Approve user
   */
  async approveUser(userId: number): Promise<User> {
    const response = await apiClient.post(`/api/v1/users/${userId}/approve_user/`);
    return response.data;
  }

  /**
   * Reject user
   */
  async rejectUser(userId: number, reason: string): Promise<void> {
    await apiClient.post(`/api/v1/users/${userId}/reject_user/`, { reason });
  }

  /**
   * Get pending user approvals
   */
  async getPendingApprovals(): Promise<{ count: number; users: User[] }> {
    const response = await apiClient.get('/api/v1/users/pending_approvals/');
    return response.data;
  }

}

// Export a singleton instance
export const adminService = new AdminService();

// Type exports
export type { AdminDashboardStats, FuelStats };
