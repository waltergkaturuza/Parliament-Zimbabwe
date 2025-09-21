// src/services/fuelDispatchHandler.ts
import apiClient from '@/api/index';
import { message } from 'antd';
import type { BeneficiaryProfile, FuelEntitlement } from '@/types';
import SubCenterStockService from './subCenterStockService';

export interface FuelStock {
  id: string;
  fuelType: 'PETROL' | 'DIESEL';
  availableLiters: number;
  reservedLiters: number;
  totalLiters: number;
  pricePerLiter: number;
  lastUpdated: string;
  source: 'HANDOVER' | 'TRANSFER' | 'EMERGENCY';
}

export interface DispatchRequest {
  beneficiaryId: string;
  requestedLiters: number;
  fuelType: 'PETROL' | 'DIESEL';
  entitlementSource: 'MONTHLY' | 'SESSION' | 'COMMITTEE' | 'SPECIAL_EVENT' | 'TRAVEL_ALLOWANCE' | 'EMERGENCY' | 'CONSTITUENCY_WORK';
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
  notes?: string;
}

export interface DispatchResult {
  success: boolean;
  dispatchId?: string;
  couponNumber?: string;
  actualLitersDispatched: number;
  entitlementUsed: number;
  stockRemaining: number;
  entitlementRemaining: number;
  message: string;
  error?: string;
}

export interface DispatchCalculation {
  canDispatch: boolean;
  maxDispatchable: number;
  limitingFactor: 'STOCK' | 'ENTITLEMENT' | 'NONE';
  stockAvailable: number;
  entitlementAvailable: number;
  message: string;
}

class FuelDispatchHandler {
  private subcenterId: string | null = null;
  private currentStock: FuelStock[] = [];
  private entitlements: FuelEntitlement[] = [];
  private intelligentStockData: any = null;

  constructor(subcenterId?: string) {
    this.subcenterId = subcenterId || null;
  }

  /**
   * Get the subcenter ID
   */
  get currentSubcenterId(): string | null {
    return this.subcenterId;
  }

  /**
   * Initialize the dispatch handler with current stock and entitlement data
   */
  async initialize(): Promise<void> {
    try {
      await Promise.all([
        this.fetchCurrentStock(),
        this.fetchEntitlements()
      ]);
    } catch (error) {
      console.error('Failed to initialize dispatch handler:', error);
      throw new Error('Failed to initialize fuel dispatch system');
    }
  }

  /**
   * Fetch current fuel stock using intelligent stock calculation from handover receipts
   */
  private async fetchCurrentStock(): Promise<void> {
    try {
      console.log('🔍 Fetching intelligent stock for subcenter:', this.subcenterId);
      
      // Check if subcenter ID is available
      if (!this.subcenterId) {
        throw new Error('Subcenter ID is required for intelligent stock calculation');
      }
      
      // Use intelligent stock service to calculate from handover receipts minus dispatches
      const stockService = new SubCenterStockService(this.subcenterId);
      const intelligentStock = await stockService.calculateCurrentStock();
      
      // Convert to FuelStock format expected by dispatch handler
      this.currentStock = [];
      
      // Add petrol stock
      if (intelligentStock.petrol.availableStock.liters > 0) {
        this.currentStock.push({
          id: 'petrol-stock',
          fuelType: 'PETROL',
          availableLiters: intelligentStock.petrol.availableStock.liters,
          reservedLiters: 0, // Reserved liters can be calculated if needed
          totalLiters: intelligentStock.petrol.totalReceived.liters,
          pricePerLiter: 1.45, // Should come from configuration
          lastUpdated: intelligentStock.lastUpdated,
          source: 'HANDOVER'
        });
      }
      
      // Add diesel stock
      if (intelligentStock.diesel.availableStock.liters > 0) {
        this.currentStock.push({
          id: 'diesel-stock',
          fuelType: 'DIESEL',
          availableLiters: intelligentStock.diesel.availableStock.liters,
          reservedLiters: 0, // Reserved liters can be calculated if needed
          totalLiters: intelligentStock.diesel.totalReceived.liters,
          pricePerLiter: 1.38, // Should come from configuration
          lastUpdated: intelligentStock.lastUpdated,
          source: 'HANDOVER'
        });
      }
      
      console.log('✅ Intelligent stock calculated:', this.currentStock);
      
      // Store the detailed stock for additional operations
      this.intelligentStockData = intelligentStock;
      
    } catch (error) {
      console.error('❌ Failed to fetch intelligent stock, falling back to API:', error);
      
      // Fallback to direct API call
      try {
        const response = await apiClient.get(`/subcenter-inventory/${this.subcenterId}/fuel-stock/`);
        this.currentStock = response.data.results || response.data || [];
      } catch (apiError) {
        console.error('❌ API fallback also failed, using demo data:', apiError);
        // Final fallback to demo data for development
        this.currentStock = [
          {
            id: '1',
            fuelType: 'PETROL',
            availableLiters: 0, // Show zero to indicate no stock
            reservedLiters: 0,
            totalLiters: 0,
            pricePerLiter: 1.45,
            lastUpdated: new Date().toISOString(),
            source: 'HANDOVER'
          },
          {
            id: '2',
            fuelType: 'DIESEL',
            availableLiters: 0, // Show zero to indicate no stock
            reservedLiters: 0,
            totalLiters: 0,
            pricePerLiter: 1.38,
            lastUpdated: new Date().toISOString(),
            source: 'HANDOVER'
          }
        ];
      }
    }
  }

