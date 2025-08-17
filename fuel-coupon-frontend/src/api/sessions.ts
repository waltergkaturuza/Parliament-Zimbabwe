// src/api/sessions.ts
import apiClient from './index';
import { ParliamentSession } from '../types';

export interface SessionStats {
  total_sessions: number;
  active_sessions: number;
  upcoming_sessions: number;
  completed_sessions: number;
  inactive_sessions: number;
}

export interface SessionsListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ParliamentSession[];
}

export interface CreateSessionData {
  title: string;
  description?: string;
  session_type: 'REGULAR' | 'SPECIAL' | 'COMMITTEE' | 'BUDGET' | 'EMERGENCY';
  start_date: string; // YYYY-MM-DD format
  end_date: string; // YYYY-MM-DD format
  start_time?: string; // HH:MM:SS format
  end_time?: string; // HH:MM:SS format
  venue?: string;
  is_active?: boolean;
  is_mandatory?: boolean;
  fuel_top_up_litres?: number;
  fuel_top_up_percentage?: number;
  expected_attendance?: number;
  attendance_tracked?: boolean;
  organizer?: string; // User ID
  managing_subcenter?: string; // SubCenter ID
  program?: string | null; // Program ID
  assigned_attendees_input?: (string | number)[]; // Beneficiary Profile IDs (will be converted to numbers)
}

export class SessionService {
  // Get all sessions with optional filtering
  static async getSessions(params?: {
    status?: 'active' | 'upcoming' | 'completed' | 'inactive';
    search?: string;
    session_type?: string;
    organizer?: string;
    page?: number;
    page_size?: number;
  }): Promise<SessionsListResponse> {
    console.log('SessionService.getSessions called with:', params);
    const response = await apiClient.get('/parliament-sessions/', { params });
    console.log('SessionService.getSessions response:', response.status, response.data);
    return response.data;
  }

  // Get session statistics
  static async getStats(): Promise<SessionStats> {
    console.log('SessionService.getStats called');
    const response = await apiClient.get('/parliament-sessions/stats/');
    console.log('SessionService.getStats response:', response.status, response.data);
    return response.data;
  }

  // Get single session by ID
  static async getSession(id: string): Promise<ParliamentSession> {
    console.log('SessionService.getSession called with ID:', id);
    const response = await apiClient.get(`/parliament-sessions/${id}/`);
    console.log('SessionService.getSession response:', response.status, response.data);
    return response.data;
  }

  // Create new session
  static async createSession(data: CreateSessionData): Promise<ParliamentSession> {
    console.log('SessionService.createSession called with:', data);
    // Ensure assigned_attendees are numbers
    const processedData = {
      ...data,
      assigned_attendees: data.assigned_attendees?.map(id => 
        typeof id === 'string' ? parseInt(id, 10) : id
      ).filter((id): id is number => typeof id === 'number' && !isNaN(id))
    };
    console.log('Processed data:', processedData);
    const response = await apiClient.post('/parliament-sessions/', processedData);
    console.log('SessionService.createSession response:', response.status, response.data);
    return response.data;
  }

  // Update existing session
  static async updateSession(id: string, data: Partial<CreateSessionData>): Promise<ParliamentSession> {
    console.log('SessionService.updateSession called with:', id, data);
    const response = await apiClient.put(`/parliament-sessions/${id}/`, data);
    console.log('SessionService.updateSession response:', response.status, response.data);
    return response.data;
  }

  // Delete session
  static async deleteSession(id: string): Promise<void> {
    console.log('SessionService.deleteSession called with ID:', id);
    const response = await apiClient.delete(`/parliament-sessions/${id}/`);
    console.log('SessionService.deleteSession response:', response.status);
  }

  // Activate session
  static async activateSession(id: string): Promise<{ message: string }> {
    console.log('SessionService.activateSession called with ID:', id);
    const response = await apiClient.post(`/parliament-sessions/${id}/activate/`);
    console.log('SessionService.activateSession response:', response.status, response.data);
    return response.data;
  }

  // Deactivate session
  static async deactivateSession(id: string): Promise<{ message: string }> {
    console.log('SessionService.deactivateSession called with ID:', id);
    const response = await apiClient.post(`/parliament-sessions/${id}/deactivate/`);
    console.log('SessionService.deactivateSession response:', response.status, response.data);
    return response.data;
  }

  // Get attendance records for a session
  static async getSessionAttendances(id: string): Promise<any[]> {
    console.log('SessionService.getSessionAttendances called with ID:', id);
    const response = await apiClient.get(`/parliament-sessions/${id}/attendances/`);
    console.log('SessionService.getSessionAttendances response:', response.status, response.data);
    return response.data;
  }

  // Mark attendance for a session
  static async markAttendance(sessionId: string, data: {
    beneficiary_id: string;
    attended: boolean;
  }): Promise<any> {
    console.log('SessionService.markAttendance called with:', sessionId, data);
    const response = await apiClient.post(`/parliament-sessions/${sessionId}/mark_attendance/`, data);
    console.log('SessionService.markAttendance response:', response.status, response.data);
    return response.data;
  }
}

export default SessionService;
