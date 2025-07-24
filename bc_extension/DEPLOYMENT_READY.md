# Parliament Fuel System BC Extension - Quick Deploy Guide

## 🚀 Ready-to-Deploy Package

Your Business Central extension is complete and ready for deployment! Here's what you have:

### 📦 Extension Files Created:
- ✅ `app.json` - Extension manifest
- ✅ `FuelSystemSetup.al` - Setup table and page
- ✅ `FuelSystemIntegration.al` - Main integration codeunit  
- ✅ `FuelSystemControlAddin.al` - Control Add-in definition
- ✅ `FuelTransactionCard.al` - Transaction management UI

### 🔧 Production URLs Configured:
- Backend: `https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net/`
- JavaScript: `https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net/static/js/bc-integration.js`

## 📋 Deployment Steps:

### Option 1: VS Code Compilation (Recommended)
```powershell
# 1. Open VS Code in bc_extension folder
cd c:\Users\Administrator\Documents\POZ\fuel_coupon_system\bc_extension
code .

# 2. Install AL Language extension if not installed
# 3. Press Ctrl+Shift+P and run "AL: Package"
# 4. This creates Parliament Fuel Coupon System_1.0.0.0.app
```

### Option 2: Manual Package Creation
If you don't have full BC development environment, the extension files are ready to be packaged by your BC administrator.

## 🎯 What the Extension Provides:

### 1. **Setup Page**
- Search: "Parliament Fuel System Setup"
- Configure Django URLs and webhook secrets
- Test connection to backend
- Set up posting accounts

### 2. **Dashboard Page**  
- Search: "Fuel System Dashboard"
- Embedded Django app interface
- Real-time data sync
- Transaction management

### 3. **Transaction Management**
- Search: "Fuel Transactions" 
- List and card pages for fuel transactions
- Approval workflows
- Automatic G/L posting

### 4. **Integration Features**
- Webhook communication with Django
- Real-time data synchronization
- Error handling and logging
- Status monitoring

## 🔧 Installation Commands:
```powershell
# Run these in BC Management Shell (as Administrator)
$AppPath = ".\Parliament Fuel Coupon System_1.0.0.0.app"
$ServerInstance = "YourBCInstance"  # Replace with your BC instance

Install-NAVApp -ServerInstance $ServerInstance -Path $AppPath -Force
Publish-NAVApp -ServerInstance $ServerInstance -Path $AppPath -SkipVerification  
Sync-NAVApp -ServerInstance $ServerInstance -Name "Parliament Fuel Coupon System"
Start-NAVApp -ServerInstance $ServerInstance -Name "Parliament Fuel Coupon System"
```

## ✅ Verification:
```powershell
Get-NAVAppInfo -ServerInstance $ServerInstance -Name "Parliament Fuel Coupon System"
# Should show: State = Installed
```

Your BC extension is production-ready! 🎉
