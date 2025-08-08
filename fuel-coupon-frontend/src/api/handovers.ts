// src/api/handovers.ts
import { apiClient } from './apiClient';

export interface HandoverRecord {
  id: string;
  handoverNumber: string;
  fromCenter: string;
  toCenter: string;
  bookCount: number;
  couponCount: number;
  fuelType: 'PETROL' | 'DIESEL';
  status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  createdDate: string;
  deliveryDate?: string;
  driverName: string;
  vehicleNumber: string;
  notes?: string;
  createdBy?: string;
  updatedAt?: string;
}

export interface CreateHandoverRequest {
  fromCenter: string;
  toCenter: string;
  bookCount: number;
  couponCount: number;
  fuelType: 'PETROL' | 'DIESEL';
  driverName: string;
  vehicleNumber: string;
  notes?: string;
}

export interface UpdateHandoverRequest extends Partial<CreateHandoverRequest> {
  status?: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  deliveryDate?: string;
}

export class HandoverService {
  private static readonly API_BASE = '/api/v1/handovers';

  static async getAll(): Promise<HandoverRecord[]> {
    const response = await apiClient.get(`${this.API_BASE}/`);
    return response.data;
  }

  static async getById(id: string): Promise<HandoverRecord> {
    const response = await apiClient.get(`${this.API_BASE}/${id}/`);
    return response.data;
  }

  static async create(data: CreateHandoverRequest): Promise<HandoverRecord> {
    const response = await apiClient.post(`${this.API_BASE}/`, data);
    return response.data;
  }

  static async update(id: string, data: UpdateHandoverRequest): Promise<HandoverRecord> {
    const response = await apiClient.put(`${this.API_BASE}/${id}/`, data);
    return response.data;
  }

  static async delete(id: string): Promise<void> {
    await apiClient.delete(`${this.API_BASE}/${id}/`);
  }

  static async getStatistics(): Promise<{
    total: number;
    pending: number;
    inTransit: number;
    delivered: number;
    cancelled: number;
  }> {
    const response = await apiClient.get(`${this.API_BASE}/statistics/`);
    return response.data;
  }

  static async updateStatus(id: string, status: HandoverRecord['status']): Promise<HandoverRecord> {
    const response = await apiClient.patch(`${this.API_BASE}/${id}/status/`, { status });
    return response.data;
  }

  static async generateReport(id: string): Promise<Blob> {
    const response = await apiClient.get(`${this.API_BASE}/${id}/report/`, {
      responseType: 'blob'
    });
    return response.data;
  }
}
