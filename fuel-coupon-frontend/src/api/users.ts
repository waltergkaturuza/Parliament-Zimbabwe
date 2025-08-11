// src/api/users.ts
import apiClient from './index';

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'SUPERUSER' | 'ADMIN' | 'MAIN_CENTER' | 'SUB_CENTER' | 'BENEFICIARY' | 'AUDITOR' | 'MAIN_CENTER_APPROVER' | 'SUB_CENTER_APPROVER';
  phone?: string;
  is_active: boolean;
  is_staff: boolean;
  date_joined: string;
  last_login?: string;
  last_activity?: string;
  sub_center?: {
    id: string;
    name: string;
  };
}

export interface CreateUserData {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  phone?: string;
  password: string;
  is_active?: boolean;
  is_staff?: boolean;
  sub_center?: string;
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: 'SUPERUSER' | 'ADMIN' | 'MAIN_CENTER' | 'SUB_CENTER' | 'BENEFICIARY' | 'AUDITOR' | 'MAIN_CENTER_APPROVER' | 'SUB_CENTER_APPROVER';
  phone?: string;
  is_active?: boolean;
  is_staff?: boolean;
  sub_center?: string;
}

export const UserService = {
  // Get all users with optional filtering
  getUsers: async (params?: {
    role?: string;
    is_active?: boolean;
    search?: string;
    page?: number;
    page_size?: number;
  }) => {
  const response = await apiClient.get('/users/', { params });
    return response.data;
  },

  // Get users by specific role
  getUsersByRole: async (role: string) => {
  const response = await apiClient.get('/users/', { params: { role } });
    return response.data;
  },

  // Get a specific user by ID
  getUser: async (id: string | number) => {
  const response = await apiClient.get(`/users/${id}/`);
    return response.data;
  },

  // Create a new user
  createUser: async (userData: CreateUserData) => {
  const response = await apiClient.post('/users/', userData);
    return response.data;
  },

  // Update an existing user
  updateUser: async (id: string | number, userData: UpdateUserData) => {
  const response = await apiClient.patch(`/users/${id}/`, userData);
    return response.data;
  },

  // Delete a user
  deleteUser: async (id: string | number) => {
  const response = await apiClient.delete(`/users/${id}/`);
    return response.data;
  },

  // Toggle user active status
  toggleUserStatus: async (id: string | number, is_active: boolean) => {
    const response = await apiClient.patch(`/users/${id}/`, { is_active });
    return response.data;
  },

  // Reset user password
  resetPassword: async (id: string | number) => {
    const response = await apiClient.post(`/users/${id}/reset-password/`);
    return response.data;
  },

  // Get user statistics
  getUserStats: async () => {
  const response = await apiClient.get('/users/stats/');
    return response.data;
  },
};