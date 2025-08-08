// src/api/audit.ts
import apiClient from './apiClient';

export interface AuditLog {
  id: string;
  timestamp: string;
  user: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    role: string;
  };
  action: string;
  resource_type: string;
  resource_id: string;
  ip_address: string;
  user_agent: string;
  changes: any;
  status: 'success' | 'failed' | 'warning';
  details: string;
}

export interface AuditFilters {
  search?: string;
  action?: string;
  resource_type?: string;
  status?: string;
  user_id?: string;
  start_date?: string;
  end_date?: string;
}

export class AuditService {
  static async getAuditLogs(filters?: AuditFilters): Promise<AuditLog[]> {
    const response = await apiClient.get('/audit-logs/', { params: filters });
    return response.data.results || response.data;
  }

  static async getAuditLogById(id: string): Promise<AuditLog> {
    const response = await apiClient.get(`/audit-logs/${id}/`);
    return response.data;
  }

  static async getFilterOptions(): Promise<{
    actions: string[];
    resources: string[];
    users: Array<{ id: string; username: string; full_name: string; role: string }>;
  }> {
    const response = await apiClient.get('/audit-logs/filter-options/');
    return response.data;
  }

  static async exportAuditLogs(filters?: AuditFilters): Promise<Blob> {
    const response = await apiClient.get('/audit-logs/export/', {
      params: filters,
      responseType: 'blob'
    });
    return response.data;
  }

  static async getAuditStatistics(filters?: AuditFilters) {
    const response = await apiClient.get('/audit-logs/statistics/', { params: filters });
    return response.data;
  }
}
