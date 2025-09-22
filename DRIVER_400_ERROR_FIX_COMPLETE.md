# Driver API 400 Bad Request Fix - Resolution Report

## Problem Summary
User reported 400 Bad Request error when creating drivers via POST to `/api/v1/drivers/`. The error response showed:
```
Error response: 400 
Object { license_expiry: (1) […] }
```

## Root Cause Analysis
The issue was a **field name mismatch** between frontend and backend:

### Frontend (Before Fix):
```tsx
const driverData = {
  ...values,
  license_expiry_date: values.license_expiry ? values.license_expiry.format('YYYY-MM-DD') : null,  // ❌ Wrong field name
  hire_date: values.hire_date ? values.hire_date.format('YYYY-MM-DD') : null,
  date_of_birth: values.date_of_birth ? values.date_of_birth.format('YYYY-MM-DD') : null
};
```

### Backend Expectation:
```python
class DriverSerializer(serializers.ModelSerializer):
    license_expiry = serializers.DateField(required=False, allow_null=True)  # ✅ Expects 'license_expiry'
```

**The Problem**: Frontend was sending `license_expiry_date` but backend expected `license_expiry`.

## Solution Applied

### Fix in Frontend:
**File:** `fuel-coupon-frontend/src/pages/subcenter/SubCenterManagement.tsx`

**Changed line 351 from:**
```tsx
license_expiry_date: values.license_expiry ? values.license_expiry.format('YYYY-MM-DD') : null,
```

**To:**
```tsx
license_expiry: values.license_expiry ? values.license_expiry.format('YYYY-MM-DD') : null,
```

## Testing Results

### Before Fix:
```
POST /api/drivers/ → 400 Bad Request
Error: { license_expiry: ["Date has wrong format. Use one of these formats instead: YYYY-MM-DD."] }
```

### After Fix:
```
POST /api/drivers/ → ✅ 201 Created
Response: {
  "id": 4,
  "first_name": "Test",
  "last_name": "Fixed Driver", 
  "license_expiry": "2025-12-31",
  "hire_date": "2024-01-01"
}
```

## Field Name Mapping Reference
| Frontend Form Field | API Field Name | Backend Model Field | Status |
|---------------------|----------------|-------------------- |--------|
| `license_expiry` | `license_expiry` | `license_expiry` | ✅ Fixed |
| `hire_date` | `hire_date` | `hire_date` | ✅ Correct |
| `date_of_birth` | `date_of_birth` | (optional) | ✅ Correct |

## Required Frontend Data Format
The frontend should send dates in **ISO format (YYYY-MM-DD)**:

```json
{
  "employee_id": "EMP001",
  "first_name": "John",
  "last_name": "Doe",
  "id_number": "12345678901",
  "license_number": "DL123456",
  "license_class": "CLASS_2",
  "license_expiry": "2025-12-31",
  "phone_number": "+263777123456",
  "email": "john.doe@parliament.zw",
  "address": "123 Main St, Harare",
  "status": "ACTIVE",
  "hire_date": "2024-01-01",
  "assigned_subcenter": 1
}
```

## Additional Validation Rules
- **Date Format**: Must be ISO format (`YYYY-MM-DD`)
- **Required Fields**: `employee_id`, `first_name`, `last_name`, `id_number`, `license_number`, `license_expiry`, `phone_number`, `address`, `hire_date`, `assigned_subcenter`
- **Unique Fields**: `employee_id`, `id_number`, `license_number`
- **Valid Choices**: `license_class` must be one of: `CLASS_1`, `CLASS_2`, `CLASS_3`, `CLASS_4`
- **Valid Choices**: `status` must be one of: `ACTIVE`, `INACTIVE`, `SUSPENDED`, `ON_LEAVE`

## Status: RESOLVED ✅

The driver creation form will now work correctly:
- ✅ Field names match between frontend and backend
- ✅ Date formatting is correct (YYYY-MM-DD)
- ✅ All validation passes successfully
- ✅ 201 Created response returned on success

**Expected Result**: Users can now successfully create drivers through the frontend form without receiving 400 Bad Request errors.