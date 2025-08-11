/**
 * Dynamic Fuel Allocation System - React Component Interfaces
 * 
 * TypeScript interfaces and types for React components in the Dynamic Fuel Allocation System.
 * Provides comprehensive prop types, state interfaces, and component contracts.
 * 
 * Designed for seamless integration with existing fuel coupon system UI components.
 */

// Note: Import React types properly in actual implementation
// import React from 'react';

// Temporary React type definitions for compilation
interface ReactNode {
  key?: string | number | null;
}

interface ComponentType<P = {}> {
  (props: P, context?: any): ReactNode | null;
}

import {
  FuelAllocationRule,
  FuelPrice,
  BeneficiaryProfile,
  ParliamentSession,
  AllocationCalculationResult,
  BulkAllocationPreviewResult
} from '../utils/dynamicAllocation';

// ======================= COMMON INTERFACES =======================

export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  error?: string | Error;
  details?: any;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface FilterState {
  category?: string;
  constituency?: string;
  fuel_type?: string;
  engine_band?: string;
  status?: string;
  rule_type?: string;
  period_start?: string;
  period_end?: string;
  search?: string;
}

export interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

// ======================= ALLOCATION RULE COMPONENTS =======================

export interface AllocationRuleListProps {
  rules?: FuelAllocationRule[];
  loading?: LoadingState;
  error?: ErrorState;
  pagination?: PaginationState;
  filters?: FilterState;
  sort?: SortState;
  onRuleSelect?: (rule: FuelAllocationRule) => void;
  onRuleEdit?: (rule: FuelAllocationRule) => void;
  onRuleDelete?: (ruleId: number) => void;
  onFilterChange?: (filters: FilterState) => void;
  onSortChange?: (sort: SortState) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  showActions?: boolean;
  selectable?: boolean;
  multiSelect?: boolean;
  selectedRules?: number[];
  onSelectionChange?: (selectedIds: number[]) => void;
}

export interface AllocationRuleFormProps {
  rule?: Partial<FuelAllocationRule>;
  mode: 'create' | 'edit' | 'view';
  loading?: LoadingState;
  error?: ErrorState;
  onSubmit?: (ruleData: Partial<FuelAllocationRule>) => void | Promise<void>;
  onCancel?: () => void;
  onTest?: (testData: any) => void;
  validationErrors?: Record<string, string[]>;
  showTestCalculator?: boolean;
  availableCategories?: Array<{ id: number; name: string }>;
  engineBands?: Array<{ band: string; displayName: string; constant: number }>;
}

export interface AllocationRuleCardProps {
  rule: FuelAllocationRule;
  onSelect?: (rule: FuelAllocationRule) => void;
  onEdit?: (rule: FuelAllocationRule) => void;
  onDelete?: (ruleId: number) => void;
  onTest?: (rule: FuelAllocationRule) => void;
  selected?: boolean;
  showActions?: boolean;
  compact?: boolean;
}

export interface AllocationRuleTestCalculatorProps {
  rule?: FuelAllocationRule;
  onCalculate?: (testData: any) => void;
  calculationResult?: AllocationCalculationResult;
  loading?: LoadingState;
  error?: ErrorState;
}

// ======================= FUEL PRICE COMPONENTS =======================

export interface FuelPriceListProps {
  prices?: FuelPrice[];
  loading?: LoadingState;
  error?: ErrorState;
  pagination?: PaginationState;
  filters?: FilterState;
  sort?: SortState;
  onPriceSelect?: (price: FuelPrice) => void;
  onPriceEdit?: (price: FuelPrice) => void;
  onPriceDelete?: (priceId: number) => void;
  onSetDefault?: (priceId: number) => void;
  onFilterChange?: (filters: FilterState) => void;
  onSortChange?: (sort: SortState) => void;
  onPageChange?: (page: number) => void;
  showActions?: boolean;
  showHistory?: boolean;
}

export interface FuelPriceFormProps {
  price?: Partial<FuelPrice>;
  mode: 'create' | 'edit' | 'view';
  loading?: LoadingState;
  error?: ErrorState;
  onSubmit?: (priceData: Partial<FuelPrice>) => void | Promise<void>;
  onCancel?: () => void;
  validationErrors?: Record<string, string[]>;
  availableFuelTypes?: string[];
  availablePriceSources?: string[];
  suggestedExchangeRate?: number;
}

export interface FuelPriceHistoryChartProps {
  priceHistory?: FuelPrice[];
  loading?: LoadingState;
  error?: ErrorState;
  dateRange?: { start: string; end: string };
  fuelType?: string;
  onDateRangeChange?: (range: { start: string; end: string }) => void;
  onFuelTypeChange?: (fuelType: string) => void;
  showTrendLine?: boolean;
  showComparison?: boolean;
}

