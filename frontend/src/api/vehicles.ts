import { apiClient } from './client';
import { ApiResponse } from './types';

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
  next_service_date?: string;
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
  next_service_date?: string;
  insurance_expiry?: string;
  license_expiry?: string;
  notes?: string;
  assigned_driver?: number;
  sub_center?: number;
}

export class VehicleService {
  private static readonly BASE_URL = '/pool-vehicles';

  static async getVehicles(params?: {
    page?: number;
    page_size?: number;
    status?: string;
    fuel_type?: string;
    sub_center?: number;
  }): Promise<ApiResponse<Vehicle[]>> {
    const response = await apiClient.get(this.BASE_URL, { params });
    return response.data;
  }

  static async getVehicle(id: number): Promise<ApiResponse<Vehicle>> {
    const response = await apiClient.get(`${this.BASE_URL}/${id}/`);
    return response.data;
  }

  static async createVehicle(data: VehicleFormData): Promise<ApiResponse<Vehicle>> {
    const response = await apiClient.post(`${this.BASE_URL}/`, data);
    return response.data;
  }

  static async updateVehicle(id: number, data: Partial<VehicleFormData>): Promise<ApiResponse<Vehicle>> {
    const response = await apiClient.patch(`${this.BASE_URL}/${id}/`, data);
    return response.data;
  }

  static async deleteVehicle(id: number): Promise<ApiResponse<void>> {
    const response = await apiClient.delete(`${this.BASE_URL}/${id}/`);
    return response.data;
  }

  static async getVehicleStats(): Promise<ApiResponse<{
    total: number;
    active: number;
    inactive: number;
    maintenance: number;
    by_fuel_type: Record<string, number>;
    by_sub_center: Record<string, number>;
  }>> {
    const response = await apiClient.get(`${this.BASE_URL}/stats/`);
    return response.data;
  }

  static async assignDriver(vehicleId: number, driverId: number): Promise<ApiResponse<Vehicle>> {
    const response = await apiClient.patch(`${this.BASE_URL}/${vehicleId}/assign-driver/`, {
      driver_id: driverId
    });
    return response.data;
  }

  static async unassignDriver(vehicleId: number): Promise<ApiResponse<Vehicle>> {
    const response = await apiClient.patch(`${this.BASE_URL}/${vehicleId}/unassign-driver/`);
    return response.data;
  }

  static async updateMileage(vehicleId: number, mileage: number): Promise<ApiResponse<Vehicle>> {
    const response = await apiClient.patch(`${this.BASE_URL}/${vehicleId}/update-mileage/`, {
      current_mileage: mileage
    });
    return response.data;
  }

  static async scheduleService(vehicleId: number, serviceData: {
    service_type: string;
    scheduled_date: string;
    notes?: string;
  }): Promise<ApiResponse<Vehicle>> {
    const response = await apiClient.post(`${this.BASE_URL}/${vehicleId}/schedule-service/`, serviceData);
    return response.data;
  }
}

export default VehicleService;