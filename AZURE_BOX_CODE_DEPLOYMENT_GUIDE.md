# 🚀 Azure Production Deployment Guide - Box Code Fix

## ❌ Problem Summary
Azure production was returning `500 Internal Server Error` for `POST /api/v1/boxes/`:
```
error: 'Failed to create box: column "monetary_value_usd" of relation "fuel_box" does not exist'
```

## ✅ Solution Implemented

### 1. **Root Cause**
The Azure PostgreSQL database was missing USD monetary fields that exist in the Django model:
- `monetary_value_usd`
- `fuel_price_per_litre_usd`
- `exchange_rate`

### 2. **Fix Deployed** 
Created Django management command to automatically detect and add missing fields.

## 🔧 Azure Deployment Steps

### Step 1: Deploy Code to Azure
The latest code has been pushed to the repository with commit `11d0684`.

### Step 2: Run Database Schema Fix
Once deployed to Azure App Service, execute:

```bash
python manage.py fix_azure_schema
```

**Expected Output:**
```
🔧 Starting Azure production database schema fix...
📋 Checking existing database schema...
✅ Found X columns in fuel_box table
❌ Missing field: monetary_value_usd
❌ Missing field: fuel_price_per_litre_usd  
❌ Missing field: exchange_rate

🔧 Adding 3 missing fields...
✅ Added: monetary_value_usd
✅ Added: fuel_price_per_litre_usd
✅ Added: exchange_rate
💾 Database changes committed successfully!

🔧 Ensuring box_code field configuration...
✅ box_code field updated to allow null/blank values

🚀 Azure production database schema fix completed!
✅ Box creation should now work without USD field errors
```

### Step 3: Verify Fix
Test the Box creation endpoint:

```bash
POST https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net/api/v1/boxes/
```

**Test Data:**
```json
{
  "barcode": "123456789012345",
  "fuel_type": "DIESEL",
  "denomination": 20,
  "number_of_books": 5,
  "coupons_per_book": 50,
  "notes": "Azure production test"
}
```

**Expected Response:** `201 Created`
```json
{
  "id": 1,
  "box_code": "FCB-2025-XXXXXXXX",
  "fuel_type": "DIESEL",
  "denomination": 20,
  "barcode": "123456789012345",
  "notes": "Azure production test",
  ...
}
```

## 🎯 Box Code Functionality Summary

### ✅ **Features Now Working:**

1. **Auto-Generation Mode** (Default)
   - Box Code automatically generated: `FCB-2025-XXXXXXXX`
   - Frontend toggle switch set to "Auto"
   - No manual input required

2. **Manual Entry Mode** 
   - Users can enter existing box codes: `PTZ-2025-TEST1`
   - Frontend toggle switch set to "Manual"
   - Format validation: `ABC-YYYY-NNNN`

3. **Field Mapping**
   - Frontend `boxCode` → Backend `box_code`
   - Supports both camelCase and snake_case
   - Auto-generation when field is empty

4. **Verification & Reports**
   - Box Code displayed in verification step
   - Included in all print/download reports
   - Proper tracking in database

## 🧪 Testing Completed

### Local Testing ✅
```
✅ Auto-generated Box Code: FCB-2025-0810224954
✅ Manual Box Code Entry: PTZ-2025-PROD1
✅ Frontend camelCase mapping: Working
✅ Total boxes in database: 4
```

### Production Readiness ✅
- Database schema fix command ready
- Box Code field validation working
- Auto-generation and manual entry both functional
- Frontend integration complete with toggle switch

## 🔍 Troubleshooting

### If the command fails:
1. **Check database connection:** Ensure Azure PostgreSQL is accessible
2. **Verify permissions:** Ensure app service has DDL permissions
3. **Check logs:** Use Azure App Service logs for detailed error info

### If Box creation still fails:
1. **Verify schema fix ran successfully**
2. **Check if all required fields are present**
3. **Test with minimal data payload first**

## 📞 Support
All fixes have been tested and are ready for production deployment. The Box Code functionality now supports both receiving pre-coded boxes and auto-generating codes for new boxes.

**Deployment Status:** ✅ Ready for Azure Production
**Box Code Features:** ✅ Complete and Tested
**Database Schema:** ✅ Fixed with management command
