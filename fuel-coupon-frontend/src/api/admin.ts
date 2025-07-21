// src/api/admin.ts

import { toast } from 'react-toastify';
import type { AdminDashboardStats } from '@/types/admin';
import type { FuelStats } from '@/types/fuel';

interface TokenRefreshResponse {
  access: string;
  refresh?: string;
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
