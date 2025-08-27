/**
 * Dynamic Fuel Allocation System - Frontend TypeScript Utilities
 * 
 * Comprehensive TypeScript utilities for the Dynamic Fuel Allocation System.
 * Provides client-side calculation preview, validation, and data management.
 * 
 * Designed to work seamlessly with Django backend API endpoints.
 */

// ======================= TYPE DEFINITIONS =======================

export interface EngineCapacityBand {
  band: 'UNDER_2800' | '2800_TO_3199' | '3200_AND_ABOVE';
  minCc: number;
  maxCc: number | null;
  displayName: string;
  constant: number;
}

export interface FuelAllocationRule {
  id: number;
  rule_name: string;
  rule_type: 'BASE_ALLOCATION' | 'ENGINE_MULTIPLIER' | 'DISTANCE_FACTOR' | 'SESSION_SUPPLEMENT' | 'CATEGORY_BONUS' | 'EMERGENCY_ALLOCATION';
  rule_code: string;
  description: string;
  applies_to_engine_band?: 'UNDER_2800' | '2800_TO_3199' | '3200_AND_ABOVE';
  applies_to_category?: number;
  applies_to_distance_min?: number;
  applies_to_distance_max?: number;
  period_type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  engine_constant_under_2800: number;
  engine_constant_2800_3199: number;
  engine_constant_3200_plus: number;
  distance_factor_base: number;
  distance_factor_per_km: number;
  max_distance_factor: number;
  minimum_allocation_litres: number;
  maximum_allocation_litres: number;
  session_top_up_litres: number;
  session_top_up_percentage: number;
  is_active: boolean;
  effective_from: string;
  effective_until?: string;
  priority: number;
  custom_formula?: string;
}

export interface FuelPrice {
  id: number;
  fuel_type: 'PETROL' | 'DIESEL' | 'BOTH';
  price_per_litre_usd: number;
  price_per_litre_zwg?: number;
  exchange_rate_usd_zwg?: number;
  effective_date: string;
  expiry_date?: string;
  price_source: 'MANUAL' | 'GOVERNMENT_GAZETTE' | 'ENERGY_MINISTRY' | 'MARKET_RATE' | 'API_FEED';
  source_reference?: string;
  is_active: boolean;
  is_default: boolean;
  notes?: string;
}

export interface BeneficiaryProfile {
  id: number;
  user_details: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    full_name: string;
    email: string;
    phone?: string;
    role: string;
  };
  category_details?: {
    id: number;
    name: string;
    description: string;
    monthly_entitlement_litres: number;
    category_multiplier: number;
  };
  constituency_details?: {
    id: number;
    name: string;
    province: string;
    district?: string;
    distance_from_parliament_km: number;
    population?: number;
  };
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year?: number;
  engine_size: string;
  vehicle_registration: string;
  fuel_type: 'PETROL' | 'DIESEL';
  engine_capacity_cc?: number;
  distance_from_parliament_km?: number;
  monthly_entitlement_litres: number;
  current_balance: number;
  used_this_month: number;
}

export interface ParliamentSession {
  id: number;
  title: string;
  session_type: 'REGULAR' | 'SPECIAL' | 'COMMITTEE' | 'BUDGET' | 'EMERGENCY';
  start_date: string;
  end_date: string;
  description?: string;
  is_active: boolean;
  fuel_top_up_litres: number;
  fuel_top_up_percentage: number;
  expected_attendance: number;
  attendance_tracked: boolean;
}

export interface AllocationCalculationInput {
  beneficiary_id: number;
  rule_id: number;
  period_start: string;
  period_end: string;
  parliament_session_id?: number;
  fuel_price_id?: number;
  custom_parameters?: {
    engine_constants?: {
      UNDER_2800?: number;
      '2800_TO_3199'?: number;
      '3200_AND_ABOVE'?: number;
    };
    distance_base?: number;
    distance_per_km?: number;
    max_distance_factor?: number;
    min_allocation?: number;
    max_allocation?: number;
    session_top_up_litres?: number;
    session_top_up_percentage?: number;
  };
}

