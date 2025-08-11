// src/types/dynamicAllocation.ts
// TypeScript interfaces for Dynamic Fuel Allocation System

export interface FuelAllocationRule {
  id: number;
  rule_name: string;
  description: string;
  is_active: boolean;
  engine_capacity_bands: {
    small_engine: {
      min_cc: number;
      max_cc: number;
      constant: number;
    };
    medium_engine: {
      min_cc: number;
      max_cc: number;
      constant: number;
    };
    large_engine: {
      min_cc: number;
      max_cc: number;
      constant: number;
    };
  };
  distance_calculation_mode: 'linear' | 'stepped' | 'custom';
  session_top_up_mode: 'percentage' | 'fixed' | 'none';
  created_date: string;
  last_modified: string;
}

export interface FuelPrice {
  id: number;
  fuel_type: string;
  price_usd_per_litre: number;
  price_zwg_per_litre: number;
  exchange_rate_usd_to_zwg: number;
  effective_from: string;
  effective_to?: string;
  is_current: boolean;
  created_date: string;
  last_modified: string;
}

export interface DynamicAllocation {
  id: number;
  beneficiary: number;
  beneficiary_name: string;
  constituency_name: string;
  session: number;
  session_name: string;
  allocation_rule: number;
  rule_name: string;
  calculated_allocation_usd: number;
  calculated_allocation_litres: number;
  final_allocation_litres: number;
  is_committed: boolean;
  committed_by?: number;
  committed_date?: string;
  calculation_details: {
    engine_capacity_cc: number;
    engine_constant: number;
    distance_from_parliament_km: number;
    distance_factor: number;
    base_allocation_usd: number;
    session_top_up_litres: number;
    fuel_price_usd: number;
    calculation_breakdown: string[];
  };
  created_date: string;
  last_modified: string;
}

export interface AllocationPreviewRequest {
  beneficiary_ids: number[];
  session_id: number;
  allocation_rule_id: number;
}

export interface AllocationPreviewResult {
  beneficiary_id: number;
  beneficiary_name: string;
  constituency_name: string;
  engine_capacity_cc: number;
  distance_from_parliament_km: number;
  calculated_allocation_usd: number;
  calculated_allocation_litres: number;
  session_top_up_litres: number;
  final_allocation_litres: number;
  calculation_breakdown: {
    base_calculation: string;
    engine_factor: string;
    distance_factor: string;
    session_bonus: string;
    fuel_price: string;
    final_result: string;
  };
}

export interface AllocationCalculationRequest {
  beneficiary_id: number;
  session_id: number;
  allocation_rule_id: number;
  override_distance?: number;
  override_engine_capacity?: number;
}

export interface AllocationAnalytics {
  total_allocations: number;
  total_litres_allocated: number;
  total_usd_allocated: number;
  committed_allocations: number;
  pending_allocations: number;
  average_allocation_per_beneficiary: number;
  top_constituencies: Array<{
    constituency_name: string;
    total_allocations: number;
    total_litres: number;
    beneficiary_count: number;
  }>;
  allocation_trends: Array<{
    date: string;
    total_allocations: number;
    total_litres: number;
    committed_count: number;
  }>;
  engine_capacity_distribution: {
    small_engine: number;
    medium_engine: number;
    large_engine: number;
  };
}

export interface EnhancedBeneficiaryProfile {
  id: number;
  user: number;
  beneficiary_category: number;
  constituency: number;
  constituency_name: string;
  category_name: string;
  engine_capacity_cc: number;
  distance_from_parliament_km: number;
  member_number: string;
  phone_number: string;
  is_active: boolean;
  join_date: string;
  created_date: string;
  last_modified: string;
}

export interface EnhancedParliamentSession {
  id: number;
  name: string;
  session_type: string;
  start_date: string;
  end_date: string;
  fuel_top_up_litres: number;
  fuel_top_up_percentage: number;
  attendance_tracked: boolean;
  expected_attendance: number;
  is_active: boolean;
  created_date: string;
  last_modified: string;
}

// Form interfaces for components
export interface AllocationCalculatorForm {
  beneficiary_id: number;
  session_id: number;
  allocation_rule_id: number;
  override_distance?: number;
  override_engine_capacity?: number;
}

export interface BulkAllocationForm {
  beneficiary_ids: number[];
  session_id: number;
  allocation_rule_id: number;
  commit_immediately?: boolean;
}

export interface FuelRuleForm {
  rule_name: string;
  description: string;
  is_active: boolean;
  engine_capacity_bands: {
    small_engine: {
      min_cc: number;
      max_cc: number;
      constant: number;
    };
    medium_engine: {
      min_cc: number;
      max_cc: number;
      constant: number;
    };
    large_engine: {
      min_cc: number;
      max_cc: number;
      constant: number;
    };
  };
  distance_calculation_mode: 'linear' | 'stepped' | 'custom';
  session_top_up_mode: 'percentage' | 'fixed' | 'none';
}

export interface FuelPriceForm {
  fuel_type: string;
  price_usd_per_litre: number;
  exchange_rate_usd_to_zwg: number;
  effective_from: string;
  effective_to?: string;
  is_current: boolean;
}

// API Response interfaces
export interface DynamicAllocationApiResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

export interface AllocationCommitResponse {
  success: boolean;
  committed_allocations: number[];
  total_litres_committed: number;
  total_usd_committed: number;
  message: string;
}

// UI State interfaces
export interface AllocationCalculatorState {
  loading: boolean;
  result: AllocationPreviewResult | null;
  error: string | null;
}

export interface BulkAllocationState {
  loading: boolean;
  previews: AllocationPreviewResult[];
  committed: boolean;
  error: string | null;
}

export interface AllocationAnalyticsState {
  loading: boolean;
  data: AllocationAnalytics | null;
  dateRange: [string, string];
  error: string | null;
}

// Constants and Enums
export const ENGINE_CAPACITY_BANDS = {
  SMALL: { min: 0, max: 2799, constant: 0.39, label: 'Small Engine (< 2800cc)' },
  MEDIUM: { min: 2800, max: 3199, constant: 0.43, label: 'Medium Engine (2800-3199cc)' },
  LARGE: { min: 3200, max: 9999, constant: 0.56, label: 'Large Engine (≥ 3200cc)' }
} as const;

export const FUEL_TYPES = {
  PETROL: 'petrol',
  DIESEL: 'diesel',
  PREMIUM: 'premium'
} as const;

export const ALLOCATION_STATUS = {
  PENDING: 'pending',
  COMMITTED: 'committed',
  CANCELLED: 'cancelled'
} as const;

export const DISTANCE_FACTOR = 0.001; // Standard distance factor for POZ calculations

export type EngineCapacityBand = keyof typeof ENGINE_CAPACITY_BANDS;
export type FuelType = typeof FUEL_TYPES[keyof typeof FUEL_TYPES];
export type AllocationStatus = typeof ALLOCATION_STATUS[keyof typeof ALLOCATION_STATUS];
