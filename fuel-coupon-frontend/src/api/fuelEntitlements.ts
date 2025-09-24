// src/api/fuelEntitlements.ts
import apiClient from './index';

export interface FuelEntitlement {
  id: string;
  entitlement_type: 'MONTHLY' | 'SESSION' | 'COMMITTEE' | 'SPECIAL_EVENT' | 'TRAVEL_ALLOWANCE' | 'EMERGENCY' | 'CONSTITUENCY_WORK';
  litres_entitled: number;
  litres_allocated: number;
  period_start: string; // YYYY-MM-DD format
  period_end: string; // YYYY-MM-DD format
  status: 'PENDING' | 'APPROVED' | 'ALLOCATED' | 'PARTIALLY_ALLOCATED' | 'EXPIRED' | 'CANCELLED';
  approved_date?: string; // ISO datetime string
  notes?: string;
  justification: string;
  
  // Related entities
  beneficiary?: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    full_name: string;
    category?: string;
    constituency?: string;
  };
  session?: {
    id: string;
    title: string;
    start_date: string;
    end_date: string;
    session_type: string;
  };
  program?: {
    id: string;
    title: string;
    program_type: string;
    description: string;
    scheduled_date?: string;
    end_date?: string;
  };
  approved_by?: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
  };
  created_by?: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
  };
  
  // Timestamps
  created: string; // ISO datetime string
  modified: string; // ISO datetime string
}

export interface FuelEntitlementStats {
  total_entitlements: number;
  pending_entitlements: number;
  approved_entitlements: number;
  expired_entitlements: number;
  total_litres_entitled: number;
  total_litres_allocated: number;
  allocation_percentage: number;
}

export interface CreateEntitlementData {
  beneficiary: string; // User ID
  entitlement_type: FuelEntitlement['entitlement_type'];
  litres_entitled: number;
  period_start: string; // YYYY-MM-DD format
  period_end: string; // YYYY-MM-DD format
  justification: string;
  notes?: string;
  session?: string; // Parliament Session ID (optional)
}

export interface EntitlementsListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: FuelEntitlement[];
}

export interface BulkCreateEntitlementsData {
  entitlement_type: FuelEntitlement['entitlement_type'];
  period_start: string;
  period_end: string;
  justification: string;
  beneficiaries: Array<{
    beneficiary_id: string;
    litres_entitled: number;
    notes?: string;
  }>;
  session?: string; // Parliament Session ID (optional)
}

export interface AllocateFuelData {
  litres: number;
  notes?: string;
}

