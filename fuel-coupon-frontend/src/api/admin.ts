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
    return this.fetchWithAuthRetry<AdminDashboardStats>('/api/v1/admin/dashboard/');
  }

  /**
   * Get fuel statistics
   */
  async getFuelStatistics(): Promise<FuelStats> {
    return this.fetchWithAuthRetry<FuelStats>('/api/v1/fuel-stats/');
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
   * Generic fetch handler with automatic token refresh retry
   */
  private async fetchWithAuthRetry<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      return await this.fetchAuthenticated<T>(endpoint, options);
    } catch (error) {
      if (this.isTokenExpiredError(error)) {
        try {
          await this.refreshToken();
          return await this.fetchAuthenticated<T>(endpoint, options);
        } catch (refreshError) {
          this.handleAuthError(refreshError as Error);
          throw new Error('Session expired. Please login again.');
        }
      }
      this.handleServiceError(error, 'Request failed');
      throw error;
    }
  }

  /**
   * Fetch with access token
   */
  private async fetchAuthenticated<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) throw new Error('Authentication required');

    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await this.parseErrorResponse(response);
      throw errorData;
    }

    return response.json();
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshToken(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) throw new Error('No refresh token available');

    const response = await fetch('/api/v1/token/refresh/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      const errorData = await this.parseErrorResponse(response);
      throw errorData;
    }

    const { access }: TokenRefreshResponse = await response.json();
    localStorage.setItem('access_token', access);
  }

  /**
   * Parse error response and return as Error object
   */
  private async parseErrorResponse(response: Response): Promise<Error> {
    try {
      const errorData = await response.json();
      const message = errorData?.detail || errorData?.message || JSON.stringify(errorData);
      return new Error(`HTTP ${response.status}: ${message}`);
    } catch {
      const text = await response.text();
      return new Error(`HTTP ${response.status}: ${text}`);
    }
  }

  /**
   * Detect token expiration from error
   */
  private isTokenExpiredError(error: any): boolean {
    const message = error?.message || '';
    return (
      message.includes('token_not_valid') ||
      message.includes('401') ||
      message.toLowerCase().includes('authentication')
    );
  }

  /**
   * Handle authentication error: show toast, clear tokens
   */
  private handleAuthError(error: Error): void {
    console.error('Authentication error:', error);
    toast.error('Session expired. Please login again.', {
      position: 'top-right',
      autoClose: 5000,
    });
    this.clearAuthTokens();
  }

  /**
   * Handle other service errors with toast
   */
  private handleServiceError(error: unknown, context: string): void {
    console.error(`${context}:`, error);
    const message = error instanceof Error ? error.message : String(error);
    toast.error(`${context}: ${message}`, {
      position: 'top-right',
      autoClose: 5000,
    });
  }

  /**
   * Clear local tokens
   */
  private clearAuthTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
}

// Export a singleton instance
export const adminService = new AdminService();

// Type exports
export type { AdminDashboardStats, FuelStats };
