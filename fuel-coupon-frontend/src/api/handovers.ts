// src/api/handovers.ts
import apiClient from './index';

export interface HandoverRecord {
  id: string;
  tracking_number: string;
  from_center: string;
  to_center: string;
  status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';
  created_date: string;
  scheduled_delivery?: string;
  actual_delivery?: string;
  books: Array<{
    id: string;
    serial_number: string;
    coupon_count: number;
  }>;
  created_by: {
    id: string;
    name: string;
  };
  received_by?: {
    id: string;
    name: string;
  };
  notes?: string;
}

export interface CreateHandoverRequest {
  to_center: string;
  books: Array<{
    id: string;
  }>;
  notes?: string;
  scheduled_delivery?: string;
}

export const HandoverService = {
  getHandovers: async (): Promise<HandoverRecord[]> => {
    try {
      console.log('HandoverService.getHandovers called');
      const response = await apiClient.get<{results: HandoverRecord[]}>('/api/v1/handovers/');
      console.log('HandoverService.getHandovers response:', response.status, response.data);
      return response.data?.results || [];
    } catch (error: any) {
      console.error('HandoverService.getHandovers error:', error);
      return [];
    }
  },

  createHandover: async (data: CreateHandoverRequest): Promise<HandoverRecord | null> => {
    try {
      console.log('HandoverService.createHandover called with:', data);
      const response = await apiClient.post<HandoverRecord>('/api/v1/handovers/', data);
      console.log('HandoverService.createHandover response:', response.status, response.data);
      return response.data;
    } catch (error: any) {
      console.error('HandoverService.createHandover error:', error);
      throw error;
    }
  },

  updateHandover: async (id: string, data: Partial<HandoverRecord>): Promise<HandoverRecord | null> => {
    try {
      console.log('HandoverService.updateHandover called with:', id, data);
      const response = await apiClient.patch<HandoverRecord>(`/api/v1/handovers/${id}/`, data);
      console.log('HandoverService.updateHandover response:', response.status, response.data);
      return response.data;
    } catch (error: any) {
      console.error('HandoverService.updateHandover error:', error);
      throw error;
    }
  }
};

export default HandoverService;
