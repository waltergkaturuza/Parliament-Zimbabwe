// src/api/subcenters/subcenters.ts
// Correct the import path to your apiClient instance
import apiClient from '../index'; // Using main API client
// OR if your configured instance is exported from api/index.ts:
// import apiClient from '../index';

export const getSubCenters = async () => {
  // Verify this path with your backend urls.py
  // If your apiClient base URL is http://localhost:8000/api/v1/
  return apiClient.get('/subcenters/');
  // If your apiClient base URL is http://localhost:8000/
  // return apiClient.get('/api/v1/subcenters/'); // Adjust path if needed
};

export const fetchSubCenters = async () => {
  return getSubCenters(); // Call the existing getSubCenters function
};

export const SubCenterService = {
  createSubCenter: async (data: any) => {
    return apiClient.post('/subcenters/', data); // Verify path
  },
  updateSubCenter: async (id: number, data: any) => {
    return apiClient.patch(`/subcenters/${id}/`, data); // Verify path
  },
};