// src/api/fuelDistribution.ts
import apiClient, { authHeader } from './index';

export interface FuelDistribution {
  id: string;
  coupon: {
    id: string;
    coupon_number: string;
    fuel_type: 'PETROL' | 'DIESEL';
    denomination: number;
    status: string;
  };
  beneficiary: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  distributed_by: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
  };
  distribution_date: string;
  notes: string;
}

export interface FuelTransaction {
  id: string;
  timestamp: string;
  beneficiary: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
  };
  coupon?: {
    id: string;
    coupon_number: string;
    fuel_type: 'PETROL' | 'DIESEL';
  };
  litres_consumed: string;
  transaction_location?: string;
  recorded_by?: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
  };
  notes: string;
  fuel_amount: string;
  transaction_date: string;
}

export interface CreateDistributionData {
  coupon: string;
  beneficiary: string;
  notes?: string;
}

export const FuelDistributionService = {
  // Get all fuel distributions
  getDistributions: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    beneficiary?: string;
    fuel_type?: string;
    date_from?: string;
    date_to?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const response = await apiClient.get(`/api/v1/coupon-distributions/?${queryParams}`, {
      headers: authHeader(),
    });
    return response.data;
  },

  // Get distribution by ID
  getDistribution: async (id: string): Promise<FuelDistribution> => {
    const response = await apiClient.get(`/api/v1/coupon-distributions/${id}/`, {
      headers: authHeader(),
    });
    return response.data;
  },

  // Create new distribution
  createDistribution: async (data: CreateDistributionData): Promise<FuelDistribution> => {
    const response = await apiClient.post('/api/v1/coupon-distributions/', data, {
      headers: authHeader(),
    });
    return response.data;
  },

  // Update distribution
  updateDistribution: async (id: string, data: Partial<CreateDistributionData>): Promise<FuelDistribution> => {
    const response = await apiClient.patch(`/api/v1/coupon-distributions/${id}/`, data, {
      headers: authHeader(),
    });
    return response.data;
  },

  // Delete distribution
  deleteDistribution: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/coupon-distributions/${id}/`, {
      headers: authHeader(),
    });
  },

  // Get fuel transactions
  getTransactions: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    beneficiary?: string;
    fuel_type?: string;
    date_from?: string;
    date_to?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const response = await apiClient.get(`/api/v1/fuel-transactions/?${queryParams}`, {
      headers: authHeader(),
    });
    return response.data;
  },

  // Get transaction by ID
  getTransaction: async (id: string): Promise<FuelTransaction> => {
    const response = await apiClient.get(`/api/v1/fuel-transactions/${id}/`, {
      headers: authHeader(),
    });
    return response.data;
  },

  // Get distribution statistics
  getDistributionStats: async () => {
    const response = await apiClient.get('/api/v1/coupon-distributions/statistics/', {
      headers: authHeader(),
    });
    return response.data;
  },
};