// ======================= ALLOCATION CALCULATION COMPONENTS =======================

export interface AllocationCalculatorProps {
  beneficiary?: BeneficiaryProfile;
  rule?: FuelAllocationRule;
  parliamentSession?: ParliamentSession;
  fuelPrice?: FuelPrice;
  loading?: LoadingState;
  error?: ErrorState;
  onCalculate?: (input: any) => void;
  onPreview?: (input: any) => void;
  onCommit?: (allocationId: string) => void;
  calculationResult?: AllocationCalculationResult;
  showAdvancedOptions?: boolean;
  customParameters?: any;
  onParameterChange?: (parameters: any) => void;
}

export interface AllocationPreviewProps {
  preview?: AllocationCalculationResult;
  loading?: LoadingState;
  error?: ErrorState;
  onCommit?: (allocationId: string) => void;
  onCancel?: (allocationId: string) => void;
  onEdit?: () => void;
  showBreakdown?: boolean;
  showComparison?: boolean;
  comparisonData?: any;
  editable?: boolean;
}

export interface BulkAllocationCalculatorProps {
  beneficiaries?: BeneficiaryProfile[];
  availableRules?: FuelAllocationRule[];
  availableParliamentSessions?: ParliamentSession[];
  availableFuelPrices?: FuelPrice[];
  loading?: LoadingState;
  error?: ErrorState;
  onCalculate?: (input: any) => void;
  onPreview?: (input: any) => void;
  onCommitAll?: (allocationIds: string[]) => void;
  previewResult?: BulkAllocationPreviewResult;
  filters?: FilterState;
  onFilterChange?: (filters: FilterState) => void;
  selectedBeneficiaries?: number[];
  onBeneficiarySelectionChange?: (selectedIds: number[]) => void;
}

export interface BulkAllocationPreviewProps {
  preview?: BulkAllocationPreviewResult;
  loading?: LoadingState;
  error?: ErrorState;
  onCommitAll?: (allocationIds: string[]) => void;
  onCommitSelected?: (allocationIds: string[]) => void;
  onCancel?: () => void;
  onEdit?: () => void;
  selectedAllocations?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  showSummary?: boolean;
  showDetails?: boolean;
  showErrors?: boolean;
}

// ======================= BENEFICIARY COMPONENTS =======================

export interface BeneficiaryAllocationListProps {
  beneficiaries?: BeneficiaryProfile[];
  loading?: LoadingState;
  error?: ErrorState;
  pagination?: PaginationState;
  filters?: FilterState;
  sort?: SortState;
  onBeneficiarySelect?: (beneficiary: BeneficiaryProfile) => void;
  onAllocationPreview?: (beneficiaryId: number) => void;
  onAllocationHistory?: (beneficiaryId: number) => void;
  onUpdateAllocationData?: (beneficiaryId: number, data: any) => void;
  onFilterChange?: (filters: FilterState) => void;
  onSortChange?: (sort: SortState) => void;
  onPageChange?: (page: number) => void;
  showAllocationData?: boolean;
  showActions?: boolean;
  selectable?: boolean;
  multiSelect?: boolean;
  selectedBeneficiaries?: number[];
  onSelectionChange?: (selectedIds: number[]) => void;
}

export interface BeneficiaryAllocationCardProps {
  beneficiary: BeneficiaryProfile;
  onSelect?: (beneficiary: BeneficiaryProfile) => void;
  onPreview?: (beneficiaryId: number) => void;
  onHistory?: (beneficiaryId: number) => void;
  onUpdate?: (beneficiaryId: number) => void;
  selected?: boolean;
  showAllocationData?: boolean;
  showActions?: boolean;
  compact?: boolean;
  allocationSummary?: {
    current_allocation?: number;
    pending_allocations?: number;
    total_allocated?: number;
    last_allocation_date?: string;
  };
}

export interface BeneficiaryAllocationFormProps {
  beneficiary?: BeneficiaryProfile;
  mode: 'edit' | 'view';
  loading?: LoadingState;
  error?: ErrorState;
  onSubmit?: (data: any) => void | Promise<void>;
  onCancel?: () => void;
  validationErrors?: Record<string, string[]>;
  availableEngineCapacities?: number[];
  constituencyData?: Array<{ id: number; name: string; distance_km: number }>;
  vehicleData?: {
    makes: string[];
    models: Record<string, string[]>;
    fuelTypes: string[];
  };
}

// ======================= ALLOCATION HISTORY COMPONENTS =======================

