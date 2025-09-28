// Production Authentication Debug and Fix for Fuel Entitlements

/**
 * This script helps debug and fix authentication issues in production
 * for the fuel entitlements creation feature
 */

// 1. Enhanced error handling for fuel entitlements API calls
export const debugFuelEntitlementsAuth = () => {
  console.log('🔍 Debugging Fuel Entitlements Authentication...');
  
  // Check if tokens exist
  const accessToken = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');
  
  console.log('Access token exists:', !!accessToken);
  console.log('Access token length:', accessToken?.length || 0);
  console.log('Refresh token exists:', !!refreshToken);
  
  if (accessToken) {
    try {
      // Decode JWT to check expiration
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      const isExpired = payload.exp < now;
      
      console.log('Token expiry:', new Date(payload.exp * 1000));
      console.log('Token is expired:', isExpired);
      console.log('Token payload:', payload);
      
      if (isExpired) {
        console.warn('⚠️ Access token is expired - this will cause 401 errors');
        return { status: 'expired', needsRefresh: true };
      }
      
      return { status: 'valid', needsRefresh: false };
    } catch (e) {
      console.error('❌ Invalid token format:', e);
      return { status: 'invalid', needsRefresh: true };
    }
  }
  
  return { status: 'missing', needsRefresh: true };
};

// 2. Enhanced API client with better error handling
import axios from 'axios';

const createAuthenticatedApiClient = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 
                       'https://parliament-zimbabwe.onrender.com/api/v1';
  
  const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    timeout: 15000, // Increased timeout for production
  });
  
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('access_token');
      
      if (token && config.headers) {
        config.headers['Authorization'] = `Bearer ${token}`;
        console.log('✅ Authorization header added to request');
      } else {
        console.warn('⚠️ No authentication token available');
      }
      
      // Add debug info for production troubleshooting
      console.log('API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        hasAuth: !!token,
        timestamp: new Date().toISOString()
      });
      
      return config;
    },
    (error) => {
      console.error('❌ Request interceptor error:', error);
      return Promise.reject(error);
    }
  );
  
  client.interceptors.response.use(
    (response) => {
      console.log('✅ API Response Success:', {
        status: response.status,
        url: response.config.url,
        timestamp: new Date().toISOString()
      });
      return response;
    },
    async (error) => {
      console.error('❌ API Response Error:', {
        status: error.response?.status,
        url: error.config?.url,
        message: error.response?.data?.detail || error.message,
        timestamp: new Date().toISOString()
      });
      
      // Enhanced 401 handling
      if (error.response?.status === 401) {
        console.warn('🔐 Authentication failed - token may be invalid or expired');
        
        // Check if we have a refresh token
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          console.log('🔄 Attempting token refresh...');
          try {
            const refreshResponse = await axios.post(`${API_BASE_URL.replace('/api/v1', '')}/auth/token/refresh/`, {
              refresh: refreshToken
            });
            
            if (refreshResponse.data.access) {
              localStorage.setItem('access_token', refreshResponse.data.access);
              console.log('✅ Token refreshed successfully');
              
              // Retry the original request
              const originalRequest = error.config;
              originalRequest.headers['Authorization'] = `Bearer ${refreshResponse.data.access}`;
              return client.request(originalRequest);
            }
          } catch (refreshError) {
            console.error('❌ Token refresh failed:', refreshError);
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
          }
        } else {
          console.warn('⚠️ No refresh token available - redirecting to login');
          localStorage.clear();
          window.location.href = '/login';
        }
      }
      
      return Promise.reject(error);
    }
  );
  
  return client;
};

// 3. Enhanced fuel entitlements service with better error handling
export const enhancedFuelEntitlementsService = {
  async createEntitlement(data: any) {
    console.log('🚀 Creating fuel entitlement with enhanced service...', data);
    
    // Pre-flight authentication check
    const authStatus = debugFuelEntitlementsAuth();
    if (authStatus.needsRefresh) {
      throw new Error(`Authentication issue: ${authStatus.status}. Please refresh the page and try again.`);
    }
    
    const apiClient = createAuthenticatedApiClient();
    
    try {
      const response = await apiClient.post('/fuel-entitlements/', data);
      console.log('✅ Fuel entitlement created successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to create fuel entitlement:', error);
      
      // Provide user-friendly error messages
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please log out and log in again.');
      } else if (error.response?.status === 400) {
        const validationErrors = error.response.data;
        const errorMessage = typeof validationErrors === 'string' 
          ? validationErrors 
          : Object.entries(validationErrors).map(([field, msgs]: [string, any]) => 
              `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`
            ).join('; ');
        throw new Error(`Validation error: ${errorMessage}`);
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to create fuel entitlements.');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error. Please try again later or contact support.');
      } else if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        throw new Error('Network connection failed. Please check your internet connection.');
      }
      
      throw error;
    }
  }
};

// 4. Production debugging helper
export const runProductionDiagnostics = async () => {
  console.log('🔧 Running Production Fuel Entitlements Diagnostics...');
  
  const results = {
    authStatus: debugFuelEntitlementsAuth(),
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
    currentDomain: window.location.origin,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  };
  
  console.log('📋 Diagnostic Results:', results);
  
  // Test API connectivity
  try {
    const apiClient = createAuthenticatedApiClient();
    await apiClient.get('/fuel-entitlements/');
    results.apiConnectivity = 'success';
  } catch (error: any) {
    results.apiConnectivity = `failed: ${error.response?.status || error.message}`;
  }
  
  return results;
};

// 5. Auto-fix for common production issues
export const autoFixProductionIssues = () => {
  console.log('🛠️ Auto-fixing common production issues...');
  
  const fixes = [];
  
  // Fix 1: Clear invalid tokens
  try {
    const token = localStorage.getItem('access_token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        localStorage.removeItem('access_token');
        fixes.push('Cleared expired access token');
      }
    }
  } catch (e) {
    localStorage.removeItem('access_token');
    fixes.push('Cleared invalid access token');
  }
  
  // Fix 2: Clear any corrupted localStorage data
  try {
    const refresh = localStorage.getItem('refresh_token');
    if (refresh && refresh.split('.').length !== 3) {
      localStorage.removeItem('refresh_token');
      fixes.push('Cleared malformed refresh token');
    }
  } catch (e) {
    localStorage.removeItem('refresh_token');
    fixes.push('Cleared corrupted refresh token');
  }
  
  // Fix 3: Reset API client defaults
  delete axios.defaults.headers.common['Authorization'];
  fixes.push('Reset axios defaults');
  
  console.log('✅ Applied fixes:', fixes);
  return fixes;
};

export default {
  debugFuelEntitlementsAuth,
  enhancedFuelEntitlementsService,
  runProductionDiagnostics,
  autoFixProductionIssues
};