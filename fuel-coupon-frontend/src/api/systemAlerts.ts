// src/api/systemAlerts.ts
import apiClient from './apiClient';

export interface SystemAlert {
  id: number;
  title: string;
  message: string;
  alert_type: 'CRITICAL' | 'WARNING' | 'INFO' | 'SUCCESS';
  status: 'ACTIVE' | 'RESOLVED' | 'ACKNOWLEDGED';
  created: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: 'SECURITY' | 'SYSTEM' | 'INVENTORY' | 'USER_ACTIVITY' | 'PERFORMANCE';
  created_by: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  affected_systems: string[];
  resolved_at?: string;
  acknowledged_at?: string;
  resolved_by?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
}

export interface AlertsResponse {
  results: SystemAlert[];
  count: number;
  next: string | null;
  previous: string | null;
  summary: {
    total_alerts: number;
    active_alerts: number;
    critical_alerts: number;
    resolved_today: number;
  };
}

export interface AlertFilters {
  alert_type?: string;
  status?: string;
  priority?: string;
  category?: string;
  page?: number;
  page_size?: number;
}

export interface CreateAlertData {
  title: string;
  message: string;
  alert_type: 'CRITICAL' | 'WARNING' | 'INFO' | 'SUCCESS';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: 'SECURITY' | 'SYSTEM' | 'INVENTORY' | 'USER_ACTIVITY' | 'PERFORMANCE';
  affected_systems: string[];
}

class SystemAlertsService {
  async getAlerts(filters: AlertFilters = {}): Promise<AlertsResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/admin/alerts/?${params.toString()}`);
    return response.data;
  }

  async getAlert(id: number): Promise<SystemAlert> {
    const response = await apiClient.get(`/admin/alerts/${id}/`);
    return response.data;
  }

  async createAlert(alertData: CreateAlertData): Promise<SystemAlert> {
    const response = await apiClient.post('/admin/alerts/', alertData);
    return response.data;
  }

  async updateAlert(id: number, alertData: Partial<CreateAlertData>): Promise<SystemAlert> {
    const response = await apiClient.patch(`/admin/alerts/${id}/`, alertData);
    return response.data;
  }

  async resolveAlert(id: number): Promise<SystemAlert> {
    const response = await apiClient.patch(`/admin/alerts/${id}/resolve/`);
    return response.data;
  }

  async acknowledgeAlert(id: number): Promise<SystemAlert> {
    const response = await apiClient.patch(`/admin/alerts/${id}/acknowledge/`);
    return response.data;
  }

  async deleteAlert(id: number): Promise<void> {
    await apiClient.delete(`/admin/alerts/${id}/`);
  }

  async getAlertsSummary(): Promise<{
    total_alerts: number;
    active_alerts: number;
    critical_alerts: number;
    resolved_today: number;
  }> {
    const response = await apiClient.get('/admin/alerts/summary/');
    return response.data;
  }
}

export default new SystemAlertsService();
