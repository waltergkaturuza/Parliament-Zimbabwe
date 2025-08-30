// src/api/sergeantOfArms.ts
import api from '@/api';

export interface AttendanceRegistryStats {
  pending_registries: number;
  in_progress_registries: number;
  completed_this_week: number;
  recent_registries: AttendanceRegistry[];
  user_role: string;
  status: string;
}

export interface AttendanceRegistry {
  id: number;
  title: string;
  attendance_date: string;
  status: string;
  session_details?: {
    id: number;
    title: string;
    session_type: string;
    venue: string;
    start_time: string;
    end_time: string;
    session_number: number;
  };
  program_details?: {
    id: number;
    title: string;
    program_type: string;
    description: string;
  };
  managing_subcenter_name: string;
  total_expected: number;
  total_present: number;
  total_absent: number;
  total_excused: number;
  total_late: number;
  total_marked: number;
  completion_percentage: number;
  attendance_percentage: number;
  published_date: string;
  submitted_date?: string;
  notes?: string;
  created_by_name: string;
  can_mark_attendance: boolean;
  can_submit: boolean;
}

export interface AttendanceMember {
  id: number;
  member_details: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    constituency?: string;
    party_affiliation?: string;
    profile_picture?: string;
  };
  attendance_status: 'PRESENT' | 'ABSENT' | 'EXCUSED' | 'LATE' | null;
  marked_at?: string;
  notes?: string;
  excuse_reason?: string;
  arrival_time?: string;
}

export interface AttendanceCorrection {
  id: number;
  registry_details: {
    id: number;
    title: string;
    attendance_date: string;
    session_details?: {
      title: string;
      session_type: string;
    };
  };
  member_details: {
    id: number;
    first_name: string;
    last_name: string;
    constituency?: string;
  };
  original_status: string;
  corrected_status: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requested_by_name: string;
  requested_date: string;
  reviewed_by_name?: string;
  reviewed_date?: string;
  review_notes?: string;
}

export const sergeantOfArmsAPI = {
  // Dashboard
  getDashboardStats: async (): Promise<AttendanceRegistryStats> => {
  const response = await api.get('/sergeant-of-arms/dashboard/');
    return response.data;
  },

  // Attendance Registries
  getAttendanceRegistries: async (params?: {
    search?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    managing_subcenter?: string;
  }): Promise<AttendanceRegistry[]> => {
  // Path should be relative to API base; avoid double "/api" when baseURL already ends with /api or /api/v1
  const response = await api.get('/attendance-registries/', { params });
    return response.data.results || response.data;
  },

  getAttendanceRegistry: async (registryId: number): Promise<AttendanceRegistry> => {
  const response = await api.get(`/attendance-registries/${registryId}/`);
    return response.data;
  },

  startAttendanceMarking: async (registryId: number): Promise<void> => {
  await api.post(`/attendance-registries/${registryId}/start_marking/`);
  },

  submitAttendance: async (registryId: number, notes?: string): Promise<void> => {
  await api.post(`/attendance-registries/${registryId}/submit_attendance/`, { notes });
  },

  // Attendance Members
  getAttendanceMembers: async (registryId: number): Promise<AttendanceMember[]> => {
    const response = await api.get(`/api/attendance-registries/${registryId}/members/`);
    return response.data.results || response.data;
  },

  markMemberPresent: async (memberId: number, notes?: string): Promise<void> => {
    await api.post(`/api/attendance-members/${memberId}/mark_present/`, { notes });
  },

  markMemberAbsent: async (memberId: number, notes?: string): Promise<void> => {
    await api.post(`/api/attendance-members/${memberId}/mark_absent/`, { notes });
  },

  markMemberExcused: async (memberId: number, excuseReason: string, notes?: string): Promise<void> => {
    await api.post(`/api/attendance-members/${memberId}/mark_excused/`, {
      excuse_reason: excuseReason,
      notes
    });
  },

  markMemberLate: async (memberId: number, arrivalTime?: string, notes?: string): Promise<void> => {
    await api.post(`/api/attendance-members/${memberId}/mark_late/`, {
      arrival_time: arrivalTime,
      notes
    });
  },

  // Corrections
  getAttendanceCorrections: async (): Promise<AttendanceCorrection[]> => {
  const response = await api.get('/attendance-corrections/');
    return response.data.results || response.data;
  },

  reviewCorrection: async (correctionId: number, status: 'APPROVED' | 'REJECTED', reviewNotes?: string): Promise<void> => {
    await api.post(`/api/attendance-corrections/${correctionId}/review/`, {
      status,
      review_notes: reviewNotes
    });
  },
};

export default sergeantOfArmsAPI;
