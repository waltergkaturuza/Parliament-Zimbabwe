// src/api/profile.ts
import apiClient from './index';

export interface ProfileUpdateData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  department?: string;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  address?: string;
  department?: string;
  is_active: boolean;
  last_login?: string;
  date_joined?: string;
  centerId?: number;
}

export const ProfileService = {
  // Get current user profile
  getProfile: async (): Promise<UserProfile> => {
    const response = await apiClient.get('/auth/user/');
    return response.data;
  },

  // Update user profile
  updateProfile: async (data: ProfileUpdateData): Promise<UserProfile> => {
    const response = await apiClient.patch('/auth/user/', data);
    return response.data;
  },

  // Change password
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await apiClient.post('/auth/change-password/', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },
};
