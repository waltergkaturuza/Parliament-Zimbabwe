// src/api/programStats.ts
import apiClient from './apiClient'; // Assuming you have a configured API client

interface ProgramStatsResponse {
  couponAllocations: { month: string; count: number }[];
  attendanceTrends: { month: string; total: number }[];
  handoverStatus: { status: string; count: number }[];
  // Add other properties based on your backend response
}

export const fetchProgramStats = async (): Promise<ProgramStatsResponse> => {
  try {
    const response = await apiClient.get<ProgramStatsResponse>('/api/programs/stats'); // Adjust the API endpoint as needed
    return response.data;
  } catch (error: any) {
    console.error('Error fetching program statistics:', error);
    throw error; // Re-throw the error for the component to handle
  }
};

export default { fetchProgramStats };