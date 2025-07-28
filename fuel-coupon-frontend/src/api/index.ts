// src/api/index.ts
import axios from 'axios';

// Load base URL from environment or fallback to localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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
    // Handle errors: redirect to login on 401, etc.
    if (error.response) {
      console.error('Error response:', error.response.status, error.response.data);
      // Optionally handle other status codes as needed
      if (error.response.status === 401) {
        // Remove the token and redirect to login
        localStorage.removeItem('access_token');
        window.location.href = '/login';
      }
      // You may also want to toast or log the error here
      console.error('API Response Error:', error.response);
    } else {
      // Network or server error
      console.error('API Error (no response):', error);
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// 🔁 Export API services for clean imports elsewhere
export * from './dashboard';    // Dashboard API functions (getDashboardData, etc)
export * from './users';        // User management API
export * from './subcenters';   // Sub-center management API  
export * from './programs';     // Program management API
// Add more exports here as you create new API service files

