# 🚀 Upload Business Central Extension from VS Code

## Step-by-Step Upload Process

### 1. Verify VS Code Setup
✅ VS Code is now open in the bc_extension directory
✅ AL Language extension is installed
✅ Package Parliament-Fuel-System-1.0.0.0.app is ready

### 2. Configure Business Central Connection

**Option A: Cloud Sandbox (Recommended)**
1. Press `Ctrl + Shift + P` in VS Code
2. Type: `AL: Go!`
3. Select: `Your own sandbox`
4. Follow prompts to connect to Business Central online

**Option B: On-Premises Server**
1. Press `Ctrl + Shift + P`
2. Type: `AL: Go!`
3. Select: `Your own server`
4. Enter server details when prompted

### 3. Upload the Extension

**Method 1: Direct Publish**
1. Press `Ctrl + Shift + P`
2. Type: `AL: Publish`
3. Select the command
4. VS Code will compile and upload directly to BC

**Method 2: Upload Existing Package**
1. Press `Ctrl + Shift + P`
2. Type: `AL: Upload`
3. Select: `Parliament-Fuel-System-1.0.0.0.app`
4. Confirm upload

### 4. Monitor the Upload Process

Watch the VS Code terminal output for:
- ✅ Compilation success
- ✅ Upload progress
- ✅ Installation confirmation
- ❌ Any error messages

### 5. Verify Installation

After successful upload:
1. Open Business Central web client
2. Search: `Extension Management`
3. Look for: `Parliament Fuel Coupon System`
4. Status should show: `Installed`

## 🔧 If Connection Issues Occur

### Setup Business Central Development Environment:
1. `Ctrl + Shift + P` → `AL: Go!`
2. Choose connection type:
   - **Cloud**: Microsoft 365 Business Central
   - **On-Prem**: Local BC server
   - **Sandbox**: Development environment

### Authentication Steps:
1. Sign in with BC admin credentials
2. Select your tenant/environment
3. Grant VS Code necessary permissions

## 📱 Quick Commands Reference

| Action | Command |
|--------|---------|
| Connect to BC | `Ctrl + Shift + P` → `AL: Go!` |
| Publish Extension | `Ctrl + Shift + P` → `AL: Publish` |
| Package Extension | `Ctrl + Shift + P` → `AL: Package` |
| Download Symbols | `Ctrl + Shift + P` → `AL: Download symbols` |

## 🎯 Expected Output

Upon successful upload, you should see:
```
Starting...
Compiling...
Publishing...
Extension 'Parliament Fuel Coupon System' published successfully
Extension installed in environment: [Your Environment]
```

## 🚨 Troubleshooting

**If upload fails:**
1. Check internet connection
2. Verify BC credentials
3. Ensure you have admin rights
4. Try uploading the .app file manually via BC web client

**Ready to proceed with VS Code upload!** 🚀
