# PROGRAM FRONTEND HARMONIZATION GUIDE

## Required Updates

### 1. Replace Existing Interfaces

**Files to Update:**
- `src/types/models.ts` - Update Program interface
- `src/api/programs.ts` - Replace limited interface 
- `src/pages/programs/ProgramList.tsx` - Update component interface

### 2. New Harmonized Interface

Replace all existing Program interfaces with this single harmonized version:

```typescript
interface Program {
  // Core Identity
  id: string;
  title: string;
  
  // Type & Display (USE 16 PARLIAMENTARY TYPES)
  program_type: 'SESSION' | 'COMMITTEE' | 'WORKSHOP' | 'OUTREACH' | 
                'CONFERENCE' | 'CEREMONY' | 'INSPECTION' | 'CAMPAIGN' |
                'NATIONAL_EVENT' | 'CONSTITUENCY' | 'DEBATE' | 
                'BUDGET_SESSION' | 'POLICY_MEETING' | 'PUBLIC_HEARING' |
                'DIPLOMATIC' | 'OTHER';
  program_type_display: string;
  status_display: string;
  
  // Scheduling  
  scheduled_date: string;
  end_date?: string;
  duration_days: number;
  
  // Details
  description?: string;
  location: string;
  notes?: string;
  
  // Relationships
  organizer?: string;
  organizer_details?: User;
  organizer_name?: string;
  sub_center?: string;
  sub_center_details?: SubCenter;
  sub_center_name?: string;
  
  // Management
  expected_participants: number;
  fuel_allocation_approved: boolean;
  is_active: boolean;
  
  // Status & Progress (NEW COMPUTED FIELDS)
  is_upcoming: boolean;
  is_ongoing: boolean;
  is_completed: boolean;
  attendees_count: number;
  completion_percentage: number;
  
  // Timestamps
  created: string;
  modified: string;
}
```

### 3. API Integration Updates

**Update API calls to use new fields:**

```typescript
// OLD: Limited program types
program_type: 'TRAINING' | 'DISTRIBUTION' | 'MEETING' | 'ACTIVITY'

// NEW: Full parliamentary types  
program_type: 'SESSION' | 'COMMITTEE' | 'WORKSHOP' | ... (16 types)

// NEW: Access computed properties
const program = await api.getProgram(id);
console.log(program.is_upcoming);        // Boolean
console.log(program.duration_days);      // Number  
console.log(program.attendees_count);    // Number
console.log(program.completion_percentage); // Number
```

### 4. Component Updates

**ProgramList.tsx - Use computed fields:**

```tsx
// Status indicator using computed fields
const getStatusColor = (program: Program) => {
  if (program.is_ongoing) return 'processing';
  if (program.is_upcoming) return 'default';
  if (program.is_completed) return 'success';
  return 'error';
};

// Progress indicator
<Progress 
  percent={program.completion_percentage} 
  status={program.is_completed ? 'success' : 'active'}
/>

// Duration display
<Text>{program.duration_days} day{program.duration_days > 1 ? 's' : ''}</Text>

// Attendees count
<Statistic 
  title="Attendees" 
  value={program.attendees_count}
  suffix={`/ ${program.expected_participants}`}
/>
```

### 5. Form Updates

**Program creation/editing forms:**

```tsx
// Program type selection with all 16 options
const PROGRAM_TYPE_OPTIONS = [
  { value: 'SESSION', label: 'Parliament Session' },
  { value: 'COMMITTEE', label: 'Committee Meeting' },
  { value: 'WORKSHOP', label: 'Workshop/Training' },
  // ... all 16 types
];

<Select options={PROGRAM_TYPE_OPTIONS} />
```

## Validation Checklist

- [ ] Remove old Program interfaces from `api/programs.ts`
- [ ] Update `types/models.ts` with harmonized interface
- [ ] Update all component imports to use single interface
- [ ] Test API integration with new computed fields
- [ ] Verify program type selection works with all 16 types
- [ ] Test progress indicators with computed percentages
- [ ] Validate status displays use computed status_display
