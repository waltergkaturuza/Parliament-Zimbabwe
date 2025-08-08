// src/api/analytics.ts
import apiClient from './apiClient';

export interface UsageData {
  totalCouponsIssued: number;
  totalCouponsUsed: number;
  totalFuelLiters: number;
  totalCostUSD: number;
  usageRate: number;
  dailyUsage: Array<{
    date: string;
    coupons: number;
    liters: number;
    cost: number;
  }>;
  subCenterUsage: Array<{
    subCenter: string;
    coupons: number;
    liters: number;
    cost: number;
  }>;
  beneficiaryUsage: Array<{
    beneficiary: string;
    coupons: number;
    liters: number;
    cost: number;
  }>;
  fuelTypeBreakdown: Array<{
    type: string;
    value: number;
    percentage: number;
  }>;
}

export interface AnalyticsParams {
  start_date?: string;
  end_date?: string;
  sub_center?: string;
}

export class AnalyticsService {
  static async getUsageAnalytics(params: AnalyticsParams): Promise<UsageData> {
    const response = await apiClient.get('/analytics/', { params });
    return response.data;
  }

  static async exportAnalytics(params: AnalyticsParams): Promise<Blob> {
    const response = await apiClient.get('/analytics/export/', {
      params,
      responseType: 'blob'
    });
    return response.data;
  }

  static async getFuelConsumption(params: AnalyticsParams) {
    const response = await apiClient.get('/analytics/fuel-consumption/', { params });
    return response.data;
  }

  static async getCostAnalysis(params: AnalyticsParams) {
    const response = await apiClient.get('/analytics/cost-analysis/', { params });
    return response.data;
  }

  static async getBeneficiaryStats(params: AnalyticsParams) {
    const response = await apiClient.get('/analytics/beneficiary-stats/', { params });
    return response.data;
  }

  static async getSubCenterStats(params: AnalyticsParams) {
    const response = await apiClient.get('/analytics/subcenter-stats/', { params });
    return response.data;
  }
}
