# PRODUCTION DEPLOYMENT - Parliament Fuel System

## ⚠️ IMPORTANT: PRODUCTION DEPLOYMENT CHECKLIST

### Pre-Deployment Safety Steps

#### 1. Create Full System Backup
```powershell
# Before deploying ANY extension to production:
# 1. Backup Business Central Database
# 2. Backup Application files
# 3. Document current system state
```

#### 2. Verify Production Environment
- ✅ Business Central Version: _______________
- ✅ Server Instance Name: _______________
- ✅ Current Extensions Count: _______________
- ✅ Available Object ID Range 50110-50149: _______________

#### 3. Test in Staging First (Highly Recommended)
```powershell
# Deploy to staging/test environment first
# Test all functionality before production deployment
```

## PRODUCTION DEPLOYMENT STEPS

### Step 1: Package Extension for Production

#### In VS Code:
1. **Open Extension Folder**: Already opened
2. **Ensure AL Language Extension is Installed**
3. **Package Extension**:
   - Press `Ctrl+Shift+P`
   - Type: `AL: Package`
   - Extension will be compiled to `.app` file

### Step 2: Deploy to Production BC Server

#### Access Business Central Administration Shell
```powershell
# Run as Administrator
# Navigate to BC installation directory (usually):
cd "C:\Program Files\Microsoft Dynamics 365 Business Central\[Version]\Service"

# Or use PowerShell module:
Import-Module "${env:ProgramFiles}\Microsoft Dynamics 365 Business Central\*\Service\NavAdminTool.ps1"
```

#### Deployment Commands
```powershell
# Replace [BC-INSTANCE] with your actual BC instance name
# Replace [PATH] with actual path to your .app file

# 1. PUBLISH the extension (uploads to server)
Publish-NAVApp -ServerInstance "[BC-INSTANCE]" -Path "C:\Users\Administrator\Documents\POZ\fuel_coupon_system\bc_extension\output\Parliament IT_Parliament Fuel System Lite_1.0.0.0.app"

# 2. SYNC the extension (creates database objects)
Sync-NAVApp -ServerInstance "[BC-INSTANCE]" -Name "Parliament Fuel System Lite" -Version "1.0.0.0"

# 3. INSTALL the extension (makes available to users)
Install-NAVApp -ServerInstance "[BC-INSTANCE]" -Name "Parliament Fuel System Lite" -Version "1.0.0.0"
```

### Step 3: Configure User Access

#### Method 1: Through Business Central Web Client
1. **Navigate to**: Business Central → Users
2. **Select User** → Permission Sets
3. **Add**: "Fuel Manager Objects" (50110)
4. **Set Profile**: "FUEL MANAGER"

#### Method 2: Through PowerShell
```powershell
# Assign permission set to user
New-NAVServerUserPermissionSet -ServerInstance "[BC-INSTANCE]" -UserName "[USERNAME]" -PermissionSetId "Fuel Manager Objects"

# Set user profile
Set-NAVServerUser -ServerInstance "[BC-INSTANCE]" -UserName "[USERNAME]" -ProfileId "FUEL MANAGER"
```

## PRODUCTION SAFETY MEASURES

### Object ID Verification
```powershell
# Verify our ID range (50110-50149) doesn't conflict
Get-NAVApplicationObjectProperty -ServerInstance "[BC-INSTANCE]" | Where-Object {$_.ObjectID -ge 50110 -and $_.ObjectID -le 50149}
```

### Rollback Plan (if issues occur)
```powershell
# Emergency rollback commands:
Uninstall-NAVApp -ServerInstance "[BC-INSTANCE]" -Name "Parliament Fuel System Lite" -Version "1.0.0.0"
Unpublish-NAVApp -ServerInstance "[BC-INSTANCE]" -Name "Parliament Fuel System Lite" -Version "1.0.0.0"
```

## POST-PRODUCTION VALIDATION

### Immediate Tests (within 15 minutes)
1. **Login Test**: User can access BC with new Role Center
2. **Page Loading**: All fuel management pages load without errors
3. **Basic Function**: Create one test fuel transaction
4. **Permission Test**: Verify user can access fuel functions

### Extended Validation (within 24 hours)
1. **Full Workflow Test**: Complete transaction approval process
2. **Reporting Test**: Generate fuel summary reports
3. **Integration Test**: Test Django integration setup (if used)
4. **Multi-User Test**: Multiple users accessing simultaneously

## PRODUCTION DEPLOYMENT SCHEDULE

### Recommended Timing
- **Best Time**: During maintenance window or low-usage hours
- **Avoid**: Peak business hours, month-end closing
- **Duration**: Allow 30-60 minutes for complete deployment and testing

### Communication Plan
1. **Notify Users**: 24 hours advance notice
2. **System Admin**: Present during deployment
3. **Support Available**: First 24 hours post-deployment

## PRODUCTION CONFIGURATION

### Update Your BC Instance Details
Update the launch.json with your actual production details:

```json
{
    "server": "http://[YOUR-BC-SERVER]",
    "serverInstance": "[YOUR-BC-INSTANCE-NAME]",
    "authentication": "Windows"  // or "UserPassword" if using BC user auth
}
```

### Common Production BC Instance Names
- BC (default)
- DynamicsNAV
- BusinessCentral
- [CompanyName]BC

## TROUBLESHOOTING PRODUCTION ISSUES

### Extension Won't Install
- Check BC version compatibility
- Verify object ID range availability
- Review BC event log for detailed errors

### Users Can't Access
- Confirm permission set assignment
- Verify profile assignment
- Check user licensing requirements

### Performance Issues
- Monitor SQL Server performance
- Review BC service resource usage
- Check for table locking issues

## SUPPORT CONTACTS
- **System Administrator**: _______________
- **Database Administrator**: _______________
- **Business Users Primary Contact**: _______________

---

## FINAL PRODUCTION CHECKLIST

Before proceeding with production deployment:

- [ ] Full system backup completed
- [ ] Staging environment tested successfully
- [ ] Business users notified
- [ ] Maintenance window scheduled
- [ ] Rollback plan documented
- [ ] System admin available for deployment
- [ ] Extension package (.app file) ready
- [ ] BC instance details confirmed
- [ ] User access plan prepared

**Only proceed when ALL items above are checked!**

---

*Extension: Parliament Fuel System Lite v1.0.0.0*  
*Target: Production Business Central Environment*  
*Deployment Date: _____________*  
*Deployed By: _____________*