export interface AllocationCalculationResult {
  success: boolean;
  allocation_preview?: {
    allocation_id: string;
    beneficiary: {
      name: string;
      category?: string;
      constituency?: string;
      vehicle_info: {
        make: string;
        model: string;
        year?: number;
        engine_size: string;
        registration: string;
        fuel_type: string;
      };
    };
    allocation_details: {
      base_litres: number;
      session_supplement: number;
      total_litres: number;
      value_usd: number;
    };
    calculation_breakdown: {
      distance_km: number;
      engine_capacity_cc: number;
      engine_constant: number;
      distance_factor: number;
      fuel_price_usd: number;
      aa_usd: number;
      base_litres: number;
      session_litres: number;
      total_before_caps: number;
      final_litres: number;
      final_value_usd: number;
    };
    period: {
      start_date: string;
      end_date: string;
      period_type: string;
    };
    rule_applied: string;
    status: string;
  };
  calculation_result?: {
    success: boolean;
    calculation_breakdown: any;
    allocation_result: any;
    metadata: any;
  };
  error?: string;
}

export interface BulkAllocationPreviewInput {
  beneficiary_ids: number[];
  rule_id: number;
  period_start: string;
  period_end: string;
  parliament_session_id?: number;
  fuel_price_id?: number;
  filters?: {
    category?: string;
    constituency?: string;
    engine_band?: string;
  };
}

export interface BulkAllocationPreviewResult {
  success: boolean;
  summary: {
    total_beneficiaries: number;
    successful_previews: number;
    failed_previews: number;
    total_litres: number;
    total_value_usd: number;
    average_allocation: number;
  };
  previews: Array<{
    beneficiary_id: number;
    beneficiary_name: string;
    allocation_details: {
      base_litres: number;
      session_supplement: number;
      total_litres: number;
      value_usd: number;
    };
    calculation_breakdown: any;
  }>;
  errors: Array<{
    beneficiary_id: number;
    beneficiary_name: string;
    error: string;
  }>;
  metadata: {
    generated_at: string;
    generated_by: string;
    rule_applied: string;
  };
}

// ======================= CALCULATION ENGINE =======================

export class AllocationCalculationEngine {
  // Default engine constants from POZ data analysis
  private static readonly DEFAULT_ENGINE_CONSTANTS = {
    UNDER_2800: 0.39,
    '2800_TO_3199': 0.43,
    '3200_AND_ABOVE': 0.56,
  };

  // Default distance factors
  private static readonly DEFAULT_DISTANCE_BASE = 1.0;
  private static readonly DEFAULT_DISTANCE_PER_KM = 0.001;
  private static readonly DEFAULT_MAX_DISTANCE_FACTOR = 2.0;

  // Default limits
  private static readonly DEFAULT_MIN_ALLOCATION = 20;
  private static readonly DEFAULT_MAX_ALLOCATION = 500;
  private static readonly DEFAULT_FUEL_PRICE = 1.40;

