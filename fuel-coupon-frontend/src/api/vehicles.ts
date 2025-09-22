// src/api/vehicles.ts
import apiClient from './index';

export interface Vehicle {
  id?: number;
  registration_number: string;
  make: string;
  model: string;
  year?: number;
  fuel_type: 'PETROL' | 'DIESEL';
  engine_capacity?: string;
  color?: string;
  chassis_number?: string;
  engine_number?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  current_mileage?: number;
  last_service_date?: string;
  next_service_due?: string;
  insurance_expiry?: string;
  license_expiry?: string;
  notes?: string;
  assigned_driver?: number;
  sub_center?: number;
  created_at?: string;
  updated_at?: string;
}

export interface VehicleFormData {
  registration_number: string;
  make: string;
  model: string;
  year?: number;
  fuel_type: 'PETROL' | 'DIESEL';
  engine_capacity?: string;
  color?: string;
  chassis_number?: string;
  engine_number?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  current_mileage?: number;
  last_service_date?: string;
  next_service_due?: string;
  insurance_expiry?: string;
  license_expiry?: string;
  notes?: string;
  assigned_driver?: number;
  sub_center?: number;
}

export const VehicleService = {
  async getVehicles(params?: {
    page?: number;
    page_size?: number;
    status?: string;
    fuel_type?: string;
    sub_center?: number;
  }) {
    const response = await apiClient.get('/pool-vehicles/', { params });
    return response.data;
  },

  async getVehicle(id: number) {
    const response = await apiClient.get(`/pool-vehicles/${id}/`);
    return response.data;
  },

  async createVehicle(data: VehicleFormData) {
    const response = await apiClient.post('/pool-vehicles/', data);
    return response.data;
  },

  async updateVehicle(id: number, data: Partial<VehicleFormData>) {
    const response = await apiClient.patch(`/pool-vehicles/${id}/`, data);
    return response.data;
  },

  async deleteVehicle(id: number) {
    const response = await apiClient.delete(`/pool-vehicles/${id}/`);
    return response.data;
  },

  async getVehicleStats() {
    const response = await apiClient.get('/pool-vehicles/stats/');
    return response.data;
  },

  async assignDriver(vehicleId: number, driverId: number) {
    const response = await apiClient.patch(`/pool-vehicles/${vehicleId}/assign-driver/`, {
      driver_id: driverId
    });
    return response.data;
  },

  async unassignDriver(vehicleId: number) {
    const response = await apiClient.patch(`/pool-vehicles/${vehicleId}/unassign-driver/`);
    return response.data;
  },

  async updateMileage(vehicleId: number, mileage: number) {
    const response = await apiClient.patch(`/pool-vehicles/${vehicleId}/update-mileage/`, {
      current_mileage: mileage
    });
    return response.data;
  },

  async scheduleService(vehicleId: number, serviceData: {
    service_type: string;
    scheduled_date: string;
    notes?: string;
  }) {
    const response = await apiClient.post(`/pool-vehicles/${vehicleId}/schedule-service/`, serviceData);
    return response.data;
  }
};

export default VehicleService;