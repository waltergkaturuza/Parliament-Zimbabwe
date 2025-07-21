// src/types/admin.ts
export interface AdminDashboardStats {
  total_users: number;
  active_today: number;
  active_trend?: number;
  active_percentage?: number;
  system_status?: string;
  system_health?: 'good' | 'warning' | 'critical';
  pending_actions?: number;
  pending_alert_level?: 'low' | 'medium' | 'high';
  new_users_this_week?: number;
  new_users_last_week?: number;
  total_coupons?: number;
  total_fuel_volume_available?: number;
  total_fuel_volume_consumed?: number;
  total_coupons_available?: number;
  total_coupons_allocated?: number;
  total_coupons_used?: number;
  total_coupons_expired?: number;
  total_coupons_damaged?: number;
  coupon_allocation_rate?: number;
  coupon_usage_rate?: number;
  coupon_status_distribution?: {
    [key: string]: number;
  };
  recently_allocated_coupons?: Array<{
    id: string;
    status: string;
    allocated_to?: {
      username: string;
    };
    allocated_date?: string;
  }>;
  low_coupon_stock_alert?: string;
  recent_activity?: Array<{
    id: string;
    action: string;
    user: string;
    timestamp: string;
    details?: string;
  }>;
  fuel_stats?: {
    total_allocated: number;
    total_consumed: number;
    remaining: number;
    trends: {
      week: number;
      month: number;
    };
  };
}