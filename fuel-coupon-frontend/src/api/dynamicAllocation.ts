// src/api/dynamicAllocation.ts
// API service functions for Dynamic Fuel Allocation System

import apiClient from './index';
import type {
  FuelAllocationRule,
  FuelPrice,
  DynamicAllocation,
  AllocationPreviewRequest,
  AllocationPreviewResult,
  AllocationCalculationRequest,
  AllocationAnalytics,
  AllocationCommitResponse,
  DynamicAllocationApiResponse,
  EnhancedBeneficiaryProfile,
  EnhancedParliamentSession
} from '../types/dynamicAllocation';

const API_BASE = '/dynamic-allocation';

// Fuel Allocation Rules API
export const allocationRulesApi = {
  // Get all allocation rules
  getAll: async (): Promise<DynamicAllocationApiResponse<FuelAllocationRule>> => {
    const response = await apiClient.get(`${API_BASE}/rules/`);
    return response.data;
  },

  // Get single allocation rule
  getById: async (id: number): Promise<FuelAllocationRule> => {
    const response = await apiClient.get(`${API_BASE}/rules/${id}/`);
    return response.data;
  },

  // Create new allocation rule
  create: async (data: Partial<FuelAllocationRule>): Promise<FuelAllocationRule> => {
    const response = await apiClient.post(`${API_BASE}/rules/`, data);
    return response.data;
  },

  // Update allocation rule
  update: async (id: number, data: Partial<FuelAllocationRule>): Promise<FuelAllocationRule> => {
    const response = await apiClient.put(`${API_BASE}/rules/${id}/`, data);
    return response.data;
  },

  // Delete allocation rule
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${API_BASE}/rules/${id}/`);
  },

  // Get applicable rules for beneficiary
  getApplicable: async (beneficiaryId?: number): Promise<FuelAllocationRule[]> => {
    const params = beneficiaryId ? { beneficiary_id: beneficiaryId } : {};
    const response = await apiClient.get(`${API_BASE}/rules/applicable/`, { params });
    return response.data;
  }
};

// Fuel Prices API
export const fuelPricesApi = {
  // Get all fuel prices
  getAll: async (): Promise<DynamicAllocationApiResponse<FuelPrice>> => {
    const response = await apiClient.get(`${API_BASE}/prices/`);
    return response.data;
  },

  // Get current fuel price
  getCurrent: async (fuelType?: string): Promise<FuelPrice> => {
    const params = fuelType ? { fuel_type: fuelType } : {};
    const response = await apiClient.get(`${API_BASE}/prices/current/`, { params });
    return response.data;
  },

  // Create new fuel price
  create: async (data: Partial<FuelPrice>): Promise<FuelPrice> => {
    const response = await apiClient.post(`${API_BASE}/prices/`, data);
    return response.data;
  },

  // Update fuel price
  update: async (id: number, data: Partial<FuelPrice>): Promise<FuelPrice> => {
    const response = await apiClient.put(`${API_BASE}/prices/${id}/`, data);
    return response.data;
  },

  // Delete fuel price
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${API_BASE}/prices/${id}/`);
  }
};

// Dynamic Allocations API
export const dynamicAllocationsApi = {
  // Get all allocations
  getAll: async (params?: {
    session?: number;
    beneficiary?: number;
    is_committed?: boolean;
  }): Promise<DynamicAllocationApiResponse<DynamicAllocation>> => {
    const response = await apiClient.get(`${API_BASE}/allocations/`, { params });
    return response.data;
  },

  // Calculate single allocation
  calculate: async (data: AllocationCalculationRequest): Promise<AllocationPreviewResult> => {
    const response = await apiClient.post(`${API_BASE}/calculate/`, data);
    return response.data;
  },

  // Preview bulk allocations
  preview: async (data: AllocationPreviewRequest): Promise<AllocationPreviewResult[]> => {
    const response = await apiClient.post(`${API_BASE}/preview/`, data);
    return response.data;
  },

  // Commit allocations
  commit: async (data: {
    allocation_ids?: number[];
    preview_data?: AllocationPreviewResult[];
    committed_by: number;
  }): Promise<AllocationCommitResponse> => {
    const response = await apiClient.post(`${API_BASE}/commit/`, data);
    return response.data;
  },

  // Get beneficiary allocation history
  getHistory: async (beneficiaryId: number): Promise<DynamicAllocation[]> => {
    const response = await apiClient.get(`${API_BASE}/beneficiaries/${beneficiaryId}/history/`);
    return response.data;
  }
};

// Analytics API
export const allocationAnalyticsApi = {
  // Get allocation analytics
  getAnalytics: async (params?: {
    start_date?: string;
    end_date?: string;
    session_id?: number;
    constituency_id?: number;
  }): Promise<AllocationAnalytics> => {
    const response = await apiClient.get(`${API_BASE}/analytics/`, { params });
    return response.data;
  },

  // Get summary statistics
  getSummary: async (): Promise<{
    total_allocations: number;
    total_litres: number;
    total_usd: number;
    active_sessions: number;
  }> => {
    const response = await apiClient.get(`${API_BASE}/analytics/summary/`);
    return response.data;
  },

  // Export allocation data
  exportAllocations: async (params: {
    format: 'csv' | 'excel' | 'pdf';
    start_date?: string;
    end_date?: string;
    session_id?: number;
  }): Promise<Blob> => {
    const response = await apiClient.get(`${API_BASE}/analytics/export/`, {
      params,
      responseType: 'blob'
    });
    return response.data;
  }
};

