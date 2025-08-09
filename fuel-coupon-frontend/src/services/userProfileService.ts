import apiClient from '../api/index';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  sub_center?: {
    id: number;
    name: string;
    code: string;
  };
  phone?: string;
  profile_picture?: string;
  date_of_birth?: string;
  address?: string;
  national_id?: string;
  employee_id?: string;
  department?: string;
  position?: string;
  bio?: string;
  preferred_language: string;
  timezone: string;
  notification_preferences: Record<string, any>;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  is_approved: boolean;
  last_activity: string;
}

export interface UpdateProfileData {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  national_id?: string;
  employee_id?: string;
  department?: string;
  position?: string;
  bio?: string;
  preferred_language?: string;
  timezone?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

class UserProfileService {
  async getCurrentProfile(): Promise<UserProfile> {
    const response = await apiClient.get('/profile/me/');
    return response.data;
  }

  async updateProfile(data: UpdateProfileData): Promise<UserProfile> {
    const response = await apiClient.patch('/profile/me/', data);
    return response.data;
  }

  async changePassword(data: ChangePasswordData): Promise<void> {
    await apiClient.post('/profile/change-password/', data);
  }

  async uploadProfilePicture(file: File): Promise<UserProfile> {
    const formData = new FormData();
    formData.append('profile_picture', file);
    
    const response = await apiClient.patch('/profile/me/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async updateNotificationPreferences(preferences: Record<string, any>): Promise<UserProfile> {
    const response = await apiClient.patch('/profile/me/', {
      notification_preferences: preferences,
    });
    return response.data;
  }

  async getProfileSummary(): Promise<{
    total_logins: number;
    last_login: string;
    account_created: string;
    permissions: string[];
  }> {
    const response = await apiClient.get('/profile/summary/');
    return response.data;
  }
}

export const userProfileService = new UserProfileService();
export default userProfileService;
