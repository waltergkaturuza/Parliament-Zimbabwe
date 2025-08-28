// src/api/index.ts
import axios from 'axios';

// API Base URL configuration for Render deployment
const API_BASE_URL = (() => {
  // Production: Use environment variable for backend URL
  const fromEnv = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '');
  if (fromEnv) {
    console.log('🔗 Using API URL from environment:', fromEnv);
    return fromEnv;
  }
  
  // Development: Use Vite proxy or fallback
  if (import.meta.env.DEV) {
    console.log('🔧 Development mode: Using proxy /api');
    return '/api';
  }
  
  // Fallback for production: Use Render backend
  const fallbackUrl = 'https://parliament-zimbabwe.onrender.com/api';
  console.log('⚠️ Using Render backend URL:', fallbackUrl);
  return fallbackUrl;
})();

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
    if (!token) {
      console.log('No access token found in localStorage - request will be unauthenticated');
    }
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('Added Authorization header with token length', token.length);
    }
  // Don't send cookies by default for API requests during token auth
  // (some proxies or dev servers may strip Authorization when withCredentials=true)
  config.withCredentials = false;
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
  async (error) => {
    console.error('API Response Error:', error);
    const originalRequest = error.config;
    
    // Handle 401 errors with token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      console.log('401 error detected, attempting token refresh...');
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          console.warn('No refresh token available, redirecting to login');
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // Try to refresh the token using the same apiClient and the /auth/refresh/ endpoint under /api/v1
        const refreshResponse = await apiClient.post('/auth/refresh/', {
          refresh: refreshToken,
        });
        
        const newAccessToken = refreshResponse.data.access;
        localStorage.setItem('access_token', newAccessToken);
        
        // Update authorization header for the failed request
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        
        console.log('Token refreshed successfully, retrying original request...');
        return apiClient(originalRequest);
        
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }
    
    // Handle errors: log them but let other error handling take place
    if (error.response) {
      console.error('Error response:', error.response.status, error.response.data);
      
      if (error.response.status === 403) {
        console.warn('Access forbidden - insufficient permissions:', error.response.data);
      } else if (error.response.status >= 500) {
        console.error('Server error:', error.response.status, error.response.data);
      }
    } else if (error.request) {
      // Network or CORS error
      console.error('API Error (no response):', error);
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
  // Backend exposes health under /home/health/
  const resp = await apiClient.get('/home/health/');
    return resp.data;
  } catch (err) {
    console.error('Backend health check failed:', err);
    return null;
  }
}

export default apiClient;

// 🔁 Export API services for clean imports elsewhere
export * from './dashboard';    // Dashboard API functions (getDashboardData, etc)
export * from './analytics';    // Analytics endpoints (received breakdown, available by center, dispatches timeline)
export * from './users';        // User management API
export * from './subcenters';   // Sub-center management API  
export * from './programs';     // Program management API
// Add more exports here as you create new API service files