  /**
   * Calculate fuel allocation using the master formula:
   * AA_USD = Mileage × EngineConstant × DistanceFactor
   * Litres = AA_USD / FuelPriceUSD + SessionTopUp
   * Apply caps and floors
   */
  static calculateAllocation(
    distanceKm: number,
    engineCapacityCc: number,
    fuelPriceUsd: number,
    parliamentSession?: ParliamentSession,
    rule?: FuelAllocationRule,
    customParameters?: any
  ): {
    success: boolean;
    calculation_breakdown: any;
    allocation_result: any;
    metadata: any;
    error?: string;
  } {
    try {
      // Get calculation parameters
      const params = this.getCalculationParameters(rule, customParameters);

      // Get engine constant based on capacity
      const engineConstant = this.getEngineConstant(engineCapacityCc, params);

      // Calculate distance factor
      const distanceFactor = this.calculateDistanceFactor(distanceKm, params);

      // Calculate base AA_USD (Allocation Amount in USD)
      const aaUsd = distanceKm * engineConstant * distanceFactor;

      // Calculate base litres from USD amount
      const baseLitres = fuelPriceUsd > 0 ? aaUsd / fuelPriceUsd : 0;

      // Calculate session supplements
      const sessionLitres = this.calculateSessionSupplement(
        baseLitres, parliamentSession, params
      );

      // Calculate total before caps
      const totalBeforeCaps = baseLitres + sessionLitres;

      // Apply caps and floors
      const finalLitres = this.applyCapsAndFloors(totalBeforeCaps, params);

      // Calculate final USD value
      const finalValueUsd = finalLitres * fuelPriceUsd;

      return {
        success: true,
        calculation_breakdown: {
          distance_km: distanceKm,
          engine_capacity_cc: engineCapacityCc,
          engine_constant: engineConstant,
          distance_factor: distanceFactor,
          fuel_price_usd: fuelPriceUsd,
          aa_usd: aaUsd,
          base_litres: baseLitres,
          session_litres: sessionLitres,
          total_before_caps: totalBeforeCaps,
          final_litres: finalLitres,
          final_value_usd: finalValueUsd,
        },
        allocation_result: {
          base_allocation_litres: baseLitres,
          session_supplement_litres: sessionLitres,
          total_allocation_litres: finalLitres,
          allocated_value_usd: finalValueUsd,
        },
        metadata: {
          calculation_date: new Date().toISOString(),
          engine_band: this.getEngineBand(engineCapacityCc),
          rule_source: rule?.rule_name || 'DEFAULT',
          parliament_session: parliamentSession?.title || null,
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Calculation failed',
        calculation_breakdown: {},
        allocation_result: {
          base_allocation_litres: 0,
          session_supplement_litres: 0,
          total_allocation_litres: 0,
          allocated_value_usd: 0,
        },
        metadata: {}
      };
    }
  }

  private static getCalculationParameters(rule?: FuelAllocationRule, customParameters?: any): any {
    if (rule) {
      return {
        engine_constants: {
          UNDER_2800: rule.engine_constant_under_2800,
          '2800_TO_3199': rule.engine_constant_2800_3199,
          '3200_AND_ABOVE': rule.engine_constant_3200_plus,
        },
        distance_base: rule.distance_factor_base,
        distance_per_km: rule.distance_factor_per_km,
        max_distance_factor: rule.max_distance_factor,
        min_allocation: rule.minimum_allocation_litres,
        max_allocation: rule.maximum_allocation_litres,
        session_top_up_litres: rule.session_top_up_litres,
        session_top_up_percentage: rule.session_top_up_percentage,
      };
    }

    // Use defaults with custom overrides
    const params = {
      engine_constants: { ...this.DEFAULT_ENGINE_CONSTANTS },
      distance_base: this.DEFAULT_DISTANCE_BASE,
      distance_per_km: this.DEFAULT_DISTANCE_PER_KM,
      max_distance_factor: this.DEFAULT_MAX_DISTANCE_FACTOR,
      min_allocation: this.DEFAULT_MIN_ALLOCATION,
      max_allocation: this.DEFAULT_MAX_ALLOCATION,
      session_top_up_litres: 0,
      session_top_up_percentage: 0,
    };

    if (customParameters) {
      return { ...params, ...customParameters };
    }

    return params;
  }

  private static getEngineConstant(engineCapacityCc: number, params: any): number {
    if (engineCapacityCc < 2800) {
      return params.engine_constants.UNDER_2800;
    } else if (engineCapacityCc >= 2800 && engineCapacityCc <= 3199) {
      return params.engine_constants['2800_TO_3199'];
    } else {
      return params.engine_constants['3200_AND_ABOVE'];
    }
  }

  private static getEngineBand(engineCapacityCc: number): string {
    if (engineCapacityCc < 2800) {
      return 'UNDER_2800';
    } else if (engineCapacityCc >= 2800 && engineCapacityCc <= 3199) {
      return '2800_TO_3199';
    } else {
      return '3200_AND_ABOVE';
    }
  }

  private static calculateDistanceFactor(distanceKm: number, params: any): number {
    const factor = params.distance_base + (distanceKm * params.distance_per_km);
    return Math.min(factor, params.max_distance_factor);
  }

  private static calculateSessionSupplement(
    baseLitres: number,
    parliamentSession?: ParliamentSession,
    params?: any
  ): number {
    let sessionLitres = 0;

    // Check parliament session specific top-up
    if (parliamentSession) {
      if (parliamentSession.fuel_top_up_litres > 0) {
        sessionLitres += parliamentSession.fuel_top_up_litres;
      } else if (parliamentSession.fuel_top_up_percentage > 0) {
        sessionLitres += baseLitres * (parliamentSession.fuel_top_up_percentage / 100);
      }
    }

    // Apply rule-based top-ups
    if (params?.session_top_up_litres > 0) {
      sessionLitres += params.session_top_up_litres;
    }

    if (params?.session_top_up_percentage > 0) {
      sessionLitres += baseLitres * (params.session_top_up_percentage / 100);
    }

    return sessionLitres;
  }

  private static applyCapsAndFloors(totalLitres: number, params: any): number {
    return Math.max(
      params.min_allocation,
      Math.min(totalLitres, params.max_allocation)
    );
  }

  /**
   * Extract engine capacity from engine size string
   */
  static extractEngineCapacity(engineSize: string): number {
    if (!engineSize) return 2500; // Default fallback

    // Look for patterns like "2.2L", "3000cc", "3.0L V6"
    const pattern = /(\d+\.?\d*)\s*(?:L|cc|litre|liter)/i;
    const match = engineSize.match(pattern);

    if (match) {
      const size = parseFloat(match[1]);
      // Convert to CC if in litres
      if (/L|litre|liter/i.test(engineSize)) {
        return Math.round(size * 1000); // Convert litres to CC
      } else {
        return Math.round(size); // Already in CC
      }
    }

    return 2500; // Conservative mid-range estimate
  }

  /**
   * Get engine capacity band information
   */
  static getEngineCapacityBands(): EngineCapacityBand[] {
    return [
      {
        band: 'UNDER_2800',
        minCc: 0,
        maxCc: 2799,
        displayName: 'Under 2800cc',
        constant: this.DEFAULT_ENGINE_CONSTANTS.UNDER_2800
      },
      {
        band: '2800_TO_3199',
        minCc: 2800,
        maxCc: 3199,
        displayName: '2800cc - 3199cc',
        constant: this.DEFAULT_ENGINE_CONSTANTS['2800_TO_3199']
      },
      {
        band: '3200_AND_ABOVE',
        minCc: 3200,
        maxCc: null,
        displayName: '3200cc and above',
        constant: this.DEFAULT_ENGINE_CONSTANTS['3200_AND_ABOVE']
      }
    ];
  }
}

// ======================= VALIDATION UTILITIES =======================

export class AllocationValidation {
  /**
   * Validate allocation calculation input
   */
  static validateCalculationInput(input: AllocationCalculationInput): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!input.beneficiary_id) {
      errors.push('Beneficiary ID is required');
    }

