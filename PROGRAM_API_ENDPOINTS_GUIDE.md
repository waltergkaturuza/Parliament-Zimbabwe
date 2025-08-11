# PROGRAM API ENDPOINTS HARMONIZATION

## Enhanced API Endpoints

### 1. List Programs (Enhanced)
```
GET /api/programs/
```

**Response with harmonized fields:**
```json
{
  "count": 25,
  "results": [
    {
      "id": "1",
      "title": "Parliamentary Orientation Workshop",
      "program_type": "WORKSHOP",
      "program_type_display": "Workshop/Training",
      "status_display": "Upcoming",
      "scheduled_date": "2024-07-15T09:00:00Z",
      "end_date": "2024-07-15T17:00:00Z",
      "duration_days": 1,
      "location": "Parliament Main Hall",
      "organizer_name": "John Doe",
      "sub_center_name": "Central Harare",
      "expected_participants": 45,
      "is_active": true,
      "is_upcoming": true,
      "is_ongoing": false,
      "is_completed": false,
      "attendees_count": 42,
      "completion_percentage": 0,
      "fuel_allocation_approved": true
    }
  ]
}
```

### 2. Program Detail (Enhanced)
```
GET /api/programs/{id}/
```

**Full program object with all computed fields and relationships.**

### 3. Create Program
```
POST /api/programs/
```

**Accepts all 16 program types and validates properly.**

### 4. Update Program  
```
PUT /api/programs/{id}/
PATCH /api/programs/{id}/
```

**Updates with validation and auto-computation of status fields.**

## API Field Changes

### NEW Computed Fields Available:
- `duration_days` - Calculated program duration
- `is_upcoming` - Boolean status indicator
- `is_ongoing` - Boolean status indicator  
- `is_completed` - Boolean status indicator
- `status_display` - Human readable status
- `attendees_count` - Actual attendee count
- `completion_percentage` - Progress percentage
- `organizer_name` - Formatted organizer name
- `sub_center_name` - Sub-center display name

### Program Type Validation:
All endpoints now validate against 16 parliamentary program types:
`SESSION`, `COMMITTEE`, `WORKSHOP`, `OUTREACH`, `CONFERENCE`, 
`CEREMONY`, `INSPECTION`, `CAMPAIGN`, `NATIONAL_EVENT`,
`CONSTITUENCY`, `DEBATE`, `BUDGET_SESSION`, `POLICY_MEETING`,
`PUBLIC_HEARING`, `DIPLOMATIC`, `OTHER`
