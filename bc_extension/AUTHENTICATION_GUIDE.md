# 🔐 Business Central AL Extension Authentication Guide
## Parliament of Zimbabwe Fuel Coupon System

### 🎯 **Best Authentication Method for Existing Projects**

## Option 1: VS Code AL Extension Authentication (Recommended)

### **Step-by-Step Authentication Process:**

1. **Open your existing extension in VS Code**
   ```bash
   cd bc_extension
   code .
   ```

2. **Clear any cached credentials first**
   - Press `Ctrl + Shift + P`
   - Type: `AL: Clear credentials cache`
   - Press Enter

3. **Configure connection settings**
   - Press `Ctrl + Shift + P` 
   - Type: `AL: Download symbols`
   - **This will prompt for authentication WITHOUT creating new project**

4. **When authentication dialog appears:**
   - Choose: **"Your own Business Central (Cloud)"**
   - Server URL: `https://businesscentral.dynamics.com`
   - Tenant ID: `086c4475-d0ef-4d2b-871c-4e078a083db5`
   - Environment: `Production`

5. **Sign in with your Business Central account**
   - Use your Microsoft 365/Azure AD credentials
   - Same account that has access to your BC environment

6. **Verify authentication success**
   - Symbols should download successfully
   - No "bcserver:7049" or "tenant=default" errors
   - Ready to publish extension

---

## Option 2: Manual Authentication Configuration

### **Create AL User Settings (Alternative Method):**

1. **Create user settings file**
   - Location: `%APPDATA%\Code\User\settings.json`
   - Add AL-specific settings:

```json
{
    "al.defaultTenant": "086c4475-d0ef-4d2b-871c-4e078a083db5",
    "al.defaultEnvironmentName": "Production",
    "al.defaultServer": "https://businesscentral.dynamics.com",
    "al.authentication": "AAD"
}
```

---

## Option 3: Azure CLI Pre-authentication (For Automation)

### **Pre-authenticate with Azure CLI:**

```powershell
# Install Azure CLI if not installed
winget install Microsoft.AzureCLI

# Login to Azure
az login --tenant 086c4475-d0ef-4d2b-871c-4e078a083db5

# Verify authentication
az account show
```

---

## ✅ **Recommended Workflow**

### **For Your Parliament Fuel System:**

1. **Use Option 1** (VS Code AL Extension) - most reliable
2. **Always use `AL: Download symbols`** instead of `AL: Go!`
3. **Keep your existing project structure** - don't let AL create new projects
4. **Cache credentials** - authenticate once, use multiple times

### **Authentication Persistence:**
- AL extension remembers credentials for 8-12 hours
- Stored securely in VS Code credential manager
- Automatically refreshes tokens when needed

---

## 🚫 **What NOT to Do:**

- ❌ Don't use `AL: Go!` (creates new projects)
- ❌ Don't use local/sandbox configurations for production
- ❌ Don't manually edit credential files
- ❌ Don't use on-premises server settings for cloud

---

## 🔧 **Troubleshooting Authentication Issues:**

### **If authentication fails:**
1. Clear credentials cache: `AL: Clear credentials cache`
2. Restart VS Code completely
3. Try authentication again with `AL: Download symbols`

### **If still getting "bcserver" errors:**
1. Delete `.alpackages` folder
2. Clear VS Code workspace cache
3. Restart and re-authenticate

### **If new windows keep opening:**
1. Don't use `AL: Go!`
2. Use `AL: Download symbols` only
3. Make sure you're in correct project folder

---

## 📋 **Quick Reference Commands:**

| Command | Purpose | Creates New Project? |
|---------|---------|---------------------|
| `AL: Go!` | Full project setup | ✅ YES (avoid) |
| `AL: Download symbols` | Get BC symbols only | ❌ NO (use this) |
| `AL: Publish` | Deploy extension | ❌ NO |
| `AL: Clear credentials cache` | Reset auth | ❌ NO |

---

## 🎯 **Your Production Configuration:**

- **Tenant ID**: `086c4475-d0ef-4d2b-871c-4e078a083db5`
- **Environment**: `Production`
- **Server**: `https://businesscentral.dynamics.com`
- **Authentication**: `AAD` (Azure Active Directory)
