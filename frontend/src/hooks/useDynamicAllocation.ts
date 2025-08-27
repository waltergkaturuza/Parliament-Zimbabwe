/**
 * Dynamic Fuel Allocation System - React Custom Hooks
 * 
 * Custom React hooks for managing state and API interactions in the Dynamic Fuel Allocation System.
 * Provides comprehensive state management for allocation calculations, rules, analytics, and more.
 * 
 * Integrates with TypeScript API services and provides reactive state management.
 */

// Note: In actual implementation, install required dependencies:
// npm install react @types/react

import { useState, useEffect, useCallback, useMemo } from 'react';
import DynamicAllocationServiceManager from '../services/dynamicAllocationApi';
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

import {
  LoadingState,
  ErrorState,
  PaginationState,
  FilterState,
  SortState,
  UseAllocationCalculatorHook,
  UseAllocationRulesHook,
  UseAllocationAnalyticsHook
} from '../types/dynamicAllocationComponents';

// ======================= SERVICE MANAGER SINGLETON =======================

const serviceManager = new DynamicAllocationServiceManager();

// ======================= COMMON STATE MANAGEMENT HOOKS =======================

export const useLoadingState = (initialLoading: boolean = false): [LoadingState, (loading: boolean, message?: string) => void] => {
  const [state, setState] = useState<LoadingState>({
    isLoading: initialLoading,
    message: undefined
  });

  const setLoading = useCallback((isLoading: boolean, message?: string) => {
    setState({ isLoading, message });
  }, []);

  return [state, setLoading];
};

export const useErrorState = (): [ErrorState, (error: string | Error | null) => void] => {
  const [state, setState] = useState<ErrorState>({
    hasError: false,
    error: undefined,
    details: undefined
  });

  const setError = useCallback((error: string | Error | null) => {
    if (error) {
      setState({
        hasError: true,
        error,
        details: error instanceof Error ? error.stack : undefined
      });
    } else {
      setState({
        hasError: false,
        error: undefined,
        details: undefined
      });
    }
  }, []);

  return [state, setError];
};

export const usePaginationState = (initialPageSize: number = 20): [PaginationState, (updates: Partial<PaginationState>) => void] => {
  const [state, setState] = useState<PaginationState>({
    page: 1,
    pageSize: initialPageSize,
    total: 0,
    hasNext: false,
    hasPrevious: false
  });

  const updatePagination = useCallback((updates: Partial<PaginationState>) => {
    setState(prev => ({
      ...prev,
      ...updates,
      hasNext: updates.page ? (updates.page * (updates.pageSize || prev.pageSize)) < (updates.total || prev.total) : prev.hasNext,
      hasPrevious: updates.page ? updates.page > 1 : prev.hasPrevious
    }));
  }, []);

  return [state, updatePagination];
};

