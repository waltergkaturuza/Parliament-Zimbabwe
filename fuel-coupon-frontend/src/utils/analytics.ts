// src/utils/analytics.ts - API service for analytics data
import fetchWithAuth from './fetchWithAuth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export interface AnalyticsData {
  date_range: {
    start_date: string;
    end_date: string;
  };
  financial_summary: {
    total_revenue_usd: number;
    total_costs_usd: number;
    total_profit_usd: number;
    profit_margin: number;
    revenue_growth_rate: number;
    average_daily_revenue: number;
  };
  operational_summary: {
    total_boxes_processed: number;
    total_coupons_issued: number;
    total_litres_allocated: number;
    average_value_per_box: number;
  };
  daily_data: Array<{
    date: string;
    revenue_usd: number;
    revenue_zwg: number;
    costs_usd: number;
    profit_usd: number;
    coupons_issued: number;
    books_issued: number;
    litres_allocated: number;
    boxes_processed: number;
  }>;
  fuel_summary: {
    total_fuel_dispensed: number;
    total_coupons_used: number;
    average_transaction_litres: number;
  };
  attendance_summary: {
    total_sessions_tracked: number;
    present_beneficiaries: number;
    attendance_rate: number;
  };
  entitlement_summary: {
    total_entitlements_created: number;
    total_litres_allocated: number;
  };
}

export interface ComplianceData {
  compliance_stats: {
    total_transactions: number;
    compliant_transactions: number;
    compliance_rate: number;
    violation_count: number;
    avg_transaction_value: number;
  };
  compliance_reports: Array<{
    period: string;
    transactions: number;
    violations: number;
    compliance_rate: number;
    total_value: number;
  }>;
}

export const fetchAnalyticsData = async (
  startDate?: string, 
  endDate?: string
): Promise<AnalyticsData> => {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  
  const url = `${API_BASE_URL}/api/v1/analytics/${params.toString() ? '?' + params.toString() : ''}`;
  return await fetchWithAuth(url, 'GET');
};

export const fetchComplianceData = async (): Promise<ComplianceData> => {
  const url = `${API_BASE_URL}/api/v1/audit/compliance-reports/`;
  return await fetchWithAuth(url, 'GET');
};

export const fetchConsumptionTrend = async (
  startDate?: string, 
  endDate?: string
): Promise<any> => {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  
  const url = `${API_BASE_URL}/api/v1/analytics/consumption-trend/${params.toString() ? '?' + params.toString() : ''}`;
  return await fetchWithAuth(url, 'GET');
};

export const fetchTopBeneficiaries = async (): Promise<any> => {
  const url = `${API_BASE_URL}/api/v1/audit/transactions/`;
  const data = await fetchWithAuth(url, 'GET');
  
  // Process transaction data to get top beneficiaries
  const beneficiaryMap = new Map();
  
  if (data.results) {
    data.results.forEach((transaction: any) => {
      const beneficiaryId = transaction.beneficiary?.id || transaction.beneficiary;
      const beneficiaryName = transaction.beneficiary?.name || 
                              transaction.beneficiary?.user?.first_name + ' ' + transaction.beneficiary?.user?.last_name ||
                              `Beneficiary ${beneficiaryId}`;
      
      if (beneficiaryMap.has(beneficiaryId)) {
        const existing = beneficiaryMap.get(beneficiaryId);
        existing.usage += transaction.litres_consumed || 0;
        existing.transactions += 1;
        existing.cost += parseFloat(transaction.total_cost || 0);
      } else {
        beneficiaryMap.set(beneficiaryId, {
          id: beneficiaryId,
          name: beneficiaryName,
          usage: transaction.litres_consumed || 0,
          transactions: 1,
          cost: parseFloat(transaction.total_cost || 0),
          efficiency: Math.round(Math.random() * 20) + 80 // Placeholder calculation
        });
      }
    });
  }
  
  return Array.from(beneficiaryMap.values())
    .sort((a, b) => b.usage - a.usage)
    .slice(0, 10);
};