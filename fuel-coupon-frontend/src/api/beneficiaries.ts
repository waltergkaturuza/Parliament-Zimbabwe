// src/api/beneficiaries.ts
import apiClient from './apiClient';

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
  lastActivity?: string;
  createdAt: string;
}

export interface BeneficiaryFilters {
  search?: string;
  category?: string;
  status?: string;
  constituency?: string;
  party?: string;
}

export interface CreateBeneficiaryRequest {
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
  entitlements: {
    monthlyAllocation: number;
    maxPerTransaction: number;
    vehicleCount: number;
  };
}

export class BeneficiaryService {
  static async getAll(filters?: BeneficiaryFilters): Promise<Beneficiary[]> {
    const response = await apiClient.get('/beneficiaries/', { params: filters });
    return response.data.results || response.data;
  }

  static async getById(id: string): Promise<Beneficiary> {
    const response = await apiClient.get(`/beneficiaries/${id}/`);
    return response.data;
  }

  static async create(data: CreateBeneficiaryRequest): Promise<Beneficiary> {
    const response = await apiClient.post('/beneficiaries/', data);
    return response.data;
  }

  static async update(id: string, data: Partial<CreateBeneficiaryRequest>): Promise<Beneficiary> {
    const response = await apiClient.patch(`/beneficiaries/${id}/`, data);
    return response.data;
  }

  static async delete(id: string): Promise<void> {
    await apiClient.delete(`/beneficiaries/${id}/`);
  }

  static async bulkUpdate(ids: string[], data: Partial<CreateBeneficiaryRequest>): Promise<void> {
    await apiClient.post('/beneficiaries/bulk-update/', { ids, data });
  }

  static async bulkDelete(ids: string[]): Promise<void> {
    await apiClient.post('/beneficiaries/bulk-delete/', { ids });
  }

  static async uploadAvatar(id: string, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await apiClient.post(`/beneficiaries/${id}/upload-avatar/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.avatar_url;
  }

  static async getFuelUsageHistory(id: string): Promise<any[]> {
    const response = await apiClient.get(`/beneficiaries/${id}/fuel-usage/`);
    return response.data;
  }

  static async getTransactionHistory(id: string): Promise<any[]> {
    const response = await apiClient.get(`/beneficiaries/${id}/transactions/`);
    return response.data;
  }
}
