// src/api/beneficiaries.ts
import apiClient from './index';

export interface Beneficiary {
  id: string;
  parliamentaryId: string;
  name: string;
  title: string;
  category: 'MP' | 'SENATOR' | 'STAFF' | 'OFFICIAL';
  constituency?: string;
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

const BeneficiaryService = {
  getBeneficiaries: async (params: BeneficiaryParams = {}): Promise<Beneficiary[]> => {
    try {
      console.log('BeneficiaryService.getBeneficiaries called with:', params);
      const response = await apiClient.get<{results: Beneficiary[]}>('/beneficiaries/', { params });
      console.log('BeneficiaryService.getBeneficiaries response:', response.status, response.data);
      return response.data?.results || [];
    } catch (error: any) {
      console.error('BeneficiaryService.getBeneficiaries error:', error);
      return [];
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
  }
};

export default BeneficiaryService;