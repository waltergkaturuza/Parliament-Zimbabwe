// src/api/drivers.ts
import apiClient from './index';

interface VehicleInfo {
  id: number;
  registration_number: string;
  make?: string;
  model?: string;
  is_primary?: boolean;
}

export interface Driver {
  id?: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  email?: string;
  license_number: string;
  license_class: string;
  license_expiry_date?: string;
  date_of_birth?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  hire_date?: string;
  sub_center?: number;
  notes?: string;
  active_vehicles?: VehicleInfo[];
  created_at?: string;
  updated_at?: string;
}

export interface DriverFormData {
  employee_id: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  email?: string;
  license_number: string;
  license_class: string;
  license_expiry_date?: string;
  date_of_birth?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  hire_date?: string;
  sub_center?: number;
  notes?: string;
}

export const DriverService = {
  async getDrivers(params?: {
    page?: number;
    page_size?: number;
    status?: string;
    sub_center?: number;
    license_class?: string;
  }) {
    const response = await apiClient.get('/drivers/', { params });
    return response.data;
  },

  async getDriver(id: number) {
    const response = await apiClient.get(`/drivers/${id}/`);
    return response.data;
  },

  async createDriver(data: DriverFormData) {
    const response = await apiClient.post('/drivers/', data);
    return response.data;
  },

  async updateDriver(id: number, data: Partial<DriverFormData>) {
    const response = await apiClient.patch(`/drivers/${id}/`, data);
    return response.data;
  },

  async deleteDriver(id: number) {
    const response = await apiClient.delete(`/drivers/${id}/`);
    return response.data;
  },

  async getDriverStats() {
    const response = await apiClient.get('/drivers/stats/');
    return response.data;
  },

  async getAvailableDrivers(subCenterId?: number) {
    const params = subCenterId ? { sub_center: subCenterId, status: 'ACTIVE' } : { status: 'ACTIVE' };
    const response = await apiClient.get('/drivers/', { params });
    return response.data;
  },

  async suspendDriver(id: number, reason?: string) {
    const response = await apiClient.patch(`/drivers/${id}/suspend/`, { reason });
    return response.data;
  },

  async reactivateDriver(id: number) {
    const response = await apiClient.patch(`/drivers/${id}/reactivate/`);
    return response.data;
  },

  async updateLicense(id: number, licenseData: {
    license_number: string;
    license_class: string;
    license_expiry_date: string;
  }) {
    const response = await apiClient.patch(`/drivers/${id}/update-license/`, licenseData);
    return response.data;
  },

  async getDriverVehicles(id: number) {
    const response = await apiClient.get(`/drivers/${id}/vehicles/`);
    return response.data;
  },

  async getDriverAssignmentHistory(id: number) {
    const response = await apiClient.get(`/drivers/${id}/assignment-history/`);
    return response.data;
  }
};

export default DriverService;