  /**
   * Fetch current entitlements
   */
  private async fetchEntitlements(): Promise<void> {
    try {
      const response = await apiClient.get('/fuel-entitlements/?page_size=1000');
      this.entitlements = response.data.results || response.data || [];
    } catch (error) {
      console.error('Failed to fetch entitlements:', error);
      this.entitlements = [];
    }
  }

  /**
   * Get available fuel stock by type
   */
  getAvailableStock(fuelType: 'PETROL' | 'DIESEL'): FuelStock | null {
    return this.currentStock.find(stock => stock.fuelType === fuelType) || null;
  }

  /**
   * Get beneficiary's available entitlement
   */
  async getBeneficiaryEntitlement(beneficiaryId: string): Promise<{
    totalEntitlement: number;
    usedEntitlement: number;
    availableEntitlement: number;
    entitlementSources: any[];
  }> {
    try {
      // Fetch beneficiary's entitlements
      const entitlement = this.entitlements.find(e => e.beneficiary?.id === beneficiaryId);
      if (!entitlement) {
        return {
          totalEntitlement: 0,
          usedEntitlement: 0,
          availableEntitlement: 0,
          entitlementSources: []
        };
      }

      // Fetch previous dispatches to calculate used entitlement
      const dispatchResponse = await apiClient.get(`/fuel-dispatches/?beneficiary=${beneficiaryId}&month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`);
      const dispatches = dispatchResponse.data.results || dispatchResponse.data || [];
      
      const usedThisMonth = dispatches.reduce((sum: number, dispatch: any) => 
        sum + (dispatch.liters_dispensed || 0), 0);

      const totalMonthlyEntitlement = entitlement.monthly_allocation || 0;
      const availableEntitlement = Math.max(0, totalMonthlyEntitlement - usedThisMonth);

      return {
        totalEntitlement: totalMonthlyEntitlement,
        usedEntitlement: usedThisMonth,
        availableEntitlement,
        entitlementSources: [
          {
            source: 'MONTHLY',
            total: totalMonthlyEntitlement,
            used: usedThisMonth,
            available: availableEntitlement
          }
        ]
      };
    } catch (error) {
      console.error('Failed to get beneficiary entitlement:', error);
      return {
        totalEntitlement: 0,
        usedEntitlement: 0,
        availableEntitlement: 0,
        entitlementSources: []
      };
    }
  }

  /**
   * Calculate dispatch feasibility (Bidirectional Calculator)
   */
  async calculateDispatch(
    beneficiaryId: string, 
    requestedLiters: number, 
    fuelType: 'PETROL' | 'DIESEL' = 'PETROL'
  ): Promise<DispatchCalculation> {
    const stock = this.getAvailableStock(fuelType);
    const entitlement = await this.getBeneficiaryEntitlement(beneficiaryId);

    if (!stock) {
      return {
        canDispatch: false,
        maxDispatchable: 0,
        limitingFactor: 'STOCK',
        stockAvailable: 0,
        entitlementAvailable: entitlement.availableEntitlement,
        message: `No ${fuelType.toLowerCase()} stock available`
      };
    }

    const stockAvailable = stock.availableLiters;
    const entitlementAvailable = entitlement.availableEntitlement;

    // Calculate maximum dispatchable amount
    const maxDispatchable = Math.min(stockAvailable, entitlementAvailable, requestedLiters);

    let canDispatch = maxDispatchable > 0;
    let limitingFactor: 'STOCK' | 'ENTITLEMENT' | 'NONE' = 'NONE';
    let message = '';

    if (maxDispatchable === 0) {
      canDispatch = false;
      if (stockAvailable === 0) {
        limitingFactor = 'STOCK';
        message = `❌ No ${fuelType.toLowerCase()} stock available`;
      } else if (entitlementAvailable === 0) {
        limitingFactor = 'ENTITLEMENT';
        message = '❌ No entitlement remaining for this beneficiary';
      }
    } else if (maxDispatchable === requestedLiters) {
      message = `✅ Can dispatch full ${requestedLiters}L requested`;
    } else if (maxDispatchable === entitlementAvailable) {
      limitingFactor = 'ENTITLEMENT';
      message = `⚠️ Limited by entitlement: ${entitlementAvailable}L available (requested ${requestedLiters}L)`;
    } else if (maxDispatchable === stockAvailable) {
      limitingFactor = 'STOCK';
      message = `⚠️ Limited by stock: ${stockAvailable}L available (requested ${requestedLiters}L)`;
    }

    return {
      canDispatch,
      maxDispatchable,
      limitingFactor,
      stockAvailable,
      entitlementAvailable,
      message
    };
  }

