// src/api/audit.ts
import apiClient from './index';
import type { 
  AuditLog, 
  AuditTransaction, 
  ComplianceReport, 
  AuditStats,
  SecurityEvent,
  AuditLogFilters 
} from '../types/audit';

export interface FilterOptions {
  users: Array<{ id: number; username: string; full_name: string }>;
  actions: string[];
  content_types: string[];
  severities: string[];
}

class AuditAPI {
  // Get audit logs with filtering and pagination
  async getAuditLogs(filters: AuditLogFilters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });
    
    const response = await apiClient.get(`/v1/audit-logs/?${params.toString()}`);
    return response.data;
  }

  // Get filter options for audit logs
  async getFilterOptions() {
    const response = await apiClient.get('/v1/audit-logs/filter-options/');
    return response.data as FilterOptions;
  }

  // Get transaction statistics
  async getTransactionStats() {
    const response = await apiClient.get('/audit/transaction-stats/');
    return response.data;
  }

  // Get audit transactions for transaction audit page
  async getTransactions(filters: AuditLogFilters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });
    
    const response = await apiClient.get(`/audit/transactions/?${params.toString()}`);
    return response.data;
  }

  // Get security events
  async getSecurityEvents() {
    const response = await apiClient.get('/v1/audit-logs/security-events/');
    return response.data;
  }

  // Export audit data
  async exportAuditData(format: string, startDate?: string, endDate?: string) {
    const response = await apiClient.post('/v1/audit-logs/export-audit-data/', {
      format,
      start_date: startDate,
      end_date: endDate
    }, {
      responseType: format === 'csv' ? 'blob' : 'json'
    });
    
    if (format === 'csv') {
      // Handle CSV download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    }
    
    return response.data;
  }

  // Get audit trail for specific object
  async getAuditTrail(contentType: string, objectId: string) {
    const response = await apiClient.get(`/audit-logs/?content_type=${contentType}&object_id=${objectId}`);
    return response.data;
  }

  // Get compliance statistics
  async getComplianceStats(period: string = 'month') {
    const response = await apiClient.get(`/audit/compliance-stats/?period=${period}`);
    return response.data;
  }

  // Get compliance reports
  async getComplianceReports(period: string = 'month') {
    const response = await apiClient.get(`/audit/compliance-reports/?period=${period}`);
    return response.data;
  }

  // Generate compliance report
  async generateComplianceReport(type: string, period: string) {
    const response = await apiClient.post('/audit/compliance-reports/', {
      type,
      period
    });
    return response.data;
  }
}

export const auditAPI = new AuditAPI();
export default auditAPI;