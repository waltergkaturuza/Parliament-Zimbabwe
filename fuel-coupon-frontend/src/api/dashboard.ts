// src/api/dashboard.ts
import api from './index'; // Assuming your configured axios instance is exported from api/index.ts

// Define interfaces for the expected data structures
// CRITICAL: These interfaces MUST match the data returned by your backend endpoints
// Check the actual JSON response from your backend's endpoints
// and adjust these interfaces accordingly.
// You can use tools like Postman, curl, or visit the endpoint URL in your browser
// while logged in to see the exact structure.

interface CouponStats {
  total_coupons: number;
  total_fuel_volume_available: number;
  total_fuel_volume_consumed: number;
  total_coupons_available: number;
  total_coupons_allocated: number;
  total_coupons_used: number;
  total_coupons_expired: number;
  total_coupons_damaged: number;
  low_coupon_stock_alert: string | null;
}

interface ChartDataPoint {
    // Define a generic structure, or specific ones for each chart type
    [key: string]: any; // Replace 'any' with specific types once you know the data shape
}

// Adjust this DashboardData interface to match the overall structure
// returned by your /api/v1/statistics/ endpoint and any other endpoints you call.
interface DashboardData {
  // Assuming the /api/v1/statistics/ endpoint returns an object like this:
  coupon_stats: CouponStats;
  coupon_status_chart: ChartDataPoint[]; // Adjust ChartDataPoint based on actual data
  fuel_consumed_per_day_chart: ChartDataPoint[]; // Adjust ChartDataPoint based on actual data
  coupons_per_subcenter_chart: ChartDataPoint[]; // Adjust ChartDataPoint based on actual data

  // Add fields for your new charts based on what your backend returns
  attendance_per_program_chart?: ChartDataPoint[]; // Use optional if not always present or from separate endpoint
  coupons_per_book_chart?: ChartDataPoint[];
  handovers_per_recipient_chart?: ChartDataPoint[];
  handovers_per_initiator_chart?: ChartDataPoint[];
  handovers_by_status_chart?: ChartDataPoint[];
  coupons_per_program_chart?: ChartDataPoint[];
  coupons_created_per_day_chart?: ChartDataPoint[];
  coupons_distributed_per_day_chart?: ChartDataPoint[];
  coupons_per_allocated_user_chart?: ChartDataPoint[];

  // Add fields for total counts if they are part of the /api/v1/statistics/ response
  total_users: number;
  total_subcenters: number;
  total_programs: number;
  total_fuel_transactions: number;

  // Add any other top-level fields returned by /api/v1/statistics/
  // Example: program_summary?: any; // If program summary is part of the main stats endpoint
}

// Function to fetch all data needed for the main dashboard
export const getDashboardData = async (): Promise<DashboardData> => {
  try {
    // Make API call to backend statistics endpoint
    const response = await api.get('/statistics/');
    
    // Transform the backend response to match frontend expectations
    const backendData = response.data;
    
    // Create the expected structure with real data from backend
    const dashboardData: DashboardData = {
      coupon_stats: {
        total_coupons: backendData.total_coupons || 0,
        total_fuel_volume_available: backendData.available_fuel || 0,
        total_fuel_volume_consumed: backendData.total_fuel_used || 0,
        total_coupons_available: backendData.available_coupons || 0,
        total_coupons_allocated: backendData.allocated_coupons || 0,
        total_coupons_used: backendData.used_coupons || 0,
        total_coupons_expired: backendData.expired_coupons || 0,
        total_coupons_damaged: backendData.damaged_coupons || 0,
        low_coupon_stock_alert: null
      },
      // Transform status distribution for charts
      coupon_status_chart: backendData.status_distribution || [],
      // Transform monthly usage for fuel consumption chart
      fuel_consumed_per_day_chart: (backendData.monthly_coupon_usage || []).map((item: any) => ({
        date: item.month || item.date,
        total_litres: item.usage_count || 0
      })),
      // Transform status distribution for subcenter allocation chart
      coupons_per_subcenter_chart: backendData.subcenters_chart_data || [],
      // Include other data from backend
      total_users: backendData.total_users || 0,
      total_subcenters: backendData.sub_center_count || 0,
      total_programs: 0, // Will need to add this to backend
      total_fuel_transactions: 0, // Will need to add this to backend
      
      // Add chart data placeholders (to be enhanced)
      attendance_per_program_chart: [],
      coupons_per_book_chart: [],
      handovers_per_recipient_chart: [],
      handovers_per_initiator_chart: [],
      handovers_by_status_chart: [],
      coupons_per_program_chart: [],
      coupons_created_per_day_chart: [],
      coupons_distributed_per_day_chart: [],
      coupons_per_allocated_user_chart: []
    };

    return dashboardData;

  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    throw error;
  }
};

// Export other dashboard-related API functions if needed
// export const getSpecificReport = async (reportId: number) => { ... }