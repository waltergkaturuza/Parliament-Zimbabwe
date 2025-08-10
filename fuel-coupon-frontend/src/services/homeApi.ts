// src/services/homeApi.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const homeApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for error handling
homeApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export interface HomeStats {
  active_users: number;
  sub_centers: number;
  distributed_coupons: number;
  success_rate: number;
}

export interface ActivityItem {
  type?: string;
  title: string;
  description: string;
  time?: string;
  time_display?: string;
  icon_type?: string;
  icon?: React.ReactNode;
}

export interface SystemHealth {
  server_performance: number;
  database_health: number;
  security_score: number;
  user_satisfaction: number;
}

export interface QuickInsights {
  monthly_trend: number;
  current_month_distributions: number;
  recent_dispatches: number;
  pending_approvals: number;
}

export interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
}

export const homeApiService = {
  // Get homepage statistics
  async getStats(): Promise<HomeStats> {
    try {
      const response = await homeApi.get<ApiResponse<HomeStats>>('/api/v1/home/stats/');
      if (response.data.status === 'success') {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch stats');
    } catch (error: any) {
      console.error('Error fetching home stats:', error);
      // Safe fallback while backend endpoints deploy
      if (error?.response?.status === 404) {
        return {
          active_users: 0,
          sub_centers: 0,
          distributed_coupons: 0,
          success_rate: 0,
        };
      }
      throw error;
    }
  },

  // Get recent activity
  async getRecentActivity(): Promise<ActivityItem[]> {
    try {
      const response = await homeApi.get<ApiResponse<ActivityItem[]>>('/api/v1/home/activity/');
      if (response.data.status === 'success') {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch activity');
    } catch (error: any) {
      console.error('Error fetching recent activity:', error);
      // Safe fallback while backend endpoints deploy
      if (error?.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },

  // Get system health metrics
  async getSystemHealth(): Promise<SystemHealth> {
    try {
      const response = await homeApi.get<ApiResponse<SystemHealth>>('/api/v1/home/health/');
      if (response.data.status === 'success') {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch health metrics');
    } catch (error) {
      console.error('Error fetching system health:', error);
      throw error;
    }
  },

  // Get quick insights
  async getQuickInsights(): Promise<QuickInsights> {
    try {
      const response = await homeApi.get<ApiResponse<QuickInsights>>('/api/v1/home/insights/');
      if (response.data.status === 'success') {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch insights');
    } catch (error: any) {
      console.error('Error fetching quick insights:', error);
      // Safe fallback while backend endpoints deploy
      if (error?.response?.status === 404) {
        return {
          monthly_trend: 0,
          current_month_distributions: 0,
          recent_dispatches: 0,
          pending_approvals: 0,
        };
      }
      throw error;
    }
  }
};

export default homeApiService;
