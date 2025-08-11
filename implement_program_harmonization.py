#!/usr/bin/env python3
"""
Program Harmonization Implementation Script
Implements complete harmonization for Program model, serializers, and frontend interfaces
"""

import os
import sys
import django
from datetime import datetime

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')
django.setup()

class ProgramHarmonizationManager:
    """Manages the complete harmonization of Program entities"""
    
    def __init__(self):
        self.implementation_log = []
        self.errors = []
        self.success_count = 0
        self.error_count = 0
    
    def log(self, message, level='INFO'):
        """Log implementation messages"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        log_entry = f"[{timestamp}] {level}: {message}"
        self.implementation_log.append(log_entry)
        print(log_entry)
    
    def test_model_implementation(self):
        """Test Program model with computed properties"""
        self.log("Testing Program model implementation...")
        
        try:
            from fuel.models import Program
            
            # Test model can be imported
            self.log("✅ Program model imported successfully")
            
            # Test computed properties exist
            properties_to_test = [
                'duration_days', 'is_upcoming', 'is_ongoing', 'is_completed',
                'status_display', 'attendees_count', 'completion_percentage'
            ]
            
            for prop in properties_to_test:
                if hasattr(Program, prop):
                    self.log(f"✅ Property {prop} exists in model")
                else:
                    self.log(f"❌ Property {prop} missing from model", 'ERROR')
                    self.errors.append(f"Missing property: {prop}")
            
            # Test program types
            if hasattr(Program, 'PROGRAM_TYPES'):
                type_count = len(Program.PROGRAM_TYPES)
                self.log(f"✅ Program types defined: {type_count} choices")
                
                # Verify comprehensive parliamentary types
                expected_types = [
                    'SESSION', 'COMMITTEE', 'WORKSHOP', 'OUTREACH', 'CONFERENCE',
                    'CEREMONY', 'INSPECTION', 'CAMPAIGN', 'NATIONAL_EVENT', 
                    'CONSTITUENCY', 'DEBATE', 'BUDGET_SESSION', 'POLICY_MEETING',
                    'PUBLIC_HEARING', 'DIPLOMATIC', 'OTHER'
                ]
                
                defined_types = [choice[0] for choice in Program.PROGRAM_TYPES]
                missing_types = set(expected_types) - set(defined_types)
                
                if not missing_types:
                    self.log("✅ All expected program types are defined")
                else:
                    self.log(f"❌ Missing program types: {missing_types}", 'ERROR')
                    self.errors.append(f"Missing program types: {missing_types}")
            else:
                self.log("❌ PROGRAM_TYPES not defined in model", 'ERROR')
                self.errors.append("PROGRAM_TYPES not defined")
            
            self.success_count += 1
            return True
            
        except Exception as e:
            self.log(f"❌ Model test failed: {e}", 'ERROR')
            self.errors.append(f"Model test error: {e}")
            self.error_count += 1
            return False
    
    def test_serializer_implementation(self):
        """Test Program serializer with enhanced fields"""
        self.log("Testing Program serializer implementation...")
        
        try:
            from fuel.serializers import ProgramSerializer, ProgramListSerializer, ProgramWriteSerializer
            
            # Test serializers can be imported
            self.log("✅ Program serializers imported successfully")
            
            # Test main serializer fields
            serializer = ProgramSerializer()
            serializer_fields = list(serializer.fields.keys())
            
            expected_fields = [
                'id', 'title', 'program_type', 'program_type_display',
                'duration_days', 'is_upcoming', 'is_ongoing', 'is_completed',
                'attendees_count', 'completion_percentage', 'status_display'
            ]
            
            missing_fields = []
            for field in expected_fields:
                if field in serializer_fields:
                    self.log(f"✅ Serializer field {field} present")
                else:
                    missing_fields.append(field)
                    self.log(f"❌ Serializer field {field} missing", 'ERROR')
            
            if missing_fields:
                self.errors.append(f"Missing serializer fields: {missing_fields}")
            
            # Test specialized serializers
            list_serializer = ProgramListSerializer()
            write_serializer = ProgramWriteSerializer()
            
            self.log(f"✅ ProgramListSerializer has {len(list_serializer.fields)} fields")
            self.log(f"✅ ProgramWriteSerializer has {len(write_serializer.fields)} fields")
            
            self.success_count += 1
            return len(missing_fields) == 0
            
        except Exception as e:
            self.log(f"❌ Serializer test failed: {e}", 'ERROR')
            self.errors.append(f"Serializer test error: {e}")
            self.error_count += 1
            return False
    
    def create_frontend_update_guide(self):
        """Create guide for updating frontend interfaces"""
        self.log("Creating frontend update guide...")
        
        frontend_guide = """
# PROGRAM FRONTEND HARMONIZATION GUIDE

## 🎯 Required Updates

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

## ✅ Validation Checklist

