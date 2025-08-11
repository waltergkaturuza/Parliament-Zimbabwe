/**
 * HARMONIZED PROGRAM INTERFACE
 * 
 * This file provides the definitive TypeScript interface for Program entities
 * that ensures 100% compatibility with the Django model and DRF serializers.
 * 
 * This interface should replace all other Program interface definitions
 * across the frontend codebase for consistency.
 */

// === CORE INTERFACES ===

export interface User {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email?: string;
  role?: string;
}

export interface SubCenter {
  id: string;
  name: string;
  code?: string;
  location?: string;
}

// === HARMONIZED PROGRAM INTERFACE ===

export interface Program {
  // === CORE IDENTITY ===
  id: string;
  title: string;
  
  // === TYPE & DISPLAY ===
  program_type: 
    | 'SESSION'           // Parliament Session
    | 'COMMITTEE'         // Committee Meeting  
    | 'WORKSHOP'          // Workshop/Training
    | 'OUTREACH'          // Outreach Program
    | 'CONFERENCE'        // Conference
    | 'CEREMONY'          // Official Ceremony
    | 'INSPECTION'        // Site Inspection
    | 'CAMPAIGN'          // Political Campaign
    | 'NATIONAL_EVENT'    // National Event
    | 'CONSTITUENCY'      // Constituency Visit
    | 'DEBATE'            // Parliamentary Debate
    | 'BUDGET_SESSION'    // Budget Session
    | 'POLICY_MEETING'    // Policy Meeting
    | 'PUBLIC_HEARING'    // Public Hearing
    | 'DIPLOMATIC'        // Diplomatic Event
    | 'OTHER';            // Other Event
  
  program_type_display: string;
  status_display: string;
  
  // === SCHEDULING ===
  scheduled_date: string;  // ISO datetime string
  end_date?: string;       // ISO datetime string
  duration_days: number;
  
  // === DETAILS ===
  description?: string;
  location: string;
  notes?: string;
  
  // === RELATIONSHIPS ===
  organizer?: string;               // User ID
  organizer_details?: User;         // Nested user object
  organizer_name?: string;          // Formatted name for display
  
  sub_center?: string;              // SubCenter ID  
  sub_center_details?: SubCenter;   // Nested sub-center object
  sub_center_name?: string;         // Sub-center name for display
  
  attendees?: User[];               // Full attendees list (detailed views)
  
  // === MANAGEMENT ===
  expected_participants: number;
  fuel_allocation_approved: boolean;
  is_active: boolean;
  
  // === STATUS & PROGRESS ===
  is_upcoming: boolean;
  is_ongoing: boolean;
  is_completed: boolean;
  attendees_count: number;
  completion_percentage: number;
  
  // === TIMESTAMPS ===
  created: string;    // ISO datetime string
  modified: string;   // ISO datetime string
}

// === SPECIALIZED INTERFACES ===

/**
 * Lightweight interface for list views and cards
 */
export interface ProgramListItem {
  id: string;
  title: string;
  program_type: Program['program_type'];
  program_type_display: string;
  scheduled_date: string;
  end_date?: string;
  duration_days: number;
  location: string;
  organizer_name?: string;
  sub_center_name?: string;
  expected_participants: number;
  is_active: boolean;
  status_display: string;
  is_upcoming: boolean;
  is_ongoing: boolean;
  attendees_count: number;
  completion_percentage: number;
  fuel_allocation_approved: boolean;
}

/**
 * Interface for creating new programs
 */
export interface CreateProgramData {
  title: string;
  program_type: Program['program_type'];
  description?: string;
  location: string;
  scheduled_date: string;
  end_date?: string;
  organizer?: string;
  sub_center?: string;
  expected_participants?: number;
  fuel_allocation_approved?: boolean;
  is_active?: boolean;
  notes?: string;
}

/**
 * Interface for updating existing programs
 */
export interface UpdateProgramData {
  title?: string;
  program_type?: Program['program_type'];
  description?: string;
  location?: string;
  scheduled_date?: string;
  end_date?: string;
  organizer?: string;
  sub_center?: string;
  expected_participants?: number;
  fuel_allocation_approved?: boolean;
  is_active?: boolean;
  notes?: string;
}

// === UTILITY TYPES ===

