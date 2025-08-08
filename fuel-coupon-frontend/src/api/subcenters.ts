// src/api/subcenters.ts
import apiClient from './index';

export interface SubCenter {
  id: string;
  code: string;
  name: string;
  location: string;
  is_active: boolean;
  managed_by?: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
  };
  created: string;
  modified: string;
  users_count?: number;
  active_programs?: number;
  distributed_coupons?: number;
  capacity?: number;
}

export interface CreateSubCenterData {
  code: string;
  name: string;
  location: string;
  is_active?: boolean;
  managed_by?: string;
  capacity?: number;
}

export interface UpdateSubCenterData {
  code?: string;
  name?: string;
  location?: string;
  is_active?: boolean;
  managed_by?: string;
  capacity?: number;
}

export const SubCenterService = {
  // Get all sub-centers with optional filtering
  getSubCenters: async (params?: {
    is_active?: boolean;
    search?: string;
    page?: number;
    page_size?: number;
  }) => {
    const response = await apiClient.get('/api/v1/subcenters/', { params });
    return response.data;
  },

  // Get a specific sub-center by ID
  getSubCenter: async (id: string | number) => {
    const response = await apiClient.get(`/subcenters/${id}/`);
    return response.data;
  },

  // Create a new sub-center
  createSubCenter: async (subCenterData: CreateSubCenterData) => {
    const response = await apiClient.post('/api/v1/subcenters/', subCenterData);
    return response.data;
  },

  // Update an existing sub-center
  updateSubCenter: async (id: string | number, subCenterData: UpdateSubCenterData) => {
    const response = await apiClient.patch(`/subcenters/${id}/`, subCenterData);
    return response.data;
  },

  // Delete a sub-center
  deleteSubCenter: async (id: string | number) => {
    const response = await apiClient.delete(`/subcenters/${id}/`);
    return response.data;
  },

  // Toggle sub-center active status
  toggleSubCenterStatus: async (id: string | number, is_active: boolean) => {
    const response = await apiClient.patch(`/subcenters/${id}/`, { is_active });
    return response.data;
  },

  // Get sub-center statistics
  getSubCenterStats: async () => {
    const response = await apiClient.get('/api/v1/subcenters/stats/');
    return response.data;
  },

  // Get sub-center statistics (alias)
  getSubCenterStatistics: async (id: string | number) => {
    const response = await apiClient.get(`/subcenters/${id}/statistics/`);
    return response.data;
  },

  // Get sub-center users
  getSubCenterUsers: async (id: string | number) => {
    const response = await apiClient.get(`/subcenters/${id}/users/`);
    return response.data;
  },

  // Get sub-center programs
  getSubCenterPrograms: async (id: string | number) => {
    const response = await apiClient.get(`/subcenters/${id}/programs/`);
    return response.data;
  },
};
