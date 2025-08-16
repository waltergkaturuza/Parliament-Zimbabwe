// src/api/beneficiaries.ts
import apiClient from './index';

export interface Beneficiary {
  id: string;
  parliamentaryId: string;
  name: string;
  title: string;
  category: {
    name: string;
    description: string;
    id: number;
  } | string; // Support both object and string for backward compatibility
  constituency?: {
    name: string;
    province: string;
    district: string;
    id: number;
  } | string; // Support both object and string for backward compatibility
  party: string;
  phoneNumber: string;
  email: string;
  address: string;
  dateOfBirth: string;
  nationalId: string;
  profilePhoto?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  entitlements: {
    monthlyAllocation: number;
    maxPerTransaction: number;
    vehicleCount: number;
  };
  fuelUsage: {
    currentMonth: number;
    lastMonth: number;
    yearToDate: number;
    totalUsed: number;
  };
  vehicles: Array<{
    id: string;
    registration: string;
    make: string;
    model: string;
    year: number;
    fuelType: 'PETROL' | 'DIESEL';
  }>;
  lastActivity: string;
  createdAt: string;
}

export interface BeneficiaryParams {
  search?: string;
  category?: string;
  status?: string;
  constituency?: string;
  party?: string;
  page?: number;
  page_size?: number;
}

export interface BeneficiaryListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Beneficiary[];
}

export interface BeneficiaryStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
}

export interface BeneficiaryCategory {
  id: number;
  name: string;
}

export interface Constituency {
  id: number;
  name: string;
}

const BeneficiaryService = {
  getBeneficiaries: async (params: BeneficiaryParams = {}): Promise<BeneficiaryListResponse> => {
    try {
      console.log('BeneficiaryService.getBeneficiaries called with:', params);
      const response = await apiClient.get<BeneficiaryListResponse>('/beneficiaries/', { params });
      console.log('BeneficiaryService.getBeneficiaries response:', response.status, response.data);
      return response.data;
    } catch (error: any) {
      console.error('BeneficiaryService.getBeneficiaries error:', error);
      return {
        count: 0,
        next: null,
        previous: null,
        results: []
      };
    }
  },

  getBeneficiary: async (id: string): Promise<Beneficiary | null> => {
    try {
      console.log('BeneficiaryService.getBeneficiary called with id:', id);
      const response = await apiClient.get<Beneficiary>(`/beneficiaries/${id}/`);
      console.log('BeneficiaryService.getBeneficiary response:', response.status, response.data);
      return response.data;
    } catch (error: any) {
      console.error('BeneficiaryService.getBeneficiary error:', error);
      return null;
    }
  },

  createBeneficiary: async (data: Partial<Beneficiary>): Promise<Beneficiary | null> => {
    try {
      console.log('BeneficiaryService.createBeneficiary called with:', data);
      const response = await apiClient.post<Beneficiary>('/beneficiaries/', data);
      console.log('BeneficiaryService.createBeneficiary response:', response.status, response.data);
      return response.data;
    } catch (error: any) {
      console.error('BeneficiaryService.createBeneficiary error:', error);
      throw error;
    }
  },

  updateBeneficiary: async (id: string, data: Partial<Beneficiary>): Promise<Beneficiary | null> => {
    try {
      console.log('BeneficiaryService.updateBeneficiary called with:', id, data);
      const response = await apiClient.patch<Beneficiary>(`/beneficiaries/${id}/`, data);
      console.log('BeneficiaryService.updateBeneficiary response:', response.status, response.data);
      return response.data;
    } catch (error: any) {
      console.error('BeneficiaryService.updateBeneficiary error:', error);
      throw error;
    }
  },

  deleteBeneficiary: async (id: string): Promise<boolean> => {
    try {
      console.log('BeneficiaryService.deleteBeneficiary called with id:', id);
      await apiClient.delete(`/beneficiaries/${id}/`);
      console.log('BeneficiaryService.deleteBeneficiary success');
      return true;
    } catch (error: any) {
      console.error('BeneficiaryService.deleteBeneficiary error:', error);
      throw error;
    }
  },

  // New enhanced methods
  activateBeneficiary: async (id: string): Promise<boolean> => {
    try {
      console.log('BeneficiaryService.activateBeneficiary called with id:', id);
      await apiClient.post(`/beneficiaries/${id}/activate/`);
      console.log('BeneficiaryService.activateBeneficiary success');
      return true;
    } catch (error: any) {
      console.error('BeneficiaryService.activateBeneficiary error:', error);
      throw error;
    }
  },

  deactivateBeneficiary: async (id: string): Promise<boolean> => {
    try {
      console.log('BeneficiaryService.deactivateBeneficiary called with id:', id);
      await apiClient.post(`/beneficiaries/${id}/deactivate/`);
      console.log('BeneficiaryService.deactivateBeneficiary success');
      return true;
    } catch (error: any) {
      console.error('BeneficiaryService.deactivateBeneficiary error:', error);
      throw error;
    }
  },

  getAllocationHistory: async (id: string): Promise<any[]> => {
    try {
      console.log('BeneficiaryService.getAllocationHistory called with id:', id);
      const response = await apiClient.get(`/beneficiaries/${id}/allocation-history/`);
      console.log('BeneficiaryService.getAllocationHistory response:', response.status, response.data);
      return response.data;
    } catch (error: any) {
      console.error('BeneficiaryService.getAllocationHistory error:', error);
      return [];
    }
  },

  getCategories: async (): Promise<BeneficiaryCategory[]> => {
    try {
      console.log('BeneficiaryService.getCategories called');
      const response = await apiClient.get<BeneficiaryCategory[]>('/beneficiaries/categories/');
      console.log('BeneficiaryService.getCategories response:', response.status, response.data);
      return response.data;
    } catch (error: any) {
      console.error('BeneficiaryService.getCategories error:', error);
      return [];
    }
  },

  getConstituencies: async (): Promise<Constituency[]> => {
    try {
      console.log('BeneficiaryService.getConstituencies called');
      const response = await apiClient.get<Constituency[]>('/beneficiaries/constituencies/');
      console.log('BeneficiaryService.getConstituencies response:', response.status, response.data);
      return response.data;
    } catch (error: any) {
      console.error('BeneficiaryService.getConstituencies error:', error);
      return [];
    }
  },

  getStats: async (): Promise<BeneficiaryStats> => {
    try {
      console.log('BeneficiaryService.getStats called');
      const response = await apiClient.get<BeneficiaryStats>('/beneficiaries/stats/');
      console.log('BeneficiaryService.getStats response:', response.status, response.data);
      return response.data;
    } catch (error: any) {
      console.error('BeneficiaryService.getStats error:', error);
      return {
        total: 0,
        active: 0,
        inactive: 0,
        suspended: 0
      };
    }
  }
};

export default BeneficiaryService;