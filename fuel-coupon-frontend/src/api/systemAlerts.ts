// src/api/systemAlerts.ts
import apiClient from './index';

export interface SystemAlert {
  id: number;
  title: string;
  message: string;
  alert_type: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' | 'SECURITY';
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';
  priority: 1 | 2 | 3 | 4; // Low, Medium, High, Critical
  target_roles?: string[] | null;
  expires_at?: string | null;
  is_dismissible: boolean;
  created: string;
  modified: string;
  created_by?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  acknowledged_by?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  acknowledged_at?: string;
  created_by_details?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
}

export interface AlertStats {
  total_alerts: number;
  active_alerts: number;
  resolved_alerts: number;
  dismissed_alerts: number;
  acknowledged_alerts: number;
  expired_alerts: number;
  alerts_by_type: Record<string, number>;
  alerts_by_priority: Record<string, number>;
  recent_alerts: number;
  recent_critical: number;
  active_critical: number;
  active_high: number;
  last_updated: string;
}

export interface AlertFilters {
  search?: string;
  status?: string;
  alert_type?: string;
  priority?: string;
  start_date?: string;
  end_date?: string;
  show_expired?: boolean;
}

export const systemAlertsApi = {
  // Get all alerts with optional filters
  getAlerts: async (filters?: AlertFilters): Promise<SystemAlert[]> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.alert_type) params.append('alert_type', filters.alert_type);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.show_expired) params.append('show_expired', 'true');

    const response = await apiClient.get(`/system-alerts/?${params.toString()}`);
    return response.data;
  },

  // Get alert statistics
  getAlertStats: async (): Promise<AlertStats> => {
    const response = await apiClient.get('/system-alerts/stats/');
    return response.data;
  },

  // Get single alert by ID
  getAlert: async (id: number): Promise<SystemAlert> => {
    const response = await apiClient.get(`/system-alerts/${id}/`);
    return response.data;
  },

  // Create new alert
  createAlert: async (alertData: Partial<SystemAlert>): Promise<SystemAlert> => {
    const response = await apiClient.post('/system-alerts/', alertData);
    return response.data;
  },

  // Update existing alert
  updateAlert: async (id: number, alertData: Partial<SystemAlert>): Promise<SystemAlert> => {
    const response = await apiClient.put(`/system-alerts/${id}/`, alertData);
    return response.data;
  },

  // Delete alert
  deleteAlert: async (id: number): Promise<void> => {
    await apiClient.delete(`/system-alerts/${id}/`);
  },

  // Acknowledge alert
  acknowledgeAlert: async (id: number): Promise<SystemAlert> => {
    const response = await apiClient.post(`/system-alerts/${id}/acknowledge/`);
    return response.data;
  },

  // Resolve alert
  resolveAlert: async (id: number): Promise<SystemAlert> => {
    const response = await apiClient.post(`/system-alerts/${id}/resolve/`);
    return response.data;
  },

  // Dismiss alert
  dismissAlert: async (id: number): Promise<SystemAlert> => {
    const response = await apiClient.post(`/system-alerts/${id}/dismiss/`);
    return response.data;
  },

  // Bulk operations
  bulkAcknowledge: async (alertIds: number[]): Promise<void> => {
    await apiClient.post('/system-alerts/bulk-acknowledge/', { alert_ids: alertIds });
  },

  bulkResolve: async (alertIds: number[]): Promise<void> => {
    await apiClient.post('/system-alerts/bulk-resolve/', { alert_ids: alertIds });
  },

  bulkDismiss: async (alertIds: number[]): Promise<void> => {
    await apiClient.post('/system-alerts/bulk-dismiss/', { alert_ids: alertIds });
  },

  bulkDelete: async (alertIds: number[]): Promise<void> => {
    await apiClient.post('/system-alerts/bulk-delete/', { alert_ids: alertIds });
  }
};

export default systemAlertsApi;