    if (!input.rule_id) {
      errors.push('Allocation rule ID is required');
    }

    if (!input.period_start) {
      errors.push('Period start date is required');
    }

    if (!input.period_end) {
      errors.push('Period end date is required');
    }

    // Date validation
    if (input.period_start && input.period_end) {
      const startDate = new Date(input.period_start);
      const endDate = new Date(input.period_end);

      if (startDate >= endDate) {
        errors.push('Period end date must be after start date');
      }

      // Check for reasonable period length
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff > 366) {
        warnings.push('Allocation period is longer than one year');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate fuel allocation rule
   */
  static validateAllocationRule(rule: Partial<FuelAllocationRule>): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!rule.rule_name?.trim()) {
      errors.push('Rule name is required');
    }

    if (!rule.rule_type) {
      errors.push('Rule type is required');
    }

    // Validate allocation limits
    if (rule.minimum_allocation_litres !== undefined && rule.maximum_allocation_litres !== undefined) {
      if (rule.minimum_allocation_litres >= rule.maximum_allocation_litres) {
        errors.push('Minimum allocation must be less than maximum allocation');
      }
    }

    // Validate engine constants
    if (rule.engine_constant_under_2800 !== undefined && rule.engine_constant_under_2800 <= 0) {
      errors.push('Engine constant for under 2800cc must be positive');
    }

    if (rule.engine_constant_2800_3199 !== undefined && rule.engine_constant_2800_3199 <= 0) {
      errors.push('Engine constant for 2800-3199cc must be positive');
    }

    if (rule.engine_constant_3200_plus !== undefined && rule.engine_constant_3200_plus <= 0) {
      errors.push('Engine constant for 3200cc+ must be positive');
    }