export interface AllocationHistoryListProps {
  allocations?: any[];
  loading?: LoadingState;
  error?: ErrorState;
  pagination?: PaginationState;
  filters?: FilterState;
  sort?: SortState;
  onAllocationSelect?: (allocation: any) => void;
  onAllocationCancel?: (allocationId: string) => void;
  onAllocationFulfill?: (allocationId: string) => void;
  onFilterChange?: (filters: FilterState) => void;
  onSortChange?: (sort: SortState) => void;
  onPageChange?: (page: number) => void;
  showActions?: boolean;
  beneficiaryId?: number;
  ruleId?: number;
}

export interface AllocationHistoryTimelineProps {
  allocations?: any[];
  loading?: LoadingState;
  error?: ErrorState;
  dateRange?: { start: string; end: string };
  onDateRangeChange?: (range: { start: string; end: string }) => void;
  onAllocationSelect?: (allocation: any) => void;
  groupBy?: 'day' | 'week' | 'month';
  onGroupByChange?: (groupBy: 'day' | 'week' | 'month') => void;
  showSummary?: boolean;
}

export interface AllocationDetailsModalProps {
  allocation?: any;
  isOpen: boolean;
  onClose: () => void;
  onCancel?: (allocationId: string) => void;
  onFulfill?: (allocationId: string) => void;
  loading?: LoadingState;
  error?: ErrorState;
  showActions?: boolean;
}

// ======================= ANALYTICS COMPONENTS =======================

export interface AllocationAnalyticsProps {
  summaryData?: any;
  trendsData?: any;
  beneficiaryPatterns?: any;
  costAnalysis?: any;
  loading?: LoadingState;
  error?: ErrorState;
  dateRange?: { start: string; end: string };
  onDateRangeChange?: (range: { start: string; end: string }) => void;
  filters?: FilterState;
  onFilterChange?: (filters: FilterState) => void;
  onExport?: (format: 'csv' | 'excel' | 'pdf') => void;
}

export interface AllocationSummaryDashboardProps {
  summaryData?: any;
  loading?: LoadingState;
  error?: ErrorState;
  dateRange?: { start: string; end: string };
  onDateRangeChange?: (range: { start: string; end: string }) => void;
  onDrillDown?: (category: string, value: any) => void;
  showComparisons?: boolean;
  comparisonPeriod?: { start: string; end: string };
}

export interface AllocationTrendsChartProps {
  trendsData?: any;
  loading?: LoadingState;
  error?: ErrorState;
  chartType?: 'line' | 'bar' | 'area';
  onChartTypeChange?: (type: 'line' | 'bar' | 'area') => void;
  groupBy?: 'day' | 'week' | 'month';
  onGroupByChange?: (groupBy: 'day' | 'week' | 'month') => void;
  showTrendLine?: boolean;
  showComparison?: boolean;
  height?: number;
}

export interface AllocationCostAnalysisProps {
  costData?: any;
  loading?: LoadingState;
  error?: ErrorState;
  dateRange?: { start: string; end: string };
  onDateRangeChange?: (range: { start: string; end: string }) => void;
  showBreakdown?: boolean;
  showOptimization?: boolean;
  currency?: 'USD' | 'ZWG';
  onCurrencyChange?: (currency: 'USD' | 'ZWG') => void;
}

// ======================= PARLIAMENT SESSION COMPONENTS =======================

export interface ParliamentSessionListProps {
  sessions?: ParliamentSession[];
  loading?: LoadingState;
  error?: ErrorState;
  pagination?: PaginationState;
  filters?: FilterState;
  sort?: SortState;
  onSessionSelect?: (session: ParliamentSession) => void;
  onSessionImpactAnalysis?: (sessionId: number) => void;
  onFilterChange?: (filters: FilterState) => void;
  onSortChange?: (sort: SortState) => void;
  onPageChange?: (page: number) => void;
  showImpactAnalysis?: boolean;
  showActions?: boolean;
}

export interface ParliamentSessionImpactAnalysisProps {
  session?: ParliamentSession;
  impactData?: any;
  loading?: LoadingState;
  error?: ErrorState;
  onClose?: () => void;
  onApplyToAllocations?: (sessionId: number) => void;
  showDetailedBreakdown?: boolean;
  showCostProjection?: boolean;
}

export interface SessionTopUpCalculatorProps {
  session?: ParliamentSession;
  beneficiaries?: BeneficiaryProfile[];
  onCalculate?: (sessionId: number, beneficiaryIds: number[]) => void;
  calculationResult?: any;
  loading?: LoadingState;
  error?: ErrorState;
  selectedBeneficiaries?: number[];
  onBeneficiarySelectionChange?: (selectedIds: number[]) => void;
}

// ======================= LAYOUT COMPONENTS =======================