/**
 * Program status derived from computed properties
 */
export type ProgramStatus = 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled' | 'Scheduled';

/**
 * Program type choices with display labels
 */
export const PROGRAM_TYPE_CHOICES = [
  { value: 'SESSION', label: 'Parliament Session' },
  { value: 'COMMITTEE', label: 'Committee Meeting' },
  { value: 'WORKSHOP', label: 'Workshop/Training' },
  { value: 'OUTREACH', label: 'Outreach Program' },
  { value: 'CONFERENCE', label: 'Conference' },
  { value: 'CEREMONY', label: 'Official Ceremony' },
  { value: 'INSPECTION', label: 'Site Inspection' },
  { value: 'CAMPAIGN', label: 'Political Campaign' },
  { value: 'NATIONAL_EVENT', label: 'National Event' },
  { value: 'CONSTITUENCY', label: 'Constituency Visit' },
  { value: 'DEBATE', label: 'Parliamentary Debate' },
  { value: 'BUDGET_SESSION', label: 'Budget Session' },
  { value: 'POLICY_MEETING', label: 'Policy Meeting' },
  { value: 'PUBLIC_HEARING', label: 'Public Hearing' },
  { value: 'DIPLOMATIC', label: 'Diplomatic Event' },
  { value: 'OTHER', label: 'Other Event' },
] as const;

/**
 * Program type with color mapping for UI
 */
export const PROGRAM_TYPE_COLORS = {
  SESSION: '#1890ff',
  COMMITTEE: '#52c41a', 
  WORKSHOP: '#fa8c16',
  OUTREACH: '#eb2f96',
  CONFERENCE: '#722ed1',
  CEREMONY: '#f5222d',
  INSPECTION: '#faad14',
  CAMPAIGN: '#13c2c2',
  NATIONAL_EVENT: '#ff4d4f',
  CONSTITUENCY: '#1890ff',
  DEBATE: '#52c41a',
  BUDGET_SESSION: '#fa8c16',
  POLICY_MEETING: '#eb2f96',
  PUBLIC_HEARING: '#722ed1',
  DIPLOMATIC: '#f5222d',
  OTHER: '#8c8c8c'
} as const;

// === API RESPONSE TYPES ===

export interface ProgramListResponse {
  count: number;
  next?: string;
  previous?: string;
  results: ProgramListItem[];
}

export interface ProgramDetailResponse extends Program {}

// === FIELD MAPPING DOCUMENTATION ===

/**
 * FIELD MAPPING REFERENCE
 * 
 * This interface ensures 100% compatibility with:
 * 
 * Django Model Fields (fuel.models.Program):
 * ✅ title -> title
 * ✅ program_type -> program_type (with all 16 parliamentary types)
 * ✅ description -> description
 * ✅ scheduled_date -> scheduled_date
 * ✅ end_date -> end_date
 * ✅ location -> location
 * ✅ sub_center -> sub_center (ID) + sub_center_details (nested)
 * ✅ organizer -> organizer (ID) + organizer_details (nested)
 * ✅ expected_participants -> expected_participants
 * ✅ fuel_allocation_approved -> fuel_allocation_approved
 * ✅ is_active -> is_active
 * ✅ notes -> notes
 * ✅ created -> created
 * ✅ modified -> modified
 * 
 * Computed Properties (added to model):
 * ✅ duration_days -> duration_days
 * ✅ is_upcoming -> is_upcoming
 * ✅ is_ongoing -> is_ongoing
 * ✅ is_completed -> is_completed
 * ✅ status_display -> status_display
 * ✅ attendees_count -> attendees_count
 * ✅ completion_percentage -> completion_percentage
 * 
 * Serializer Enhancements:
 * ✅ program_type_display -> program_type_display
 * ✅ organizer_name -> organizer_name (formatted)
 * ✅ sub_center_name -> sub_center_name (for display)
 * ✅ attendees -> attendees (detailed views only)
 * 
 * Frontend Compatibility:
 * ✅ Replaces models.ts Program interface
 * ✅ Replaces programs.ts Program interface  
 * ✅ Compatible with ProgramList.tsx component
 * ✅ Compatible with ProgramsPage.tsx component
 * ✅ Supports all existing frontend functionality
 */
