# Parliament Fuel System - Complete Deployment Guide

## Overview
This guide walks you through deploying the Parliament Fuel System Lite extension to Business Central.

## Prerequisites ✅
- [x] VS Code installed (version 1.102.2 detected)
- [x] Extension is symbol-free (no external dependencies)
- [x] All AL files validated and error-free
- [x] Permission sets and profiles configured

## Deployment Options

### Option 1: VS Code Extension Packaging (Recommended)

#### Step 1: Open Project in VS Code
```powershell
# Navigate to the extension folder
cd "C:\Users\Administrator\Documents\POZ\fuel_coupon_system\bc_extension"

# Open in VS Code
code .
```

#### Step 2: Install AL Language Extension
1. In VS Code, press `Ctrl+Shift+X` to open Extensions
2. Search for "AL Language"
3. Install the Microsoft AL Language extension
4. Restart VS Code if prompted

#### Step 3: Package the Extension
1. Press `Ctrl+Shift+P` to open Command Palette
2. Type and select: `AL: Package`
3. The extension will be compiled into a `.app` file in the output folder

### Option 2: Command Line Compilation

#### Prerequisites
- AL Language extension installed in VS Code
- AL Compiler (alc.exe) available in PATH

#### Commands
```powershell
# Create output directory
mkdir output -Force

# Compile extension
alc.exe /project:"C:\Users\Administrator\Documents\POZ\fuel_coupon_system\bc_extension" /out:".\output"
```

## Business Central Deployment

### Step 1: Prepare Business Central Server
Ensure you have:
- Business Central Server running
- Administrator access to BC Management Shell
- Appropriate user permissions

### Step 2: Deploy Extension

#### Using Business Central Administration Shell
```powershell
# Open Business Central Administration Shell as Administrator

# Navigate to your .app file location
cd "C:\Users\Administrator\Documents\POZ\fuel_coupon_system\bc_extension\output"

# Publish the extension
Publish-NAVApp -ServerInstance "BC" -Path "Parliament IT_Parliament Fuel System Lite_1.0.0.0.app"

# Sync the extension (creates database objects)
Sync-NAVApp -ServerInstance "BC" -Name "Parliament Fuel System Lite"

# Install the extension (makes it available to users)
Install-NAVApp -ServerInstance "BC" -Name "Parliament Fuel System Lite"
```

#### Alternative: Using Business Central Admin Center (Cloud)
1. Navigate to Business Central Admin Center
2. Go to Environments → [Your Environment] → Apps
3. Upload the .app file
4. Install the extension

### Step 3: Configure User Access

#### Assign Permission Sets
```powershell
# In Business Central, go to:
# Users → [Select User] → User Permission Sets
# Add: "Fuel Manager Objects"
```

#### Set Role Center
```powershell
# In Business Central, go to:
# Users → [Select User] → Profile
# Set to: "FUEL MANAGER"
```

## Post-Deployment Validation

### Test Checklist
1. **Login Test**
   - User can login and sees Fuel Manager Role Center
   - Activities tiles display correctly

2. **Transaction Management**
   - Create new fuel transaction
   - Edit transaction details
   - Approve/reject transactions
   - View transaction lists and filters

3. **Setup Configuration**
   - Access Fuel Rates Setup
   - Update petrol/diesel rates
   - Configure Django integration URL

4. **Reporting**
   - Generate fuel summary reports
   - Apply filters (employee, department, date range)
   - View statistics

5. **Permissions**
   - Verify users can only access appropriate functions
   - Test with different user roles

## Troubleshooting

### Common Issues

#### "Extension not found" Error
- Verify the extension was published successfully
- Check spelling of extension name
- Ensure proper server instance name

#### Permission Denied
- Verify user has "Fuel Manager Objects" permission set
- Check if user profile is set to "FUEL MANAGER"
- Confirm user has necessary BC licenses

#### Pages Don't Load
- Check if all objects were synced properly
- Verify object IDs don't conflict with existing extensions
- Review compilation errors in AL output

#### Database Sync Errors
- Ensure no table conflicts with existing BC objects
- Check if ID range (50110-50149) is available
- Verify table permissions

### Rollback Procedure
```powershell
# If issues occur, rollback using:
Uninstall-NAVApp -ServerInstance "BC" -Name "Parliament Fuel System Lite"
Unpublish-NAVApp -ServerInstance "BC" -Name "Parliament Fuel System Lite" -Version "1.0.0.0"
```

## Next Steps

### Phase 1: Production Use
- Deploy to production environment
- Train users on the system
- Monitor usage and performance
- Collect feedback for improvements

### Phase 2: Enhanced Features (Future)
- Follow SYMBOL_MIGRATION_PLAN.md for adding BC integration
- Implement advanced approval workflows
- Add integration with standard BC modules
- Enhance reporting capabilities

## Support Information

### Extension Details
- **Name**: Parliament Fuel System Lite
- **Version**: 1.0.0.0
- **Publisher**: Parliament IT
- **ID Range**: 50110-50149
- **Type**: Symbol-free (On-Premise compatible)

### Key Objects
- **Tables**: Fuel Transaction Lite (50110), Fuel Rates Setup (50111)
- **Pages**: 6 pages including list, card, setup, and role center
- **Codeunits**: Integration (50110), Installation (50111)
- **Permissions**: Fuel Manager Objects (50110)
- **Profile**: FUEL MANAGER

## Deployment Complete! 🚀

Your Parliament Fuel System is ready for use. Users with the Fuel Manager role can now:
- Manage fuel transactions
- Configure fuel rates
- Generate reports
- Approve/reject fuel requests
- Monitor fuel usage statistics

For technical support or enhancement requests, contact Parliament IT Department.