export const useFilterState = <T extends Record<string, any>>(initialFilters: T = {} as T): [T, (updates: Partial<T>) => void, () => void] => {
  const [filters, setFilters] = useState<T>(initialFilters);

  const updateFilters = useCallback((updates: Partial<T>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  return [filters, updateFilters, clearFilters];
};

export const useSortState = (initialSort?: SortState): [SortState | undefined, (sort: SortState) => void] => {
  const [sort, setSort] = useState<SortState | undefined>(initialSort);

  return [sort, setSort];
};

// ======================= ALLOCATION CALCULATION HOOKS =======================

export const useAllocationCalculator = (): UseAllocationCalculatorHook => {
  const [loading, setLoading] = useLoadingState();
  const [error, setError] = useErrorState();
  const [lastCalculation, setLastCalculation] = useState<AllocationCalculationResult | undefined>();

  const calculateAllocation = useCallback(async (input: AllocationCalculationInput): Promise<AllocationCalculationResult> => {
    try {
      setLoading(true, 'Calculating allocation...');
      setError(null);
      
      const result = await serviceManager.calculations.calculateAllocation(input);
      setLastCalculation(result);
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate allocation';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const generatePreview = useCallback(async (input: AllocationCalculationInput): Promise<AllocationCalculationResult> => {
    try {
      setLoading(true, 'Generating preview...');
      setError(null);
      
      const result = await serviceManager.calculations.generatePreview(input);
      setLastCalculation(result);
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate preview';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const commitAllocation = useCallback(async (allocationId: string) => {
    try {
      setLoading(true, 'Committing allocation...');
      setError(null);
      
      const result = await serviceManager.calculations.commitAllocation(allocationId);
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to commit allocation';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const cancelAllocation = useCallback(async (allocationId: string) => {
    try {
      setLoading(true, 'Cancelling allocation...');
      setError(null);
      
      const result = await serviceManager.calculations.cancelAllocation(allocationId);
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel allocation';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  return {
    calculateAllocation,
    generatePreview,
    commitAllocation,
    cancelAllocation,
    loading,
    error,
    lastCalculation
  };
};

export const useBulkAllocationCalculator = () => {
  const [loading, setLoading] = useLoadingState();
  const [error, setError] = useErrorState();
  const [lastPreview, setLastPreview] = useState<BulkAllocationPreviewResult | undefined>();

  const generateBulkPreview = useCallback(async (input: BulkAllocationPreviewInput): Promise<BulkAllocationPreviewResult> => {
    try {
      setLoading(true, 'Generating bulk preview...');
      setError(null);
      
      const result = await serviceManager.calculations.generateBulkPreview(input);
      setLastPreview(result);
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate bulk preview';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const commitBulkAllocation = useCallback(async (allocationIds: string[]) => {
    try {
      setLoading(true, 'Committing bulk allocation...');
      setError(null);
      
      const result = await serviceManager.calculations.commitBulkAllocation(allocationIds);
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to commit bulk allocation';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  return {
    generateBulkPreview,
    commitBulkAllocation,
    loading,
    error,
    lastPreview
  };
};

// ======================= ALLOCATION RULES HOOKS =======================

export const useAllocationRules = (): UseAllocationRulesHook => {
  const [rules, setRules] = useState<FuelAllocationRule[]>([]);
  const [loading, setLoading] = useLoadingState();
  const [error, setError] = useErrorState();
  const [pagination, updatePagination] = usePaginationState();
  const [filters, updateFilters] = useFilterState<FilterState>();
  const [sort, setSort] = useSortState();

  const fetchRules = useCallback(async (params?: any) => {
    try {
      setLoading(true, 'Loading allocation rules...');
      setError(null);
      
      const result = await serviceManager.rules.getAllRules({
        ...filters,
        ...params,
        page: pagination.page,
        page_size: pagination.pageSize,
        ordering: sort ? `${sort.direction === 'desc' ? '-' : ''}${sort.field}` : undefined
      });
      
      if (Array.isArray(result)) {
        setRules(result);
        updatePagination({ total: result.length });
      } else {
        // Paginated response
        setRules(result.results || []);
        updatePagination({
          total: result.count || 0,
          hasNext: !!result.next,
          hasPrevious: !!result.previous
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch allocation rules';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.pageSize, sort, setLoading, setError, updatePagination]);

  const createRule = useCallback(async (ruleData: Partial<FuelAllocationRule>): Promise<FuelAllocationRule> => {
    try {
      setLoading(true, 'Creating allocation rule...');
      setError(null);
      
      const rule = await serviceManager.rules.createRule(ruleData);
      
      // Refresh the list
      await fetchRules();
      
      return rule;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create allocation rule';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchRules, setLoading, setError]);

  const updateRule = useCallback(async (ruleId: number, ruleData: Partial<FuelAllocationRule>): Promise<FuelAllocationRule> => {
    try {
      setLoading(true, 'Updating allocation rule...');
      setError(null);
      
      const rule = await serviceManager.rules.updateRule(ruleId, ruleData);
      
      // Update the rule in the list
      setRules(prev => prev.map(r => r.id === ruleId ? rule : r));
      
      return rule;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update allocation rule';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const deleteRule = useCallback(async (ruleId: number): Promise<void> => {
    try {
      setLoading(true, 'Deleting allocation rule...');
      setError(null);
      
      await serviceManager.rules.deleteRule(ruleId);
      
      // Remove the rule from the list
      setRules(prev => prev.filter(r => r.id !== ruleId));
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete allocation rule';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const setFilters = useCallback((newFilters: Partial<FilterState>) => {
    updateFilters(newFilters);
    updatePagination({ page: 1 }); // Reset to first page when filtering
  }, [updateFilters, updatePagination]);

  const setPagination = useCallback((newPagination: Partial<PaginationState>) => {
    updatePagination(newPagination);
  }, [updatePagination]);

  // Auto-fetch on dependency changes
  useEffect(() => {
    fetchRules();
  }, [pagination.page, pagination.pageSize, filters, sort]);

  return {
    rules,
    loading,
    error,
    filters,
    pagination,
    sort,
    fetchRules,
    createRule,
    updateRule,
    deleteRule,
    setFilters,
    setPagination,
    setSort
  };
};

export const useActiveAllocationRules = () => {
  const [activeRules, setActiveRules] = useState<FuelAllocationRule[]>([]);
  const [loading, setLoading] = useLoadingState();
  const [error, setError] = useErrorState();

  const fetchActiveRules = useCallback(async (params?: any) => {
    try {
      setLoading(true, 'Loading active rules...');
      setError(null);
      
      const rules = await serviceManager.rules.getActiveRules(params);
      setActiveRules(rules);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch active rules';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  useEffect(() => {
    fetchActiveRules();
  }, [fetchActiveRules]);

  return {
    activeRules,
    loading,
    error,
    fetchActiveRules
  };
};

// ======================= FUEL PRICE HOOKS =======================

export const useFuelPrices = () => {
  const [prices, setPrices] = useState<FuelPrice[]>([]);
  const [loading, setLoading] = useLoadingState();
  const [error, setError] = useErrorState();
  const [pagination, updatePagination] = usePaginationState();
  const [filters, updateFilters] = useFilterState<FilterState>();

  const fetchPrices = useCallback(async (params?: any) => {
    try {
      setLoading(true, 'Loading fuel prices...');
      setError(null);
      
      const result = await serviceManager.prices.getAllPrices({
        ...filters,
        ...params,
        page: pagination.page,
        page_size: pagination.pageSize
      });
      
      setPrices(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch fuel prices';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.pageSize, setLoading, setError]);

  const getCurrentDefaultPrice = useCallback(async (fuelType?: string) => {
    try {
      setLoading(true, 'Loading current price...');
      setError(null);
      
      const price = await serviceManager.prices.getCurrentDefaultPrice(fuelType);
      return price;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch current price';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  useEffect(() => {
    fetchPrices();
  }, [pagination.page, pagination.pageSize, filters]);

  return {
    prices,
    loading,
    error,
    pagination,
    filters,
    fetchPrices,
    getCurrentDefaultPrice,
    updatePagination,
    updateFilters
  };
};

// ======================= BENEFICIARY HOOKS =======================

export const useBeneficiaries = () => {
  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryProfile[]>([]);
  const [loading, setLoading] = useLoadingState();
  const [error, setError] = useErrorState();
  const [pagination, updatePagination] = usePaginationState();
  const [filters, updateFilters] = useFilterState<FilterState>();

  const fetchBeneficiaries = useCallback(async (params?: any) => {
    try {
      setLoading(true, 'Loading beneficiaries...');
      setError(null);
      
      const result = await serviceManager.beneficiaries.getAllBeneficiaries({
        ...filters,
        ...params,
        page: pagination.page,
        page_size: pagination.pageSize
      });
      
      setBeneficiaries(result.results || []);
      updatePagination({
        total: result.count || 0,
        hasNext: !!result.next,
        hasPrevious: !!result.previous
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch beneficiaries';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.pageSize, setLoading, setError, updatePagination]);

  const getBeneficiaryEligibility = useCallback(async (beneficiaryId: number, ruleId?: number) => {
    try {
      setLoading(true, 'Checking eligibility...');
      setError(null);
      
      const eligibility = await serviceManager.beneficiaries.getBeneficiaryEligibility(beneficiaryId, ruleId);
      return eligibility;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check eligibility';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  useEffect(() => {
    fetchBeneficiaries();
  }, [pagination.page, pagination.pageSize, filters]);

  return {
    beneficiaries,
    loading,
    error,
    pagination,
    filters,
    fetchBeneficiaries,
    getBeneficiaryEligibility,
    updatePagination,
    updateFilters
  };
};

// ======================= ALLOCATION ANALYTICS HOOKS =======================

export const useAllocationAnalytics = (): UseAllocationAnalyticsHook => {
  const [summaryData, setSummaryData] = useState<any>(undefined);
  const [trendsData, setTrendsData] = useState<any>(undefined);
  const [beneficiaryPatterns, setBeneficiaryPatterns] = useState<any>(undefined);
  const [costAnalysis, setCostAnalysis] = useState<any>(undefined);
  const [loading, setLoading] = useLoadingState();
  const [error, setError] = useErrorState();
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end: new Date().toISOString().split('T')[0] // today
  });
  const [filters, updateFilters] = useFilterState<FilterState>();

  const fetchSummary = useCallback(async (params?: any) => {
    try {
      setLoading(true, 'Loading allocation summary...');
      setError(null);
      
      const summary = await serviceManager.analytics.getAllocationSummary({
        period_start: dateRange.start,
        period_end: dateRange.end,
        ...filters,
        ...params
      });
      
      setSummaryData(summary);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch allocation summary';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [dateRange, filters, setLoading, setError]);

  const fetchTrends = useCallback(async (params?: any) => {
    try {
      setLoading(true, 'Loading allocation trends...');
      setError(null);
      
      const trends = await serviceManager.analytics.getAllocationTrends({
        period_start: dateRange.start,
        period_end: dateRange.end,
        ...params
      });
      
      setTrendsData(trends);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch allocation trends';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [dateRange, setLoading, setError]);

  const fetchBeneficiaryPatterns = useCallback(async (params?: any) => {
    try {
      setLoading(true, 'Loading beneficiary patterns...');
      setError(null);
      
      const patterns = await serviceManager.analytics.getBeneficiaryPatterns({
        period_start: dateRange.start,
        period_end: dateRange.end,
        ...filters,
        ...params
      });
      
      setBeneficiaryPatterns(patterns);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch beneficiary patterns';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [dateRange, filters, setLoading, setError]);

  const fetchCostAnalysis = useCallback(async (params?: any) => {
    try {
      setLoading(true, 'Loading cost analysis...');
      setError(null);
      
      const cost = await serviceManager.analytics.getFuelCostAnalysis({
        period_start: dateRange.start,
        period_end: dateRange.end,
        ...params
      });
      
      setCostAnalysis(cost);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch cost analysis';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [dateRange, setLoading, setError]);

  const exportData = useCallback(async (format: 'csv' | 'excel' | 'pdf'): Promise<Blob> => {
    try {
      setLoading(true, `Exporting data as ${format.toUpperCase()}...`);
      setError(null);
      
      const blob = await serviceManager.analytics.exportAllocationData({
        format,
        period_start: dateRange.start,
        period_end: dateRange.end,
        ...filters,
        include_analytics: true
      });
      
      return blob;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export data';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dateRange, filters, setLoading, setError]);

  const setFilters = useCallback((newFilters: Partial<FilterState>) => {
    updateFilters(newFilters);
  }, [updateFilters]);

  return {
    summaryData,
    trendsData,
    beneficiaryPatterns,
    costAnalysis,
    loading,
    error,
    dateRange,
    filters,
    fetchSummary,
    fetchTrends,
    fetchBeneficiaryPatterns,
    fetchCostAnalysis,
    setDateRange,
    setFilters,
    exportData
  };
};

// ======================= PARLIAMENT SESSION HOOKS =======================

export const useParliamentSessions = () => {
  const [sessions, setSessions] = useState<ParliamentSession[]>([]);
  const [activeSessions, setActiveSessions] = useState<ParliamentSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ParliamentSession | null>(null);
  const [loading, setLoading] = useLoadingState();
  const [error, setError] = useErrorState();

  const fetchSessions = useCallback(async (params?: any) => {
    try {
      setLoading(true, 'Loading parliament sessions...');
      setError(null);
      
      const allSessions = await serviceManager.sessions.getAllSessions(params);
      setSessions(allSessions);
      
      const active = await serviceManager.sessions.getActiveSessions();
      setActiveSessions(active);
      
      const current = await serviceManager.sessions.getCurrentSession();
      setCurrentSession(current);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch parliament sessions';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const getSessionAllocationImpact = useCallback(async (sessionId: number) => {
    try {
      setLoading(true, 'Analyzing session impact...');
      setError(null);
      
      const impact = await serviceManager.sessions.getSessionAllocationImpact(sessionId);
      return impact;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze session impact';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    activeSessions,
    currentSession,
    loading,
    error,
    fetchSessions,
    getSessionAllocationImpact
  };
};

// ======================= SYSTEM HEALTH HOOK =======================

export const useSystemHealth = () => {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [loading, setLoading] = useLoadingState();
  const [error, setError] = useErrorState();

  const checkHealth = useCallback(async () => {
    try {
      setLoading(true, 'Checking system health...');
      setError(null);
      
      const health = await serviceManager.healthCheck();
      setHealthStatus(health);
      
      return health;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'System health check failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const isHealthy = useMemo(() => {
    return healthStatus?.status === 'healthy';
  }, [healthStatus]);

  return {
    healthStatus,
    isHealthy,
    loading,
    error,
    checkHealth
  };
};

// ======================= COMPOUND HOOKS =======================

export const useAllocationWorkflow = () => {
  const calculator = useAllocationCalculator();
  const rules = useAllocationRules();
  const prices = useFuelPrices();
  const beneficiaries = useBeneficiaries();
  const sessions = useParliamentSessions();

  return {
    calculator,
    rules,
    prices,
    beneficiaries,
    sessions
  };
};

export const useAllocationDashboard = () => {
  const analytics = useAllocationAnalytics();
  const systemHealth = useSystemHealth();
  const activeSessions = useParliamentSessions();

  return {
    analytics,
    systemHealth,
    activeSessions
  };
};

// ======================= EXPORT ALL HOOKS =======================

export default {
  // State Management
  useLoadingState,
  useErrorState,
  usePaginationState,
  useFilterState,
  useSortState,
  
  // Core Functionality
  useAllocationCalculator,
  useBulkAllocationCalculator,
  useAllocationRules,
  useActiveAllocationRules,
  useFuelPrices,
  useBeneficiaries,
  useAllocationAnalytics,
  useParliamentSessions,
  useSystemHealth,
  
  // Compound Hooks
  useAllocationWorkflow,
  useAllocationDashboard,
};