    // Validate distance parameters
    if (rule.distance_factor_per_km !== undefined && rule.distance_factor_per_km < 0) {
      errors.push('Distance factor per km cannot be negative');
    }

    if (rule.max_distance_factor !== undefined && rule.max_distance_factor <= 0) {
      errors.push('Maximum distance factor must be positive');
    }

    // Date validation
    if (rule.effective_from && rule.effective_until) {
      const fromDate = new Date(rule.effective_from);
      const untilDate = new Date(rule.effective_until);

      if (fromDate >= untilDate) {
        errors.push('Effective until date must be after effective from date');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate fuel price data
   */
  static validateFuelPrice(price: Partial<FuelPrice>): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!price.fuel_type) {
      errors.push('Fuel type is required');
    }

    if (price.price_per_litre_usd === undefined) {
      errors.push('Price per litre in USD is required');
    } else if (price.price_per_litre_usd <= 0) {
      errors.push('Price per litre must be positive');
    }

    if (!price.effective_date) {
      errors.push('Effective date is required');
    }

    // Date validation
    if (price.effective_date && price.expiry_date) {
      const effectiveDate = new Date(price.effective_date);
      const expiryDate = new Date(price.expiry_date);

      if (effectiveDate >= expiryDate) {
        errors.push('Expiry date must be after effective date');
      }
    }

    // Price reasonableness check
    if (price.price_per_litre_usd !== undefined) {
      if (price.price_per_litre_usd < 0.50) {
        warnings.push('Price seems unusually low (less than $0.50/L)');
      }
      if (price.price_per_litre_usd > 5.00) {
        warnings.push('Price seems unusually high (more than $5.00/L)');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// ======================= DATA FORMATTING UTILITIES =======================

export class AllocationFormatter {
  /**
   * Format allocation amount for display
   */
  static formatLitres(litres: number, decimalPlaces: number = 2): string {
    return `${litres.toLocaleString(undefined, {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces
    })}L`;
  }

  /**
   * Format USD value for display
   */
  static formatUSD(amount: number, decimalPlaces: number = 2): string {
    return `$${amount.toLocaleString(undefined, {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces
    })}`;
  }

  /**
   * Format percentage for display
   */
  static formatPercentage(value: number, decimalPlaces: number = 1): string {
    return `${value.toFixed(decimalPlaces)}%`;
  }

  /**
   * Format engine capacity for display
   */
  static formatEngineCapacity(capacityCc: number): string {
    if (capacityCc >= 1000) {
      return `${(capacityCc / 1000).toFixed(1)}L`;
    }
    return `${capacityCc}cc`;
  }

  /**
   * Format distance for display
   */
  static formatDistance(distanceKm: number): string {
    return `${distanceKm.toLocaleString()}km`;
  }

  /**
   * Format allocation period for display
   */
  static formatPeriod(startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const startStr = start.toLocaleDateString();
    const endStr = end.toLocaleDateString();
    
    return `${startStr} - ${endStr}`;
  }

  /**
   * Get allocation status display
   */
  static getStatusDisplay(status: string): {
    text: string;
    color: string;
    bgColor: string;
  } {
    const statusMap: Record<string, any> = {
      PREVIEW: { text: 'Preview', color: 'text-blue-700', bgColor: 'bg-blue-100' },
      COMMITTED: { text: 'Committed', color: 'text-green-700', bgColor: 'bg-green-100' },
      PARTIALLY_FULFILLED: { text: 'Partially Fulfilled', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
      FULFILLED: { text: 'Fulfilled', color: 'text-green-700', bgColor: 'bg-green-100' },
      EXPIRED: { text: 'Expired', color: 'text-red-700', bgColor: 'bg-red-100' },
      CANCELLED: { text: 'Cancelled', color: 'text-gray-700', bgColor: 'bg-gray-100' },
    };

    return statusMap[status] || { text: status, color: 'text-gray-700', bgColor: 'bg-gray-100' };
  }
}

// ======================= EXPORT ALL UTILITIES =======================

export default {
  AllocationCalculationEngine,
  AllocationValidation,
  AllocationFormatter,
};