  /**
   * Execute fuel dispatch to beneficiary
   */
  async dispatchFuel(request: DispatchRequest): Promise<DispatchResult> {
    try {
      // Validate request
      const calculation = await this.calculateDispatch(
        request.beneficiaryId, 
        request.requestedLiters, 
        request.fuelType
      );

      if (!calculation.canDispatch) {
        return {
          success: false,
          actualLitersDispatched: 0,
          entitlementUsed: 0,
          stockRemaining: calculation.stockAvailable,
          entitlementRemaining: calculation.entitlementAvailable,
          message: calculation.message,
          error: 'Dispatch not possible'
        };
      }

      // Generate unique coupon number
      const couponNumber = `FD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      // Prepare dispatch data
      const dispatchData = {
        beneficiary: request.beneficiaryId,
        liters_dispensed: calculation.maxDispatchable,
        fuel_type: request.fuelType,
        entitlement_source: request.entitlementSource,
        coupon_number: couponNumber,
        dispatch_date: new Date().toISOString(),
        status: 'DISPATCHED',
        priority: request.priority,
        subcenter_id: this.subcenterId,
        notes: request.notes || '',
        price_per_liter: this.getAvailableStock(request.fuelType)?.pricePerLiter || 0
      };

      // Execute dispatch API call
      const response = await apiClient.post('/fuel-dispatches/', dispatchData);
      const dispatch = response.data;

      // Update local stock (optimistic update)
      const stock = this.getAvailableStock(request.fuelType);
      if (stock) {
        stock.availableLiters -= calculation.maxDispatchable;
      }

      // Get updated entitlement info
      const entitlement = await this.getBeneficiaryEntitlement(request.beneficiaryId);

      message.success(`Successfully dispatched ${calculation.maxDispatchable}L to beneficiary`);

      return {
        success: true,
        dispatchId: dispatch.id,
        couponNumber,
        actualLitersDispatched: calculation.maxDispatchable,
        entitlementUsed: entitlement.usedEntitlement + calculation.maxDispatchable,
        stockRemaining: calculation.stockAvailable - calculation.maxDispatchable,
        entitlementRemaining: calculation.entitlementAvailable - calculation.maxDispatchable,
        message: `✅ Successfully dispatched ${calculation.maxDispatchable}L fuel coupon`
      };

    } catch (error) {
      console.error('Dispatch failed:', error);
      message.error('Failed to dispatch fuel coupon');
      
      return {
        success: false,
        actualLitersDispatched: 0,
        entitlementUsed: 0,
        stockRemaining: 0,
        entitlementRemaining: 0,
        message: 'Dispatch failed due to system error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get recent dispatch history
   */
  async getDispatchHistory(limit: number = 50): Promise<any[]> {
    try {
      const response = await apiClient.get(`/fuel-dispatches/?subcenter=${this.subcenterId}&limit=${limit}&ordering=-dispatch_date`);
      return response.data.results || response.data || [];
    } catch (error) {
      console.error('Failed to fetch dispatch history:', error);
      return [];
    }
  }

  /**
   * Get current stock levels
   */
  getCurrentStock(): FuelStock[] {
    return this.currentStock;
  }

  /**
   * Refresh stock data
   */
  async refreshStock(): Promise<void> {
    await this.fetchCurrentStock();
  }

  /**
   * Get dispatch statistics
   */
  async getDispatchStats(): Promise<{
    todayDispatches: number;
    todayLiters: number;
    weeklyDispatches: number;
    weeklyLiters: number;
    pendingDispatches: number;
  }> {
    try {
      const response = await apiClient.get(`/fuel-dispatches/stats/?subcenter=${this.subcenterId}`);
      return response.data || {
        todayDispatches: 0,
        todayLiters: 0,
        weeklyDispatches: 0,
        weeklyLiters: 0,
        pendingDispatches: 0
      };
    } catch (error) {
      console.error('Failed to fetch dispatch stats:', error);
      return {
        todayDispatches: 0,
        todayLiters: 0,
        weeklyDispatches: 0,
        weeklyLiters: 0,
        pendingDispatches: 0
      };
    }
  }

  /**
   * Batch dispatch to multiple beneficiaries
   */
  async batchDispatch(requests: DispatchRequest[]): Promise<DispatchResult[]> {
    const results: DispatchResult[] = [];
    
    for (const request of requests) {
      const result = await this.dispatchFuel(request);
      results.push(result);
      
      // Add small delay between dispatches to prevent system overload
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }

  /**
   * Emergency dispatch with priority handling
   */
  async emergencyDispatch(request: Omit<DispatchRequest, 'priority'>): Promise<DispatchResult> {
    return this.dispatchFuel({
      ...request,
      priority: 'URGENT'
    });
  }
}

// Export singleton instance
let dispatchHandlerInstance: FuelDispatchHandler | null = null;

export const getFuelDispatchHandler = (subcenterId?: string): FuelDispatchHandler => {
  if (!dispatchHandlerInstance || (subcenterId && dispatchHandlerInstance.currentSubcenterId !== subcenterId)) {
    dispatchHandlerInstance = new FuelDispatchHandler(subcenterId);
  }
  return dispatchHandlerInstance;
};

export default FuelDispatchHandler;