export interface AllocationSystemLayoutProps {
  children: ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  showNavigation?: boolean;
  showBreadcrumb?: boolean;
  breadcrumbItems?: Array<{ label: string; href?: string }>;
  sidebarContent?: ReactNode;
  headerActions?: ReactNode;
}

export interface AllocationWizardProps {
  steps: Array<{
    id: string;
    title: string;
    description?: string;
    component: ComponentType<any>;
    props?: any;
    validation?: (data: any) => boolean;
  }>;
  currentStep?: string;
  onStepChange?: (stepId: string) => void;
  onComplete?: (data: any) => void;
  onCancel?: () => void;
  wizardData?: any;
  onDataChange?: (data: any) => void;
  loading?: LoadingState;
  error?: ErrorState;
}

// ======================= COMMON COMPONENT PROPS =======================

export interface TableProps<T> {
  data: T[];
  columns: Array<{
    key: string;
    title: string;
    render?: (value: any, item: T) => ReactNode;
    sortable?: boolean;
    filterable?: boolean;
    width?: string;
  }>;
  loading?: LoadingState;
  error?: ErrorState;
  pagination?: PaginationState;
  sort?: SortState;
  filters?: FilterState;
  onSort?: (sort: SortState) => void;
  onFilter?: (filters: FilterState) => void;
  onPageChange?: (page: number) => void;
  onRowSelect?: (item: T) => void;
  selectedRows?: any[];
  onSelectionChange?: (selectedIds: any[]) => void;
  actions?: Array<{
    label: string;
    icon?: string;
    onClick: (item: T) => void;
    condition?: (item: T) => boolean;
  }>;
  bulkActions?: Array<{
    label: string;
    icon?: string;
    onClick: (selectedItems: T[]) => void;
  }>;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children: ReactNode;
  footer?: ReactNode;
  closable?: boolean;
  loading?: boolean;
}

export interface FormProps {
  onSubmit: (data: any) => void | Promise<void>;
  onCancel?: () => void;
  initialData?: any;
  validationErrors?: Record<string, string[]>;
  loading?: boolean;
  disabled?: boolean;
  children: ReactNode;
}

// ======================= HOOK INTERFACES =======================

export interface UseAllocationCalculatorHook {
  calculateAllocation: (input: any) => Promise<AllocationCalculationResult>;
  generatePreview: (input: any) => Promise<AllocationCalculationResult>;
  commitAllocation: (allocationId: string) => Promise<any>;
  cancelAllocation: (allocationId: string) => Promise<any>;
  loading: LoadingState;
  error: ErrorState;
  lastCalculation?: AllocationCalculationResult;
}

export interface UseAllocationRulesHook {
  rules: FuelAllocationRule[];
  loading: LoadingState;
  error: ErrorState;
  filters: FilterState;
  pagination: PaginationState;
  sort: SortState;
  fetchRules: (params?: any) => Promise<void>;
  createRule: (ruleData: Partial<FuelAllocationRule>) => Promise<FuelAllocationRule>;
  updateRule: (ruleId: number, ruleData: Partial<FuelAllocationRule>) => Promise<FuelAllocationRule>;
  deleteRule: (ruleId: number) => Promise<void>;
  setFilters: (filters: Partial<FilterState>) => void;
  setPagination: (pagination: Partial<PaginationState>) => void;
  setSort: (sort: SortState) => void;
}

export interface UseAllocationAnalyticsHook {
  summaryData?: any;
  trendsData?: any;
  beneficiaryPatterns?: any;
  costAnalysis?: any;
  loading: LoadingState;
  error: ErrorState;
  dateRange: { start: string; end: string };
  filters: FilterState;
  fetchSummary: (params?: any) => Promise<void>;
  fetchTrends: (params?: any) => Promise<void>;
  fetchBeneficiaryPatterns: (params?: any) => Promise<void>;
  fetchCostAnalysis: (params?: any) => Promise<void>;
  setDateRange: (range: { start: string; end: string }) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  exportData: (format: 'csv' | 'excel' | 'pdf') => Promise<Blob>;
}

// ======================= UTILITY INTERFACES =======================

export interface TableColumn<T> {
  key: keyof T | string;
  title: string;
  render?: (value: any, item: T, index: number) => ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  fixed?: 'left' | 'right';
}

export interface ActionButton {
  key: string;
  label: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  tooltip?: string;
}

export interface ValidationRule {
  field: string;
  rules: Array<{
    type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
    value?: any;
    message: string;
    validator?: (value: any) => boolean;
  }>;
}

// ======================= NAMED EXPORTS ONLY =======================
// All interfaces are exported individually above
// No default export to avoid TypeScript compilation issues