export class FuelEntitlementsService {
  // Get all fuel entitlements with filtering
  static async getEntitlements(params?: {
    beneficiary?: string;
    entitlement_type?: string;
    status?: string;
    period_start?: string;
    period_end?: string;
    session?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<EntitlementsListResponse> {
    console.log('FuelEntitlementsService.getEntitlements called with:', params);
    const response = await apiClient.get('/fuel-entitlements/', { params });
    console.log('FuelEntitlementsService.getEntitlements response:', response.status, response.data);
    return response.data;
  }

  // Get entitlement statistics
  static async getStats(): Promise<FuelEntitlementStats> {
    console.log('FuelEntitlementsService.getStats called');
    const response = await apiClient.get('/fuel-entitlements/stats/');
    console.log('FuelEntitlementsService.getStats response:', response.status, response.data);
    return response.data;
  }

  // Get single entitlement by ID
  static async getEntitlement(id: string): Promise<FuelEntitlement> {
    console.log('FuelEntitlementsService.getEntitlement called with ID:', id);
    const response = await apiClient.get(`/fuel-entitlements/${id}/`);
    console.log('FuelEntitlementsService.getEntitlement response:', response.status, response.data);
    return response.data;
  }

  // Create new entitlement
  static async createEntitlement(data: CreateEntitlementData): Promise<FuelEntitlement> {
    console.log('FuelEntitlementsService.createEntitlement called with:', data);
    const response = await apiClient.post('/fuel-entitlements/', data);
    console.log('FuelEntitlementsService.createEntitlement response:', response.status, response.data);
    return response.data;
  }

  // Update existing entitlement
  static async updateEntitlement(id: string, data: Partial<CreateEntitlementData>): Promise<FuelEntitlement> {
    console.log('FuelEntitlementsService.updateEntitlement called with:', id, data);
    const response = await apiClient.put(`/fuel-entitlements/${id}/`, data);
    console.log('FuelEntitlementsService.updateEntitlement response:', response.status, response.data);
    return response.data;
  }

  // Delete entitlement
  static async deleteEntitlement(id: string): Promise<void> {
    console.log('FuelEntitlementsService.deleteEntitlement called with ID:', id);
    const response = await apiClient.delete(`/fuel-entitlements/${id}/`);
    console.log('FuelEntitlementsService.deleteEntitlement response:', response.status);
  }

  // Approve entitlement
  static async approveEntitlement(id: string, notes?: string): Promise<{ message: string; entitlement: FuelEntitlement }> {
    console.log('FuelEntitlementsService.approveEntitlement called with:', id, notes);
    const response = await apiClient.post(`/fuel-entitlements/${id}/approve/`, { notes });
    console.log('FuelEntitlementsService.approveEntitlement response:', response.status, response.data);
    return response.data;
  }

  // Reject entitlement
  static async rejectEntitlement(id: string, reason: string): Promise<{ message: string }> {
    console.log('FuelEntitlementsService.rejectEntitlement called with:', id, reason);
    const response = await apiClient.post(`/fuel-entitlements/${id}/reject/`, { reason });
    console.log('FuelEntitlementsService.rejectEntitlement response:', response.status, response.data);
    return response.data;
  }

  // Allocate fuel against an entitlement
  static async allocateFuel(id: string, data: AllocateFuelData): Promise<{ message: string; entitlement: FuelEntitlement }> {
    console.log('FuelEntitlementsService.allocateFuel called with:', id, data);
    const response = await apiClient.post(`/fuel-entitlements/${id}/allocate_fuel/`, data);
    console.log('FuelEntitlementsService.allocateFuel response:', response.status, response.data);
    return response.data;
  }

  // Get pending entitlements awaiting approval
  static async getPendingApprovals(): Promise<FuelEntitlement[]> {
    console.log('FuelEntitlementsService.getPendingApprovals called');
    const response = await apiClient.get('/fuel-entitlements/pending_approvals/');
    console.log('FuelEntitlementsService.getPendingApprovals response:', response.status, response.data);
    return response.data.results || response.data;
  }

  // Get expired entitlements
  static async getExpiredEntitlements(): Promise<FuelEntitlement[]> {
    console.log('FuelEntitlementsService.getExpiredEntitlements called');
    const response = await apiClient.get('/fuel-entitlements/expired_entitlements/');
    console.log('FuelEntitlementsService.getExpiredEntitlements response:', response.status, response.data);
    return response.data.results || response.data;
  }

  // Get entitlements by beneficiary
  static async getBeneficiaryEntitlements(beneficiaryId: string, params?: {
    status?: string;
    entitlement_type?: string;
    period_start?: string;
    period_end?: string;
  }): Promise<FuelEntitlement[]> {
    console.log('FuelEntitlementsService.getBeneficiaryEntitlements called with:', beneficiaryId, params);
    const response = await apiClient.get('/fuel-entitlements/', { 
      params: { ...params, beneficiary: beneficiaryId } 
    });
    console.log('FuelEntitlementsService.getBeneficiaryEntitlements response:', response.status, response.data);
    return response.data.results || response.data;
  }

  // Get session-based entitlements
  static async getSessionEntitlements(sessionId: string): Promise<FuelEntitlement[]> {
    console.log('FuelEntitlementsService.getSessionEntitlements called with:', sessionId);
    const response = await apiClient.get('/fuel-entitlements/', { 
      params: { session: sessionId } 
    });
    console.log('FuelEntitlementsService.getSessionEntitlements response:', response.status, response.data);
    return response.data.results || response.data;
  }

  // Bulk create entitlements (e.g., for monthly allocations)
  static async bulkCreateEntitlements(data: BulkCreateEntitlementsData): Promise<{
    message: string;
    created_count: number;
    entitlements: FuelEntitlement[];
    errors?: string[];
  }> {
    console.log('FuelEntitlementsService.bulkCreateEntitlements called with:', data);
    const response = await apiClient.post('/fuel-entitlements/bulk_create/', data);
    console.log('FuelEntitlementsService.bulkCreateEntitlements response:', response.status, response.data);
    return response.data;
  }

  // Generate monthly entitlements for all beneficiaries
  static async generateMonthlyEntitlements(data: {
    month: number; // 1-12
    year: number;
    notes?: string;
  }): Promise<{
    message: string;
    created_count: number;
    errors?: string[];
  }> {
    console.log('FuelEntitlementsService.generateMonthlyEntitlements called with:', data);
    const response = await apiClient.post('/fuel-entitlements/generate_monthly/', data);
    console.log('FuelEntitlementsService.generateMonthlyEntitlements response:', response.status, response.data);
    return response.data;
  }

  // Get entitlement history for a beneficiary
  static async getEntitlementHistory(beneficiaryId: string, params?: {
    year?: number;
    entitlement_type?: string;
    limit?: number;
  }): Promise<{
    summary: {
      total_entitlements: number;
      total_litres_entitled: number;
      total_litres_allocated: number;
      utilization_percentage: number;
    };
    entitlements: FuelEntitlement[];
  }> {
    console.log('FuelEntitlementsService.getEntitlementHistory called with:', beneficiaryId, params);
    const response = await apiClient.get(`/fuel-entitlements/history/${beneficiaryId}/`, { params });
    console.log('FuelEntitlementsService.getEntitlementHistory response:', response.status, response.data);
    return response.data;
  }

  // Export entitlements data
  static async exportEntitlements(params: {
    format: 'csv' | 'excel' | 'pdf';
    beneficiary?: string;
    entitlement_type?: string;
    status?: string;
    period_start?: string;
    period_end?: string;
  }): Promise<Blob> {
    console.log('FuelEntitlementsService.exportEntitlements called with:', params);
    const response = await apiClient.get('/fuel-entitlements/export/', {
      params,
      responseType: 'blob'
    });
    console.log('FuelEntitlementsService.exportEntitlements response:', response.status);
    return response.data;
  }

  // Check entitlement eligibility for a beneficiary
  static async checkEligibility(beneficiaryId: string, entitlementType: string): Promise<{
    eligible: boolean;
    reason?: string;
    existing_entitlements: FuelEntitlement[];
    monthly_limit?: number;
    current_usage?: number;
  }> {
    console.log('FuelEntitlementsService.checkEligibility called with:', beneficiaryId, entitlementType);
    const response = await apiClient.get('/fuel-entitlements/check_eligibility/', {
      params: { beneficiary_id: beneficiaryId, entitlement_type: entitlementType }
    });
    console.log('FuelEntitlementsService.checkEligibility response:', response.status, response.data);
    return response.data;
  }
}

export default FuelEntitlementsService;
