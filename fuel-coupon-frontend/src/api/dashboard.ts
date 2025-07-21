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
    // --- Make API Call(s) to your backend endpoints ---
    // Based on your urls.py, the main dashboard stats are available at /api/v1/statistics/

    // If ALL dashboard data is returned by /api/v1/statistics/:
    const response = await api.get('/api/v1/statistics/'); // ✅ Use the correct backend path

    // If fuel stats are separate at /api/v1/fuel-stats/ and needed:
    // If program summary is separate at /admin/statistics/program-summary/ and needed:
    // const [mainStatsResponse, fuelStatsResponse, programSummaryResponse] = await Promise.all([
    //    api.get('/api/v1/statistics/'),
    //    api.get('/api/v1/fuel-stats/'), // ✅ Use the correct path
    //    api.get('/admin/statistics/program-summary/'), // ✅ Use the correct path (NO /api/v1/ prefix here)
    // ]);


    // --- Process and Structure the Data ---
    // This mapping depends entirely on the actual structure of the JSON
    // returned by your backend's endpoints.

    // Assuming /api/v1/statistics/ returns a single object with all the data keys:
    const dashboardData: DashboardData = response.data; // ✅ Assuming backend returns data directly

    // If data is spread across responses (e.g., mainStatsResponse, fuelStatsResponse, programSummaryResponse):
    // const dashboardData: DashboardData = {
    //    ...mainStatsResponse.data, // Combine data from main stats endpoint
    //    ...fuelStatsResponse.data, // Combine data from fuel stats endpoint (if separate)
    //    // Add data from other endpoints, potentially mapping keys
    //    program_summary: programSummaryResponse.data, // Example: including program summary data
    //    // Manually map specific fields if backend structure is different
    //    coupon_stats: mainStatsResponse.data.coupon_summary_data, // Example: if backend uses different key
    //    fuel_consumed_per_day_chart: fuelStatsResponse.data.trend_data, // Example: if fuel data is separate
    // };


    return dashboardData;

  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    // Depending on how you want to handle errors
    throw error;
  }
};

// Export other dashboard-related API functions if needed
// export const getSpecificReport = async (reportId: number) => { ... }