// src/api/reports.ts
import apiClient from './apiClient';

export interface FuelConsumptionData {
  daily: Array<{
    date: string;
    petrol: number;
    diesel: number;
    total: number;
  }>;
  monthly: Array<{
    month: string;
    petrol: number;
    diesel: number;
    total: number;
  }>;
  by_subcenter: Array<{
    subcenter: string;
    total: number;
    percentage: number;
  }>;
}

export interface UserActivityData {
  registrations: Array<{
    date: string;
    count: number;
  }>;
  logins: Array<{
    date: string;
    count: number;
  }>;
  active_users: number;
  total_users: number;
  growth_rate: number;
}

export interface SystemPerformanceData {
  response_times: Array<{
    date: string;
    avg_response: number;
    api_calls: number;
  }>;
  error_rates: Array<{
    date: string;
    errors: number;
    total: number;
    rate: number;
  }>;
  uptime: number;
  availability: number;
  peak_load: number;
}

export interface ReportFilters {
  start_date?: string;
  end_date?: string;
  report_type?: string;
  subcenter?: string;
}

export class ReportsService {
  static async getFuelConsumptionReport(filters: ReportFilters): Promise<FuelConsumptionData> {
    const response = await apiClient.get('/reports/fuel-consumption/', { params: filters });
    return response.data;
  }

  static async getUserActivityReport(filters: ReportFilters): Promise<UserActivityData> {
    const response = await apiClient.get('/reports/user-activity/', { params: filters });
    return response.data;
  }

  static async getSystemPerformanceReport(filters: ReportFilters): Promise<SystemPerformanceData> {
    const response = await apiClient.get('/reports/system-performance/', { params: filters });
    return response.data;
  }

  static async exportReport(reportType: string, filters: ReportFilters): Promise<Blob> {
    const response = await apiClient.get(`/reports/${reportType}/export/`, {
      params: filters,
      responseType: 'blob'
    });
    return response.data;
  }

  static async getReportSummary(filters: ReportFilters) {
    const response = await apiClient.get('/reports/summary/', { params: filters });
    return response.data;
  }

  static async getAvailableReports() {
    const response = await apiClient.get('/reports/available/');
    return response.data;
  }
}
