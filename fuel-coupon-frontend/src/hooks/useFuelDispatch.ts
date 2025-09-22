// src/hooks/useFuelDispatch.ts
import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getFuelDispatchHandler, 
  type FuelStock, 
  type DispatchRequest, 
  type DispatchResult, 
  type DispatchCalculation 
} from '@/services/fuelDispatchHandler';

interface UseFuelDispatchReturn {
  // State
  loading: boolean;
  currentStock: FuelStock[];
  dispatchHistory: any[];
  stats: {
    todayDispatches: number;
    todayLiters: number;
    weeklyDispatches: number;
    weeklyLiters: number;
    pendingDispatches: number;
  };
  
  // Actions
  calculateDispatch: (beneficiaryId: string, requestedLiters: number, fuelType?: 'PETROL' | 'DIESEL') => Promise<DispatchCalculation>;
  dispatchFuel: (request: DispatchRequest) => Promise<DispatchResult>;
  batchDispatch: (requests: DispatchRequest[]) => Promise<DispatchResult[]>;
  emergencyDispatch: (request: Omit<DispatchRequest, 'priority'>) => Promise<DispatchResult>;
  refreshData: () => Promise<void>;
  refreshStock: () => Promise<void>;
  
  // Utilities
  getAvailableStock: (fuelType: 'PETROL' | 'DIESEL') => FuelStock | null;
  getBeneficiaryEntitlement: (beneficiaryId: string) => Promise<{
    totalEntitlement: number;
    usedEntitlement: number;
    availableEntitlement: number;
    entitlementSources: any[];
  }>;
}

export const useFuelDispatch = (): UseFuelDispatchReturn => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentStock, setCurrentStock] = useState<FuelStock[]>([]);
  const [dispatchHistory, setDispatchHistory] = useState<any[]>([]);
  const [stats, setStats] = useState({
    todayDispatches: 0,
    todayLiters: 0,
    weeklyDispatches: 0,
    weeklyLiters: 0,
    pendingDispatches: 0
  });

  // Get subcenter ID from user data
  const subcenterId = user?.sub_center_id?.toString() || 'default';
  
  // Get dispatch handler instance
  const dispatchHandler = getFuelDispatchHandler(subcenterId);

  // Initialize dispatch handler and load data
  const initializeHandler = useCallback(async () => {
    try {
      setLoading(true);
      await dispatchHandler.initialize();
      await loadAllData();
    } catch (error) {
      console.error('Failed to initialize dispatch handler:', error);
      message.error('Failed to initialize fuel dispatch system');
    } finally {
      setLoading(false);
    }
  }, [dispatchHandler]);

  // Load all required data
  const loadAllData = useCallback(async () => {
    try {
      const [stock, history, statistics] = await Promise.all([
        dispatchHandler.getCurrentStock(),
        dispatchHandler.getDispatchHistory(100),
        dispatchHandler.getDispatchStats()
      ]);

      setCurrentStock(stock);
      setDispatchHistory(history);
      setStats(statistics);
    } catch (error) {
      console.error('Failed to load dispatch data:', error);
    }
  }, [dispatchHandler]);

  // Initialize on mount
  useEffect(() => {
    initializeHandler();
  }, [initializeHandler]);

  // Calculate dispatch feasibility
  const calculateDispatch = useCallback(async (
    beneficiaryId: string, 
    requestedLiters: number, 
    fuelType: 'PETROL' | 'DIESEL' = 'PETROL'
  ): Promise<DispatchCalculation> => {
    try {
      return await dispatchHandler.calculateDispatch(beneficiaryId, requestedLiters, fuelType);
    } catch (error) {
      console.error('Failed to calculate dispatch:', error);
      return {
        canDispatch: false,
        maxDispatchable: 0,
        limitingFactor: 'STOCK',
        stockAvailable: 0,
        entitlementAvailable: 0,
        message: 'Calculation failed'
      };
    }
  }, [dispatchHandler]);

  // Dispatch fuel to beneficiary
  const dispatchFuel = useCallback(async (request: DispatchRequest): Promise<DispatchResult> => {
    try {
      const result = await dispatchHandler.dispatchFuel(request);
      
      // Refresh data after successful dispatch
      if (result.success) {
        await loadAllData();
      }
      
      return result;
    } catch (error) {
      console.error('Failed to dispatch fuel:', error);
      return {
        success: false,
        actualLitersDispatched: 0,
        entitlementUsed: 0,
        stockRemaining: 0,
        entitlementRemaining: 0,
        message: 'Dispatch failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, [dispatchHandler, loadAllData]);

  // Batch dispatch
  const batchDispatch = useCallback(async (requests: DispatchRequest[]): Promise<DispatchResult[]> => {
    try {
      const results = await dispatchHandler.batchDispatch(requests);
      
      // Refresh data after batch dispatch
      await loadAllData();
      
      return results;
    } catch (error) {
      console.error('Failed to execute batch dispatch:', error);
      return requests.map(() => ({
        success: false,
        actualLitersDispatched: 0,
        entitlementUsed: 0,
        stockRemaining: 0,
        entitlementRemaining: 0,
        message: 'Batch dispatch failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, [dispatchHandler, loadAllData]);

  // Emergency dispatch
  const emergencyDispatch = useCallback(async (
    request: Omit<DispatchRequest, 'priority'>
  ): Promise<DispatchResult> => {
    try {
      const result = await dispatchHandler.emergencyDispatch(request);
      
      // Refresh data after emergency dispatch
      if (result.success) {
        await loadAllData();
      }
      
      return result;
    } catch (error) {
      console.error('Failed to execute emergency dispatch:', error);
      return {
        success: false,
        actualLitersDispatched: 0,
        entitlementUsed: 0,
        stockRemaining: 0,
        entitlementRemaining: 0,
        message: 'Emergency dispatch failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, [dispatchHandler, loadAllData]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      await dispatchHandler.refreshStock();
      await loadAllData();
    } catch (error) {
      console.error('Failed to refresh data:', error);
      message.error('Failed to refresh dispatch data');
    } finally {
      setLoading(false);
    }
  }, [dispatchHandler, loadAllData]);

  // Refresh stock only
  const refreshStock = useCallback(async () => {
    try {
      await dispatchHandler.refreshStock();
      setCurrentStock(dispatchHandler.getCurrentStock());
    } catch (error) {
      console.error('Failed to refresh stock:', error);
      message.error('Failed to refresh stock data');
    }
  }, [dispatchHandler]);

  // Get available stock by type
  const getAvailableStock = useCallback((fuelType: 'PETROL' | 'DIESEL'): FuelStock | null => {
    return dispatchHandler.getAvailableStock(fuelType);
  }, [dispatchHandler]);

  // Get beneficiary entitlement
  const getBeneficiaryEntitlement = useCallback(async (beneficiaryId: string) => {
    return await dispatchHandler.getBeneficiaryEntitlement(beneficiaryId);
  }, [dispatchHandler]);

  return {
    // State
    loading,
    currentStock,
    dispatchHistory,
    stats,
    
    // Actions
    calculateDispatch,
    dispatchFuel,
    batchDispatch,
    emergencyDispatch,
    refreshData,
    refreshStock,
    
    // Utilities
    getAvailableStock,
    getBeneficiaryEntitlement
  };
};