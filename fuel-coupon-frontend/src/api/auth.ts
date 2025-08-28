// src/api/auth.ts
import apiClient from '@/api';

export interface LoginData {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password2?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: string;
  sub_center?: number | null;
}

export interface AuthResponse {
  success: boolean;
  access?: string;
  refresh?: string;
  message?: string;
  user?: any;
}

export const AuthService = {
  login: async (credentials: LoginData): Promise<{ success: boolean; access?: string; refresh?: string; message?: string; user?: any }> => {
    try {
      console.log('AuthService.login called with:', credentials);
    // Use the correct Django auth endpoint
    // Base URL already includes /api, so this hits /api/auth/login/
    const response = await apiClient.post<{ status: string; access: string; refresh?: string; message?: string; user?: any }>('/auth/login/', credentials);
      console.log('AuthService.login response received:', response.status, response.data);
      
      if (response.data.status === 'success') {
        return { 
          success: true,
          access: response.data?.access, 
      refresh: response.data?.refresh, // Use real refresh token if provided
          user: response.data?.user
        };
      } else {
        return { success: false, message: response.data.message || 'Login failed' };
      }
    } catch (error: any) {
      console.error('Login API Error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        request: error.request,
        config: error.config
      });
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error.message ||
        'Login failed. Please check your credentials.';
      return { success: false, message, access: undefined, refresh: undefined, user: undefined };
    }
  },

  register: async (
    data: RegisterData
  ): Promise<{ success: boolean; data?: any; message?: string }> => {
    try {
      const response = await apiClient.post('/auth/register/', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      let message = 'Registration failed. Please try again.';
      if (error.response?.data) {
        message = Object.values(error.response.data).flat().join(' ');
      } else if (error.message) {
        message = error.message;
      }
      return { success: false, message };
    }
  },

  refreshToken: async (refreshToken: string): Promise<{ success: boolean; access?: string; message?: string }> => {
    try {
      const response = await apiClient.post<{ access: string }>('/auth/refresh/', { refresh: refreshToken });
      return { success: true, access: response.data.access };
    } catch (error: any) {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error.message ||
        'Failed to refresh token.';
      return { success: false, message };
    }
  },

  logout: () => {
  // Use the same storage keys used by AuthContext and apiClient
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  },
};

export const loginUser = async (
  credentials: LoginData
): Promise<AuthResponse> => {
  return AuthService.login(credentials);
};

export const registerUser = async (
  data: RegisterData
): Promise<{ success: boolean; data?: any; message?: string }> => {
  return AuthService.register(data);
};

export const refreshToken = async (refreshToken: string): Promise<{ success: boolean; access?: string; message?: string }> => {
  return AuthService.refreshToken(refreshToken);
};