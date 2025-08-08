import apiClient from '.';

export const fetchRoles = async (): Promise<{ code: string; name: string }[]> => {
  try {
    const response = await apiClient.get('/api/v1/auth/roles/');
    return response.data.results || response.data;
  } catch (error: any) {
    console.error('Failed to fetch roles:', error);
    return [];
  }
};
