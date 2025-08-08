import { apiClient } from '../api/apiClient';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  display_name: string;
  role: string;
  phone?: string;
  date_of_birth?: string;
  age?: number;
  address?: string;
  national_id?: string;
  employee_id?: string;
  department?: string;
  position?: string;
  bio?: string;
  preferred_language: string;
  timezone: string;
  profile_picture?: string;
  profile_picture_url?: string;
  profile_completion: number;
  sub_center?: number;
  sub_center_name?: string;
  notification_preferences: Record<string, boolean>;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  last_activity: string;
  date_joined: string;
  is_approved: boolean;
  approved_at?: string;
}

export interface UserProfileUpdate {
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
  notification_preferences?: Record<string, boolean>;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

export interface NotificationPreferences {
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  coupon_alerts: boolean;
  system_alerts: boolean;
  fuel_price_updates: boolean;
  account_updates: boolean;
  security_alerts: boolean;
}

export interface ProfileStats {
  profile_completion: number;
  account_age_days: number;
  last_login?: string;
  last_activity: string;
  is_approved: boolean;
  role: string;
  total_distributions?: number;
  total_transactions?: number;
  total_coupons_received?: number;
  coupons_used?: number;
}

export interface RecentActivityItem {
  timestamp: string;
  action: string;
  model: string;
  description: string;
  ip_address: string;
}

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

class UserProfileService {
  private baseUrl = '/profile';

  // Get current user's profile
  async getCurrentUserProfile(): Promise<UserProfile> {
    const response = await apiClient.get(`${this.baseUrl}/`);
    return response.data;
  }

  // Get specific user's profile (admin only)
  async getUserProfile(userId: number): Promise<UserProfile> {
    const response = await apiClient.get(`${this.baseUrl}/${userId}/`);
    return response.data;
  }

  // Update current user's profile
  async updateCurrentUserProfile(data: UserProfileUpdate): Promise<UserProfile> {
    const response = await apiClient.patch(`${this.baseUrl}/update/`, data);
    return response.data;
  }

  // Update specific user's profile (admin only)
  async updateUserProfile(userId: number, data: UserProfileUpdate): Promise<UserProfile> {
    const response = await apiClient.patch(`${this.baseUrl}/${userId}/update/`, data);
    return response.data;
  }

  // Upload avatar for current user
  async uploadCurrentUserAvatar(file: File): Promise<UserProfile> {
    const formData = new FormData();
    formData.append('profile_picture', file);
    
    const response = await apiClient.patch(`${this.baseUrl}/avatar/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Upload avatar for specific user (admin only)
  async uploadUserAvatar(userId: number, file: File): Promise<UserProfile> {
    const formData = new FormData();
    formData.append('profile_picture', file);
    
    const response = await apiClient.patch(`${this.baseUrl}/${userId}/avatar/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Get notification preferences
  async getNotificationPreferences(): Promise<{ preferences: NotificationPreferences }> {
    const response = await apiClient.get(`${this.baseUrl}/notifications/`);
    return response.data;
  }

  // Update notification preferences
  async updateNotificationPreferences(preferences: Partial<NotificationPreferences>): Promise<{ message: string; preferences: NotificationPreferences }> {
    const response = await apiClient.post(`${this.baseUrl}/notifications/update/`, {
      preferences,
    });
    return response.data;
  }

  // Get profile statistics
  async getProfileStats(): Promise<{ stats: ProfileStats }> {
    const response = await apiClient.get(`${this.baseUrl}/stats/`);
    return response.data;
  }

  // Get recent activity
  async getRecentActivity(): Promise<{ activities: RecentActivityItem[] }> {
    const response = await apiClient.get(`${this.baseUrl}/activity/`);
    return response.data;
  }

  // Change password
  async changePassword(data: PasswordChangeRequest): Promise<{ message: string }> {
    const response = await apiClient.post(`${this.baseUrl}/change-password/`, data);
    return response.data;
  }

  // Helper method to validate profile completeness
  validateProfileCompleteness(profile: UserProfile): { isComplete: boolean; missingFields: string[] } {
    const requiredFields = [
      { key: 'first_name', label: 'First Name' },
      { key: 'last_name', label: 'Last Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
    ];

    const missingFields: string[] = [];

    requiredFields.forEach(field => {
      const value = profile[field.key as keyof UserProfile];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        missingFields.push(field.label);
      }
    });

    return {
      isComplete: missingFields.length === 0,
      missingFields,
    };
  }

  // Helper method to format user display name
  formatDisplayName(profile: UserProfile): string {
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    } else if (profile.first_name) {
      return profile.first_name;
    } else if (profile.last_name) {
      return profile.last_name;
    } else {
      return profile.username;
    }
  }

  // Helper method to get role display color
  getRoleColor(role: string): 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' {
    const roleColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'> = {
      SUPERUSER: 'error',
      ADMIN: 'error',
      MAIN_CENTER: 'warning',
      SUB_CENTER: 'info',
      BENEFICIARY: 'success',
      AUDITOR: 'secondary',
      MAIN_CENTER_APPROVER: 'warning',
      SUB_CENTER_APPROVER: 'info',
    };
    return roleColors[role] || 'default';
  }

  // Helper method to format last activity
  formatLastActivity(lastActivity: string): string {
    const date = new Date(lastActivity);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
}

export const userProfileService = new UserProfileService();
