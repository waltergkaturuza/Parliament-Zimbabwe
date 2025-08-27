/**
 * Dynamic Fuel Allocation System - API Service Utilities
 * 
 * TypeScript service classes for communicating with Django backend API.
 * Provides comprehensive methods for allocation calculations, previews, and management.
 * 
 * Integrates with Django REST Framework endpoints and provides TypeScript-safe interfaces.
 */

// Note: Install axios with: npm install axios @types/axios
// import axios, { AxiosResponse, AxiosError } from 'axios';
import {
  FuelAllocationRule,
  FuelPrice,
  BeneficiaryProfile,
  ParliamentSession,
  AllocationCalculationInput,
  AllocationCalculationResult,
  BulkAllocationPreviewInput,
  BulkAllocationPreviewResult
} from '../utils/dynamicAllocation';

// Temporary axios types for compilation
interface AxiosResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: any;
  config: any;
}

interface AxiosError {
  response?: AxiosResponse;
  message: string;
}

// Simplified axios implementation for development
const axios = {
  create: (config: any) => ({
    get: async <T>(url: string, options?: any): Promise<AxiosResponse<T>> => {
      const response = await fetch(config.baseURL + url + (options?.params ? '?' + new URLSearchParams(options.params) : ''), {
        method: 'GET',
        headers: { ...config.headers, ...options?.headers },
      });
      return { data: await response.json(), status: response.status, statusText: response.statusText, headers: {}, config };
    },
    post: async <T>(url: string, data?: any): Promise<AxiosResponse<T>> => {
      const response = await fetch(config.baseURL + url, {
        method: 'POST',
        headers: config.headers,
        body: JSON.stringify(data),
      });
      return { data: await response.json(), status: response.status, statusText: response.statusText, headers: {}, config };
    },
    put: async <T>(url: string, data?: any): Promise<AxiosResponse<T>> => {
      const response = await fetch(config.baseURL + url, {
        method: 'PUT',
        headers: config.headers,
        body: JSON.stringify(data),
      });
      return { data: await response.json(), status: response.status, statusText: response.statusText, headers: {}, config };
    },
    patch: async <T>(url: string, data?: any): Promise<AxiosResponse<T>> => {
      const response = await fetch(config.baseURL + url, {
        method: 'PATCH',
        headers: config.headers,
        body: JSON.stringify(data),
      });
      return { data: await response.json(), status: response.status, statusText: response.statusText, headers: {}, config };
    },
    delete: async <T>(url: string): Promise<AxiosResponse<T>> => {
      const response = await fetch(config.baseURL + url, {
        method: 'DELETE',
        headers: config.headers,
      });
      return { data: await response.json(), status: response.status, statusText: response.statusText, headers: {}, config };
    },
    interceptors: {
      request: { use: (fn: any) => {} },
      response: { use: (success: any, error: any) => {} },
    }
  })
};

// ======================= API CONFIGURATION =======================

export interface ApiConfig {
  baseURL: string;
  timeout: number;
  enableAuth: boolean;
  authTokenKey: string;
}

export const defaultApiConfig: ApiConfig = {
  baseURL: process.env.REACT_APP_API_BASE_URL || '/api',
  timeout: 30000, // 30 seconds for allocation calculations
  enableAuth: true,
  authTokenKey: 'token', // JWT token key from localStorage/sessionStorage
};

// ======================= API CLIENT =======================

export class ApiClient {
  private config: ApiConfig;
  public axiosInstance: any; // Made public for export functionality

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = { ...defaultApiConfig, ...config };
    
