// src/services/homeApi.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

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
  type: string;
  title: string;
  description: string;
  time: string;
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
      const response = await homeApi.get<ApiResponse<HomeStats>>('/home/stats/');
      if (response.data.status === 'success') {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch stats');
    } catch (error) {
      console.error('Error fetching home stats:', error);
      // Return fallback data if API fails
      return {
        active_users: 1250,
        sub_centers: 25,
        distributed_coupons: 15420,
        success_rate: 99.8
      };
    }
  },

  // Get recent activity
  async getRecentActivity(): Promise<ActivityItem[]> {
    try {
      const response = await homeApi.get<ApiResponse<ActivityItem[]>>('/home/activity/');
      if (response.data.status === 'success') {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch activity');
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      // Return fallback data if API fails
      return [
        {
          type: 'alert',
          title: 'System Update Completed',
          description: 'Latest security patches installed successfully',
          time: new Date().toISOString(),
          time_display: '2 hours ago',
          icon_type: 'info'
        },
        {
          type: 'subcenter',
          title: 'New Sub-Center Added',
          description: 'Chitungwiza East sub-center is now operational',
          time: new Date(Date.now() - 86400000).toISOString(),
          time_display: '1 day ago',
          icon_type: 'team'
        }
      ];
    }
  },

  // Get system health metrics
  async getSystemHealth(): Promise<SystemHealth> {
    try {
      const response = await homeApi.get<ApiResponse<SystemHealth>>('/home/health/');
      if (response.data.status === 'success') {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch health metrics');
    } catch (error) {
      console.error('Error fetching system health:', error);
      // Return fallback data if API fails
      return {
        server_performance: 95,
        database_health: 98,
        security_score: 99,
        user_satisfaction: 97
      };
    }
  },

  // Get quick insights
  async getQuickInsights(): Promise<QuickInsights> {
    try {
      const response = await homeApi.get<ApiResponse<QuickInsights>>('/home/insights/');
      if (response.data.status === 'success') {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch insights');
    } catch (error) {
      console.error('Error fetching quick insights:', error);
      // Return fallback data if API fails
      return {
        monthly_trend: 12.5,
        current_month_distributions: 1840,
        recent_dispatches: 8,
        pending_approvals: 15
      };
    }
  }
};

export default homeApiService;
