// src/api/programs.ts
import apiClient from './index';
import { Program } from '../types/models';

// Remove conflicting Program interface - using harmonized version from types/models
// This ensures consistency with Django model and DRF serializers

export interface CreateProgramData {
  title: string;
  program_type: Program['program_type']; // Use the comprehensive 16 parliamentary types
  scheduled_date: string;
  end_date?: string;
  description: string;
  location: string;
  organizer?: string;
  is_active?: boolean;
  sub_center?: string;
  expected_participants?: number;
  fuel_allocation_approved?: boolean;
  notes?: string;
}

export interface UpdateProgramData {
  title?: string;
  program_type?: Program['program_type']; // Use the comprehensive 16 parliamentary types
  scheduled_date?: string;
  end_date?: string;
  description?: string;
  location?: string;
  organizer?: string;
  is_active?: boolean;
  sub_center?: string;
  expected_participants?: number;
  fuel_allocation_approved?: boolean;
  notes?: string;
}

export const ProgramService = {
  // Get all programs with optional filtering
  getPrograms: async (params?: {
    program_type?: string;
    is_active?: boolean;
    organizer?: string;
    sub_center?: string;
    search?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    page_size?: number;
  }) => {
    const response = await apiClient.get('/programs/', { params });
    return response.data;
  },

  // Get a specific program by ID
  getProgram: async (id: string | number) => {
    const response = await apiClient.get(`/programs/${id}/`);
    return response.data;
  },

  // Create a new program
  createProgram: async (programData: CreateProgramData) => {
    const response = await apiClient.post('/programs/', programData);
    return response.data;
  },

  // Update an existing program
  updateProgram: async (id: string | number, programData: UpdateProgramData) => {
    const response = await apiClient.patch(`/programs/${id}/`, programData);
    return response.data;
  },

  // Delete a program
  deleteProgram: async (id: string | number) => {
    const response = await apiClient.delete(`/programs/${id}/`);
    return response.data;
  },

  // Toggle program active status
  toggleProgramStatus: async (id: string | number, is_active: boolean) => {
    const response = await apiClient.patch(`/programs/${id}/`, { is_active });
    return response.data;
  },

  // Get program statistics
  getProgramStats: async () => {
    const response = await apiClient.get('/programs/stats/');
    return response.data;
  },

  // Get program attendees
  getProgramAttendees: async (id: string | number) => {
    const response = await apiClient.get(`/programs/${id}/attendees/`);
    return response.data;
  },

  // Add attendee to program
  addProgramAttendee: async (id: string | number, userId: string | number) => {
    const response = await apiClient.post(`/programs/${id}/attendees/`, { user_id: userId });
    return response.data;
  },

  // Remove attendee from program
  removeProgramAttendee: async (id: string | number, userId: string | number) => {
    const response = await apiClient.delete(`/programs/${id}/attendees/${userId}/`);
    return response.data;
  },
};