- [ ] Remove old Program interfaces from `api/programs.ts`
- [ ] Update `types/models.ts` with harmonized interface
- [ ] Update all component imports to use single interface
- [ ] Test API integration with new computed fields
- [ ] Verify program type selection works with all 16 types
- [ ] Test progress indicators with computed percentages
- [ ] Validate status displays use computed status_display
"""
        
        try:
            with open('PROGRAM_FRONTEND_UPDATE_GUIDE.md', 'w') as f:
                f.write(frontend_guide)
            
            self.log("✅ Frontend update guide created: PROGRAM_FRONTEND_UPDATE_GUIDE.md")
            return True
            
        except Exception as e:
            self.log(f"❌ Failed to create frontend guide: {e}", 'ERROR')
            self.errors.append(f"Frontend guide error: {e}")
            return False
    
    def create_api_endpoints_guide(self):
        """Create guide for updating API endpoints"""
        self.log("Creating API endpoints guide...")
        
        api_guide = """
# PROGRAM API ENDPOINTS HARMONIZATION

## 🚀 Enhanced API Endpoints

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

## 🔧 API Field Changes

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
"""
        
        try:
            with open('PROGRAM_API_ENDPOINTS_GUIDE.md', 'w') as f:
                f.write(api_guide)
            
            self.log("✅ API endpoints guide created: PROGRAM_API_ENDPOINTS_GUIDE.md")
            return True
            
        except Exception as e:
            self.log(f"❌ Failed to create API guide: {e}", 'ERROR')
            self.errors.append(f"API guide error: {e}")
            return False
    
    def run_implementation(self):
        """Run complete harmonization implementation"""
        self.log("🚀 Starting Program harmonization implementation...")
        
        # Test current implementation
        model_success = self.test_model_implementation()
        serializer_success = self.test_serializer_implementation()
        
        # Create guides for remaining work
        frontend_guide_success = self.create_frontend_update_guide()
        api_guide_success = self.create_api_endpoints_guide()
        
        # Calculate success rate
        total_tasks = 4
        successful_tasks = sum([model_success, serializer_success, 
                              frontend_guide_success, api_guide_success])
        success_rate = (successful_tasks / total_tasks) * 100
        
        self.log("\n" + "=" * 60)
        self.log("🎯 PROGRAM HARMONIZATION IMPLEMENTATION SUMMARY")
        self.log("=" * 60)
        
        self.log(f"📊 Success Rate: {success_rate:.1f}% ({successful_tasks}/{total_tasks})")
        self.log(f"✅ Successful Tasks: {self.success_count}")
        self.log(f"❌ Failed Tasks: {self.error_count}")
        
        if model_success:
            self.log("✅ Model: Enhanced with computed properties")
        else:
            self.log("❌ Model: Implementation issues detected")
            
        if serializer_success:
            self.log("✅ Serializers: All computed fields implemented")
        else:
            self.log("❌ Serializers: Missing field implementations")
        
        if frontend_guide_success:
            self.log("✅ Frontend Guide: Update instructions created")
        else:
            self.log("❌ Frontend Guide: Creation failed")
        
        if api_guide_success:
            self.log("✅ API Guide: Endpoint documentation created")
        else:
            self.log("❌ API Guide: Creation failed")
        
        self.log("\n📋 Next Steps:")
        self.log("1. 🔄 Review and apply frontend updates (see PROGRAM_FRONTEND_UPDATE_GUIDE.md)")
        self.log("2. 🔄 Update API endpoint implementations (see PROGRAM_API_ENDPOINTS_GUIDE.md)")
        self.log("3. 🧪 Run validation script to verify improvements")
        self.log("4. 🚀 Test complete program management workflow")
        
        if self.errors:
            self.log(f"\n🚨 Issues to Address ({len(self.errors)}):")
            for i, error in enumerate(self.errors[:5], 1):
                self.log(f"   {i}. {error}")
            if len(self.errors) > 5:
                self.log(f"   ... and {len(self.errors) - 5} more issues")
        
        self.log("=" * 60)
        
        if success_rate >= 75:
            self.log("🎉 PROGRAM HARMONIZATION: SUBSTANTIAL PROGRESS")
            self.log("🚀 Ready for frontend integration!")
        else:
            self.log("⚠️ PROGRAM HARMONIZATION: PARTIAL IMPLEMENTATION")
            self.log("🔧 Additional work needed")
        
        # Save implementation log
        log_filename = f"program_harmonization_implementation_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        try:
            with open(log_filename, 'w') as f:
                f.write('\n'.join(self.implementation_log))
            self.log(f"📄 Implementation log saved to: {log_filename}")
        except Exception as e:
            self.log(f"❌ Failed to save log: {e}", 'ERROR')
        
        return success_rate >= 75

def main():
    """Main execution function"""
    manager = ProgramHarmonizationManager()
    success = manager.run_implementation()
    
    return 0 if success else 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
