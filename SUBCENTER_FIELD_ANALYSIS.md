# SubCenter Module Field Mapping Analysis

## Field Comparison - Frontend vs Backend

### 1. Basic SubCenter Interface (from api/subcenters.ts)
**Frontend expects:**
- id: string
- code: string
- name: string
- location: string
- is_active: boolean
- managed_by?: { id, username, first_name, last_name }
- created: string
- modified: string
- users_count?: number
- active_programs?: number
- distributed_coupons?: number
- capacity?: number

**Backend provides (SubCenterSerializer):**
✅ id: number (auto-convert to string)
✅ code: string
✅ name: string
✅ location: string
✅ is_active: boolean
✅ managed_by_details: SimpleUserSerializer
✅ created: string
✅ modified: string
✅ users_count: computed field
✅ active_programs: computed field
✅ distributed_coupons: computed field
✅ capacity: integer field

**Status:** ✅ ALIGNED

### 2. SubCenterMonitoring Interface
**Frontend expects (from SubCenterMonitoring.tsx):**
- id: string
- name: string
- code: string
- location: string
- manager: string
- contact: string
- email: string
- status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
- totalBooks: number
- booksUsed: number
- booksRemaining: number
- totalValueUSD: number
- totalValueZWG: number
- lastActivity: string
- performanceScore: number
- monthlyConsumptionUSD: number
- alerts: number
- coordinates?: { lat: number; lng: number }

**Backend provides (SubCenterMonitoringSerializer):**
✅ All fields implemented with proper mapping

**Field Name Mismatches:**
- Frontend: `manager` → Backend: `manager_name`
- Frontend: `contact` → Backend: `contact_number`
- Frontend: `totalBooks` → Backend: `total_books`
- Frontend: `booksUsed` → Backend: `books_used`
- Frontend: `booksRemaining` → Backend: `books_remaining`
- Frontend: `totalValueUSD` → Backend: `total_value_usd`
- Frontend: `totalValueZWG` → Backend: `total_value_zwg`
- Frontend: `lastActivity` → Backend: `last_activity`
- Frontend: `performanceScore` → Backend: `performance_score`
- Frontend: `monthlyConsumptionUSD` → Backend: `monthly_consumption_usd`
- Frontend: `alerts` → Backend: `alerts_count`

**Status:** ❌ FIELD NAME MISMATCHES

### 3. Additional Frontend Fields Found
Looking at different frontend pages, some expect additional fields:
- `contact_person` (from types/index.ts)
- `phone` (from types/index.ts)
- `status` with different values
- `created_at` / `updated_at` instead of `created` / `modified`

## Missing Backend Fields
1. Model missing: `contact_person`, `phone` (though contact_number exists)
2. Inconsistent datetime field naming
3. Different status enum values

## Recommendations
1. Add alias fields to serializers for camelCase compatibility
2. Standardize field naming across all frontend components
3. Add missing model fields if needed
4. Update frontend to use consistent field names
