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
  
  // Development: Use Vite proxy with API path
  if (import.meta.env.DEV) {
    console.log('🔧 Development mode: Using proxy /api');
    return '/api';
  }
  
  // Fallback for production: Use correct Render backend URL
  const fallbackUrl = 'https://parliament-zimbabwe.onrender.com/api/v1';
  console.log('⚠️ Using Render backend URL:', fallbackUrl);
  return fallbackUrl;
})();

// Export API base for use in other modules (AuthContext refresh must call backend directly)
export const API_BASE = API_BASE_URL;

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  timeout: 10000,
});

// Debug: show current default Authorization header (if any)
try { console.log('apiClient default Authorization:', apiClient.defaults.headers.common['Authorization']); } catch(_) {}

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
    // Decide whether to send cookies/CSRF: only for same-origin requests
    try {
      const base = new URL(API_BASE_URL, window.location.href);
      const sameOrigin = base.origin === window.location.origin;
      if (sameOrigin) {
        // Send cookies for same-origin so Django can read csrftoken if needed
        config.withCredentials = true;
        // Attach CSRF token if present (Django's default cookie name)
        const match = document.cookie.match(/(?:^|; )csrftoken=([^;]+)/);
        if (match && config.headers) {
          config.headers['X-CSRFToken'] = decodeURIComponent(match[1]);
        }
      } else {
        // Cross-origin: rely on JWT, avoid cookies
        config.withCredentials = false;
      }
    } catch {
      // Fallback: don't send cookies
      config.withCredentials = false;
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
    console.log('✅ API Response Success:', {
      method: response.config.method?.toUpperCase(),
      url: response.config.url,
      status: response.status,
      timestamp: new Date().toISOString()
    });
    return response;
  },
  async (error) => {
    console.error('❌ API Response Error:', {
      method: error.config?.method?.toUpperCase(),
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.detail || error.message,
      timestamp: new Date().toISOString()
    });
    
    // Handle errors: log them but let AuthContext handle 401s to avoid conflicts
    if (error.response) {
      console.error('Error response details:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
      
      if (error.response.status === 401) {
        console.warn('🔐 Authentication failed - check token validity');
        
        // Log token information for debugging
        const token = localStorage.getItem('access_token');
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const isExpired = payload.exp < Math.floor(Date.now() / 1000);
            console.warn('Token info:', {
              exists: true,
              expired: isExpired,
              expiresAt: new Date(payload.exp * 1000).toISOString(),
              userId: payload.user_id,
              role: payload.role
            });
          } catch (tokenError) {
            console.error('❌ Invalid token format:', tokenError);
          }
        } else {
          console.warn('❌ No access token found in localStorage');
        }
      } else if (error.response.status === 403) {
        console.warn('🚫 Access forbidden - insufficient permissions');
      } else if (error.response.status === 404) {
        console.warn('🔍 Endpoint not found:', error.config?.url);
      } else if (error.response.status >= 500) {
        console.error('🔥 Server error:', error.response.status, error.response.data);
      }
    } else if (error.request) {
      console.error('🌐 Network error - no response received:', {
        message: error.message,
        code: error.code,
        config: {
          method: error.config?.method,
          url: error.config?.url,
          timeout: error.config?.timeout
        }
      });
    } else {
      console.error('⚠️ Request setup error:', error.message);
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

