// src/api/index.ts
import axios from 'axios';

// Load base URL from environment or fallback to localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:8000';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Attach Authorization header (JWT) if present in localStorage
apiClient.interceptors.request.use(
  (config) => {
    console.log('API Request interceptor:', config.method?.toUpperCase(), config.url);
    // IMPORTANT: Use 'access_token' for consistency with your AuthContext and login logic
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('Added Authorization header');
    }
    // Always allow credentials for CORS
    config.withCredentials = true;
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Global error handler for API responses
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response Success:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error);
    // Handle errors: log them but let AuthContext handle 401s
    if (error.response) {
      console.error('Error response:', error.response.status, error.response.data);
      
      // Let AuthContext handle 401s with token refresh logic
      // Only handle other status codes here
      if (error.response.status === 403) {
        console.warn('Access forbidden - insufficient permissions:', error.response.data);
        // Don't redirect to login for permission issues
      } else if (error.response.status >= 500) {
        console.error('Server error:', error.response.status, error.response.data);
      }
      // Note: 401s are handled by AuthContext interceptor for token refresh
      
      // Optionally show a toast or notification for specific errors
      // window.alert('API Error: ' + (error.response.data?.detail || error.response.statusText));
    } else if (error.request) {
      // Network or CORS error
      console.error('API Error (no response):', error);
      // Optionally show a toast or notification for network errors
      // window.alert('Network error: Could not reach backend API.');
    } else {
      // Other errors
      console.error('API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Health check utility for backend connectivity (can be used in all pages)
export async function checkBackendHealth() {
  try {
    const resp = await apiClient.get('/api/health/');
    return resp.data;
  } catch (err) {
    console.error('Backend health check failed:', err);
    return null;
  }
}

export default apiClient;

// 🔁 Export API services for clean imports elsewhere
export * from './dashboard';    // Dashboard API functions (getDashboardData, etc)
export * from './users';        // User management API
export * from './subcenters';   // Sub-center management API  
export * from './programs';     // Program management API
// Add more exports here as you create new API service files