// Enhanced Beneficiaries API (with dynamic allocation data)
export const enhancedBeneficiariesApi = {
  // Get all enhanced beneficiaries
  getAll: async (params?: {
    constituency?: number;
    category?: number;
    has_engine_data?: boolean;
    has_distance_data?: boolean;
  }): Promise<DynamicAllocationApiResponse<EnhancedBeneficiaryProfile>> => {
    const response = await apiClient.get('/beneficiary-profiles/', { params });
    return response.data;
  },

  // Update beneficiary with allocation data
  updateAllocationData: async (id: number, data: {
    engine_capacity_cc?: number;
    distance_from_parliament_km?: number;
  }): Promise<EnhancedBeneficiaryProfile> => {
    const response = await apiClient.patch(`/beneficiary-profiles/${id}/`, data);
    return response.data;
  },

  // Bulk update beneficiaries
  bulkUpdate: async (updates: Array<{
    id: number;
    engine_capacity_cc?: number;
    distance_from_parliament_km?: number;
  }>): Promise<{ success: boolean; updated_count: number }> => {
    const response = await apiClient.post('/beneficiary-profiles/bulk-update/', { updates });
    return response.data;
  }
};

// Enhanced Parliament Sessions API (with fuel allocation data)
export const enhancedSessionsApi = {
  // Get all enhanced sessions
  getAll: async (params?: {
    is_active?: boolean;
    has_fuel_data?: boolean;
  }): Promise<DynamicAllocationApiResponse<EnhancedParliamentSession>> => {
    const response = await apiClient.get('/parliament-sessions/', { params });
    return response.data;
  },

  // Update session with fuel data
  updateFuelData: async (id: number, data: {
    fuel_top_up_litres?: number;
    fuel_top_up_percentage?: number;
    attendance_tracked?: boolean;
    expected_attendance?: number;
  }): Promise<EnhancedParliamentSession> => {
    const response = await apiClient.patch(`/parliament-sessions/${id}/`, data);
    return response.data;
  }
};

// Utility functions
export const allocationUtils = {
  // Calculate engine constant based on capacity
  getEngineConstant: (engineCapacityCC: number): number => {
    if (engineCapacityCC < 2800) return 0.39;
    if (engineCapacityCC < 3200) return 0.43;
    return 0.56;
  },

  // Format allocation amount
  formatAllocation: (litres: number): string => {
    return `${litres.toFixed(2)}L`;
  },

  // Format USD amount
  formatUSD: (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  },

  // Format ZWG amount
  formatZWG: (amount: number): string => {
    return `ZWG ${amount.toLocaleString()}`;
  },

  // Calculate distance factor
  getDistanceFactor: (distanceKM: number): number => {
    return distanceKM * 0.001; // Standard POZ distance factor
  },

  // Calculate base allocation
  calculateBaseAllocation: (
    distanceKM: number,
    engineCapacityCC: number
  ): number => {
    const engineConstant = allocationUtils.getEngineConstant(engineCapacityCC);
    const distanceFactor = allocationUtils.getDistanceFactor(distanceKM);
    return distanceKM * engineConstant * distanceFactor;
  },

  // Convert USD to litres
  convertUSDToLitres: (usdAmount: number, fuelPriceUSD: number): number => {
    return usdAmount / fuelPriceUSD;
  },

  // Get engine category label
  getEngineCategory: (engineCapacityCC: number): string => {
    if (engineCapacityCC < 2800) return 'Small Engine (< 2800cc)';
    if (engineCapacityCC < 3200) return 'Medium Engine (2800-3199cc)';
    return 'Large Engine (≥ 3200cc)';
  }
};

// Error handling wrapper
export const withErrorHandling = async <T>(
  apiCall: () => Promise<T>,
  errorMessage?: string
): Promise<T> => {
  try {
    return await apiCall();
  } catch (error: any) {
    console.error('API Error:', error);
    
    // Handle specific error types
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 401) {
        throw new Error('Authentication required. Please log in.');
      } else if (status === 403) {
        throw new Error('Access denied. Insufficient permissions.');
      } else if (status === 404) {
        throw new Error('Resource not found.');
      } else if (status === 422) {
        throw new Error(data.detail || 'Validation error occurred.');
      } else {
        throw new Error(data.detail || errorMessage || 'Server error occurred.');
      }
    } else if (error.request) {
      // Network error
      throw new Error('Network error. Please check your connection.');
    } else {
      // Other error
      throw new Error(errorMessage || 'An unexpected error occurred.');
    }
  }
};

// Export all APIs as default
export default {
  allocationRules: allocationRulesApi,
  fuelPrices: fuelPricesApi,
  dynamicAllocations: dynamicAllocationsApi,
  analytics: allocationAnalyticsApi,
  enhancedBeneficiaries: enhancedBeneficiariesApi,
  enhancedSessions: enhancedSessionsApi,
  utils: allocationUtils,
  withErrorHandling
};