    this.axiosInstance = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Add auth interceptor
    if (this.config.enableAuth) {
      this.axiosInstance.interceptors.request.use((config: any) => {
        const token = localStorage.getItem(this.config.authTokenKey) || 
                     sessionStorage.getItem(this.config.authTokenKey);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      });
    }

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response: any) => response,
      (error: AxiosError) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, params?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.get(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.post(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.put(url, data);
    return response.data;
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.patch(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.delete(url);
    return response.data;
  }
}

// ======================= ALLOCATION RULE SERVICE =======================

export class AllocationRuleService {
  private apiClient: ApiClient;

  constructor(apiClient?: ApiClient) {
    this.apiClient = apiClient || new ApiClient();
  }

  /**
   * Get all allocation rules
   */
  async getAllRules(params?: {
    rule_type?: string;
    is_active?: boolean;
    effective_date?: string;
  }): Promise<FuelAllocationRule[]> {
    return this.apiClient.get<FuelAllocationRule[]>('/fuel/dynamic-allocation/rules/', params);
  }

  /**
   * Get allocation rule by ID
   */
  async getRule(ruleId: number): Promise<FuelAllocationRule> {
    return this.apiClient.get<FuelAllocationRule>(`/fuel/dynamic-allocation/rules/${ruleId}/`);
  }

  /**
   * Create new allocation rule
   */
  async createRule(ruleData: Partial<FuelAllocationRule>): Promise<FuelAllocationRule> {
    return this.apiClient.post<FuelAllocationRule>('/fuel/dynamic-allocation/rules/', ruleData);
  }

  /**
   * Update allocation rule
   */
  async updateRule(ruleId: number, ruleData: Partial<FuelAllocationRule>): Promise<FuelAllocationRule> {
    return this.apiClient.put<FuelAllocationRule>(`/fuel/dynamic-allocation/rules/${ruleId}/`, ruleData);
  }

  /**
   * Delete allocation rule
   */
  async deleteRule(ruleId: number): Promise<void> {
    return this.apiClient.delete<void>(`/fuel/dynamic-allocation/rules/${ruleId}/`);
  }

  /**
   * Get active rules for specific criteria
   */
  async getActiveRules(params?: {
    engine_band?: string;
    category?: string;
    period_type?: string;
  }): Promise<FuelAllocationRule[]> {
    return this.apiClient.get<FuelAllocationRule[]>('/fuel/dynamic-allocation/rules/active/', params);
  }

  /**
   * Test rule calculation
   */
  async testRule(ruleId: number, testData: {
    distance_km: number;
    engine_capacity_cc: number;
    fuel_price_usd: number;
    parliament_session_id?: number;
  }): Promise<AllocationCalculationResult> {
    return this.apiClient.post<AllocationCalculationResult>(
      `/fuel/dynamic-allocation/rules/${ruleId}/test/`,
      testData
    );
  }
}

// ======================= FUEL PRICE SERVICE =======================

export class FuelPriceService {
  private apiClient: ApiClient;

  constructor(apiClient?: ApiClient) {
    this.apiClient = apiClient || new ApiClient();
  }

  /**
   * Get all fuel prices
   */
  async getAllPrices(params?: {
    fuel_type?: string;
    is_active?: boolean;
    effective_date?: string;
  }): Promise<FuelPrice[]> {
    return this.apiClient.get<FuelPrice[]>('/fuel/dynamic-allocation/fuel-prices/', params);
  }

  /**
   * Get fuel price by ID
   */
  async getPrice(priceId: number): Promise<FuelPrice> {
    return this.apiClient.get<FuelPrice>(`/fuel/dynamic-allocation/fuel-prices/${priceId}/`);
  }

  /**
   * Create new fuel price
   */
  async createPrice(priceData: Partial<FuelPrice>): Promise<FuelPrice> {
    return this.apiClient.post<FuelPrice>('/fuel/dynamic-allocation/fuel-prices/', priceData);
  }

  /**
   * Update fuel price
   */
  async updatePrice(priceId: number, priceData: Partial<FuelPrice>): Promise<FuelPrice> {
    return this.apiClient.put<FuelPrice>(`/fuel/dynamic-allocation/fuel-prices/${priceId}/`, priceData);
  }

  /**
   * Delete fuel price
   */
  async deletePrice(priceId: number): Promise<void> {
    return this.apiClient.delete<void>(`/fuel/dynamic-allocation/fuel-prices/${priceId}/`);
  }

  /**
   * Get current default price
   */
  async getCurrentDefaultPrice(fuelType?: string): Promise<FuelPrice> {
    return this.apiClient.get<FuelPrice>('/fuel/dynamic-allocation/fuel-prices/current/', {
      fuel_type: fuelType
    });
  }

  /**
   * Get price history
   */
  async getPriceHistory(params?: {
    fuel_type?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<FuelPrice[]> {
    return this.apiClient.get<FuelPrice[]>('/fuel/dynamic-allocation/fuel-prices/history/', params);
  }
}

// ======================= ALLOCATION CALCULATION SERVICE =======================

export class AllocationCalculationService {
  private apiClient: ApiClient;

  constructor(apiClient?: ApiClient) {
    this.apiClient = apiClient || new ApiClient();
  }

  /**
   * Calculate allocation for single beneficiary
   */
  async calculateAllocation(input: AllocationCalculationInput): Promise<AllocationCalculationResult> {
    return this.apiClient.post<AllocationCalculationResult>(
      '/fuel/dynamic-allocation/calculate/',
      input
    );
  }

  /**
   * Generate preview for single beneficiary
   */
  async generatePreview(input: AllocationCalculationInput): Promise<AllocationCalculationResult> {
    return this.apiClient.post<AllocationCalculationResult>(
      '/fuel/dynamic-allocation/preview/',
      input
    );
  }

  /**
   * Generate bulk allocation preview
   */
  async generateBulkPreview(input: BulkAllocationPreviewInput): Promise<BulkAllocationPreviewResult> {
    return this.apiClient.post<BulkAllocationPreviewResult>(
      '/fuel/dynamic-allocation/bulk-preview/',
      input
    );
  }

  /**
   * Commit allocation preview
   */
  async commitAllocation(allocationId: string): Promise<{
    success: boolean;
    allocation: any;
    message: string;
  }> {
    return this.apiClient.post<any>(
      `/fuel/dynamic-allocation/allocations/${allocationId}/commit/`
    );
  }

  /**
   * Commit bulk allocation preview
   */
  async commitBulkAllocation(allocationIds: string[]): Promise<{
    success: boolean;
    committed_count: number;
    failed_count: number;
    results: Array<{
      allocation_id: string;
      success: boolean;
      error?: string;
    }>;
  }> {
    return this.apiClient.post<any>('/fuel/dynamic-allocation/bulk-commit/', {
      allocation_ids: allocationIds
    });
  }

  /**
   * Cancel allocation preview
   */
  async cancelAllocation(allocationId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.apiClient.post<any>(
      `/fuel/dynamic-allocation/allocations/${allocationId}/cancel/`
    );
  }

  /**
   * Get allocation by ID
   */
  async getAllocation(allocationId: string): Promise<any> {
    return this.apiClient.get<any>(`/fuel/dynamic-allocation/allocations/${allocationId}/`);
  }

  /**
   * Get allocations for beneficiary
   */
  async getAllocationsForBeneficiary(
    beneficiaryId: number,
    params?: {
      status?: string;
      period_start?: string;
      period_end?: string;
      rule_type?: string;
    }
  ): Promise<any[]> {
    return this.apiClient.get<any[]>(
      `/fuel/dynamic-allocation/beneficiaries/${beneficiaryId}/allocations/`,
      params
    );
  }

  /**
   * Get allocation history
   */
  async getAllocationHistory(params?: {
    beneficiary_id?: number;
    rule_id?: number;
    status?: string;
    period_start?: string;
    period_end?: string;
    page?: number;
    page_size?: number;
  }): Promise<{
    count: number;
    next: string | null;
    previous: string | null;
    results: any[];
  }> {
    return this.apiClient.get<any>('/fuel/dynamic-allocation/allocations/', params);
  }
}

// ======================= ALLOCATION ANALYTICS SERVICE =======================

export class AllocationAnalyticsService {
  private apiClient: ApiClient;

  constructor(apiClient?: ApiClient) {
    this.apiClient = apiClient || new ApiClient();
  }

  /**
   * Get allocation summary analytics
   */
  async getAllocationSummary(params?: {
    period_start?: string;
    period_end?: string;
    rule_id?: number;
    category?: string;
  }): Promise<{
    total_allocations: number;
    total_litres: number;
    total_value_usd: number;
    average_allocation_litres: number;
    beneficiary_count: number;
    by_category: Array<{
      category: string;
      count: number;
      total_litres: number;
      total_value_usd: number;
    }>;
    by_engine_band: Array<{
      engine_band: string;
      count: number;
      total_litres: number;
      average_litres: number;
    }>;
    by_status: Array<{
      status: string;
      count: number;
      percentage: number;
    }>;
  }> {
    return this.apiClient.get<any>('/fuel/dynamic-allocation/analytics/summary/', params);
  }

  /**
   * Get allocation trends
   */
  async getAllocationTrends(params?: {
    period_start?: string;
    period_end?: string;
    group_by?: 'day' | 'week' | 'month';
    rule_id?: number;
  }): Promise<{
    period_analysis: Array<{
      period: string;
      total_allocations: number;
      total_litres: number;
      total_value_usd: number;
      unique_beneficiaries: number;
    }>;
    trend_data: {
      allocation_trend: string; // 'increasing' | 'decreasing' | 'stable'
      volume_trend: string;
      value_trend: string;
      growth_rate_percentage: number;
    };
  }> {
    return this.apiClient.get<any>('/fuel/dynamic-allocation/analytics/trends/', params);
  }

  /**
   * Get beneficiary allocation patterns
   */
  async getBeneficiaryPatterns(params?: {
    period_start?: string;
    period_end?: string;
    category?: string;
  }): Promise<{
    top_allocations: Array<{
      beneficiary_id: number;
      beneficiary_name: string;
      total_litres: number;
      total_value_usd: number;
      allocation_count: number;
    }>;
    allocation_distribution: Array<{
      range: string;
      count: number;
      percentage: number;
    }>;
    engine_capacity_analysis: Array<{
      engine_band: string;
      average_allocation: number;
      median_allocation: number;
      beneficiary_count: number;
    }>;
  }> {
    return this.apiClient.get<any>('/fuel/dynamic-allocation/analytics/beneficiary-patterns/', params);
  }

  /**
   * Get fuel cost analysis
   */
  async getFuelCostAnalysis(params?: {
    period_start?: string;
    period_end?: string;
  }): Promise<{
    cost_breakdown: {
      total_fuel_cost_usd: number;
      average_price_per_litre: number;
      price_variance: number;
      cost_by_fuel_type: Array<{
        fuel_type: string;
        total_cost: number;
        total_litres: number;
        percentage_of_total: number;
      }>;
    };
    price_impact_analysis: {
      price_changes: Array<{
        date: string;
        old_price: number;
        new_price: number;
        impact_percentage: number;
      }>;
      cost_savings_potential: number;
      efficiency_recommendations: string[];
    };
  }> {
    return this.apiClient.get<any>('/fuel/dynamic-allocation/analytics/fuel-cost/', params);
  }

  /**
   * Export allocation data
   */
  async exportAllocationData(params: {
    format: 'csv' | 'excel' | 'pdf';
    period_start?: string;
    period_end?: string;
    beneficiary_ids?: number[];
    include_analytics?: boolean;
  }): Promise<Blob> {
    const response = await this.apiClient.axiosInstance.get('/fuel/dynamic-allocation/export/', {
      params,
      responseType: 'blob'
    });
    return response.data;
  }
}

// ======================= BENEFICIARY SERVICE =======================

export class BeneficiaryService {
  private apiClient: ApiClient;

  constructor(apiClient?: ApiClient) {
    this.apiClient = apiClient || new ApiClient();
  }

  /**
   * Get all beneficiaries with allocation-relevant data
   */
  async getAllBeneficiaries(params?: {
    category?: string;
    constituency?: string;
    fuel_type?: string;
    engine_band?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<{
    count: number;
    next: string | null;
    previous: string | null;
    results: BeneficiaryProfile[];
  }> {
    return this.apiClient.get<any>('/fuel/dynamic-allocation/beneficiaries/', params);
  }

  /**
   * Get beneficiary by ID with allocation data
   */
  async getBeneficiary(beneficiaryId: number): Promise<BeneficiaryProfile> {
    return this.apiClient.get<BeneficiaryProfile>(`/fuel/dynamic-allocation/beneficiaries/${beneficiaryId}/`);
  }

  /**
   * Update beneficiary allocation parameters
   */
  async updateBeneficiaryAllocationData(
    beneficiaryId: number,
    data: {
      engine_capacity_cc?: number;
      distance_from_parliament_km?: number;
      fuel_type?: string;
      vehicle_make?: string;
      vehicle_model?: string;
      vehicle_year?: number;
      engine_size?: string;
      vehicle_registration?: string;
    }
  ): Promise<BeneficiaryProfile> {
    return this.apiClient.patch<BeneficiaryProfile>(
      `/fuel/dynamic-allocation/beneficiaries/${beneficiaryId}/`,
      data
    );
  }

  /**
   * Get beneficiary allocation eligibility
   */
  async getBeneficiaryEligibility(beneficiaryId: number, ruleId?: number): Promise<{
    eligible: boolean;
    eligibility_details: {
      has_required_data: boolean;
      missing_fields: string[];
      category_eligible: boolean;
      engine_data_valid: boolean;
      distance_data_valid: boolean;
    };
    applicable_rules: FuelAllocationRule[];
    recommendations: string[];
  }> {
    return this.apiClient.get<any>(`/fuel/dynamic-allocation/beneficiaries/${beneficiaryId}/eligibility/`, {
      rule_id: ruleId
    });
  }

  /**
   * Calculate allocation preview for beneficiary
   */
  async getBeneficiaryAllocationPreview(
    beneficiaryId: number,
    ruleId: number,
    params?: {
      period_start?: string;
      period_end?: string;
      parliament_session_id?: number;
      fuel_price_id?: number;
    }
  ): Promise<AllocationCalculationResult> {
    return this.apiClient.get<AllocationCalculationResult>(
      `/fuel/dynamic-allocation/beneficiaries/${beneficiaryId}/preview/`,
      {
        rule_id: ruleId,
        ...params
      }
    );
  }
}

// ======================= PARLIAMENT SESSION SERVICE =======================

export class ParliamentSessionService {
  private apiClient: ApiClient;

  constructor(apiClient?: ApiClient) {
    this.apiClient = apiClient || new ApiClient();
  }

  /**
   * Get all parliament sessions
   */
  async getAllSessions(params?: {
    session_type?: string;
    is_active?: boolean;
    start_date?: string;
    end_date?: string;
  }): Promise<ParliamentSession[]> {
    return this.apiClient.get<ParliamentSession[]>('/fuel/dynamic-allocation/parliament-sessions/', params);
  }

  /**
   * Get parliament session by ID
   */
  async getSession(sessionId: number): Promise<ParliamentSession> {
    return this.apiClient.get<ParliamentSession>(`/fuel/dynamic-allocation/parliament-sessions/${sessionId}/`);
  }

  /**
   * Get active sessions
   */
  async getActiveSessions(): Promise<ParliamentSession[]> {
    return this.apiClient.get<ParliamentSession[]>('/fuel/dynamic-allocation/parliament-sessions/active/');
  }

  /**
   * Get current session
   */
  async getCurrentSession(): Promise<ParliamentSession | null> {
    try {
      return await this.apiClient.get<ParliamentSession>('/fuel/dynamic-allocation/parliament-sessions/current/');
    } catch (error) {
      return null; // No current session
    }
  }

  /**
   * Get session allocation impact
   */
  async getSessionAllocationImpact(sessionId: number): Promise<{
    session_details: ParliamentSession;
    impact_analysis: {
      affected_beneficiaries: number;
      additional_litres_per_beneficiary: number;
      total_additional_litres: number;
      total_additional_cost_usd: number;
      cost_increase_percentage: number;
    };
    allocation_previews: Array<{
      beneficiary_id: number;
      beneficiary_name: string;
      base_allocation: number;
      with_session_supplement: number;
      additional_litres: number;
    }>;
  }> {
    return this.apiClient.get<any>(`/fuel/dynamic-allocation/parliament-sessions/${sessionId}/allocation-impact/`);
  }
}

// ======================= COMBINED SERVICE MANAGER =======================

export class DynamicAllocationServiceManager {
  public readonly rules: AllocationRuleService;
  public readonly prices: FuelPriceService;
  public readonly calculations: AllocationCalculationService;
  public readonly analytics: AllocationAnalyticsService;
  public readonly beneficiaries: BeneficiaryService;
  public readonly sessions: ParliamentSessionService;

  private apiClient: ApiClient;

  constructor(config?: Partial<ApiConfig>) {
    this.apiClient = new ApiClient(config);
    
    this.rules = new AllocationRuleService(this.apiClient);
    this.prices = new FuelPriceService(this.apiClient);
    this.calculations = new AllocationCalculationService(this.apiClient);
    this.analytics = new AllocationAnalyticsService(this.apiClient);
    this.beneficiaries = new BeneficiaryService(this.apiClient);
    this.sessions = new ParliamentSessionService(this.apiClient);
  }

  /**
   * Get API client for custom requests
   */
  getApiClient(): ApiClient {
    return this.apiClient;
  }

  /**
   * Health check for all services
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, boolean>;
    timestamp: string;
  }> {
    const services: Record<string, boolean> = {};
    let healthyCount = 0;

    try {
      await this.rules.getAllRules({ is_active: true });
      services.rules = true;
      healthyCount++;
    } catch {
      services.rules = false;
    }

    try {
      await this.prices.getCurrentDefaultPrice();
      services.prices = true;
      healthyCount++;
    } catch {
      services.prices = false;
    }

    try {
      await this.beneficiaries.getAllBeneficiaries({ page_size: 1 });
      services.beneficiaries = true;
      healthyCount++;
    } catch {
      services.beneficiaries = false;
    }

    try {
      await this.sessions.getActiveSessions();
      services.sessions = true;
      healthyCount++;
    } catch {
      services.sessions = false;
    }

    const totalServices = Object.keys(services).length;
    let status: 'healthy' | 'degraded' | 'unhealthy';

    if (healthyCount === totalServices) {
      status = 'healthy';
    } else if (healthyCount > 0) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      services,
      timestamp: new Date().toISOString(),
    };
  }
}

// ======================= DEFAULT EXPORT =======================

export default DynamicAllocationServiceManager;
