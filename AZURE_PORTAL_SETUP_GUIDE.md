# Azure Portal Setup Guide - Parliament of Zimbabwe
## Step-by-Step Azure AD App Registration for Dynamics 365 Integration

### Your Account Information
- **Tenant ID**: `086c4475-d0ef-4d2b-871c-4e078a083db5`
- **Admin Account**: `admin@parliamentzw.onmicrosoft.com`
- **Password**: [From your signup email]

---

## Step 1: Access Azure Portal

1. **Open Azure Portal**
   - Go to: https://portal.azure.com
   - Click "Sign in"

2. **Login with Your Admin Account**
   ```
   Email: admin@parliamentzw.onmicrosoft.com
   Password: [Your password from Microsoft signup email]
   ```

3. **Verify You're in the Correct Tenant**
   - Look at the top-right corner of Azure Portal
   - You should see "Parliament of Zimbabwe" or your tenant name
   - Tenant ID should be: `086c4475-d0ef-4d2b-871c-4e078a083db5`

---

## Step 2: Navigate to Azure Active Directory

1. **Find Azure Active Directory**
   - In the Azure Portal homepage
   - Look for "Azure Active Directory" in the main menu
   - OR use the search bar at the top and type "Azure Active Directory"
   - Click on it

2. **Verify Your Directory**
   - You should see "Parliament of Zimbabwe" as your directory name
   - The Overview page will show your tenant information

---

## Step 3: Create App Registration

1. **Navigate to App Registrations**
   - In the Azure AD menu (left sidebar)
   - Click "App registrations"
   - You'll see a list of registered applications (probably empty for new tenant)

2. **Create New Registration**
   - Click "New registration" button (top of page)
   - Fill in the registration form:

   ```
   Name: Parliament-Fuel-Coupon-BC-Integration
   
   Supported account types: 
   ✓ Select "Accounts in this organizational directory only (Parliament of Zimbabwe only - Single tenant)"
   
   Redirect URI:
   ✗ Leave this blank for now (we don't need it for service-to-service auth)
   ```

3. **Complete Registration**
   - Click "Register" button
   - Wait for the app to be created (should take a few seconds)

---

## Step 4: Copy Essential Information

After registration, you'll be taken to the app's Overview page. **IMMEDIATELY COPY THESE VALUES:**

### 📋 Copy These Values (You'll Need Them Later)

```
Application (client) ID: [Copy this GUID - it will look like: 12345678-1234-1234-1234-123456789012]

Directory (tenant) ID: 086c4475-d0ef-4d2b-871c-4e078a083db5 (already known)

Object ID: [This will be shown too, but you don't need it for our integration]
```

**📝 WRITE THESE DOWN NOW!** Keep them in a secure location.

---

## Step 5: Create Client Secret

1. **Navigate to Certificates & Secrets**
   - In your app registration page (left sidebar)
   - Click "Certificates & secrets"

2. **Create New Client Secret**
   - Click "New client secret"
   - Fill in the details:

   ```
   Description: Fuel Coupon System Integration Secret
   Expires: 12 months (recommended for initial setup)
   ```

3. **Copy the Secret Value**
   - Click "Add"
   - **IMMEDIATELY COPY THE SECRET VALUE!**
   - ⚠️ **WARNING**: This is your ONLY chance to copy this value!
   - It will look like: `abc123def456ghi789jkl012mno345pqr678stu901`

### 📋 Copy This Secret Value NOW:
```
Client Secret: [Paste the secret value here immediately after creation]
```

---

## Step 6: Configure API Permissions

1. **Navigate to API Permissions**
   - In your app registration (left sidebar)
   - Click "API permissions"
   - You'll see "Microsoft Graph" permission by default

2. **Add Business Central Permissions**
   - Click "Add a permission"
   - In the "Request API permissions" panel:

3. **Select Dynamics 365 Business Central**
   - Scroll down to find "Dynamics 365 Business Central"
   - Click on it

4. **Choose Application Permissions**
   - Click "Application permissions" (NOT Delegated permissions)
   - You'll see available permissions

5. **Select Required Permissions**
   - Check: `API.ReadWrite.All` (Full access to Business Central APIs)
   - Click "Add permissions"

6. **Grant Admin Consent**
   - Back on the API permissions page
   - Click "Grant admin consent for Parliament of Zimbabwe"
   - Confirm by clicking "Yes"
   - Wait for the status to show "Granted for Parliament of Zimbabwe" with green checkmarks

---

## Step 7: Verify Your Setup

Your API permissions should now show:

```
✅ Microsoft Graph
   - User.Read (Delegated) - Status: Granted

✅ Dynamics 365 Business Central  
   - API.ReadWrite.All (Application) - Status: Granted for Parliament of Zimbabwe
```

---

## Step 8: Test Azure AD Setup

You can test if your setup is working by trying to get an authentication token.

### Option A: Test with PowerShell (if available)
```powershell
# Test authentication (replace with your actual values)
$tenantId = "086c4475-d0ef-4d2b-871c-4e078a083db5"
$clientId = "your-client-id-here"
$clientSecret = "your-client-secret-here"

$body = @{
    grant_type = "client_credentials"
    client_id = $clientId
    client_secret = $clientSecret
    scope = "https://api.businesscentral.dynamics.com/.default"
}

$response = Invoke-RestMethod -Uri "https://login.microsoftonline.com/$tenantId/oauth2/v2.0/token" -Method Post -Body $body
$response.access_token
```

### Option B: We'll Test in Django Later
We can test the authentication when we configure the Django integration.

---

## ✅ Completion Checklist

Before moving to the next step, ensure you have:

- [ ] ✅ Successfully logged into Azure Portal
- [ ] ✅ Created app registration: "Parliament-Fuel-Coupon-BC-Integration"
- [ ] ✅ Copied Application (Client) ID
- [ ] ✅ Created and copied Client Secret
- [ ] ✅ Added Dynamics 365 Business Central API permissions
- [ ] ✅ Granted admin consent for the permissions
- [ ] ✅ Verified permissions show "Granted" status

---

## 🔐 Security Notes

**IMPORTANT SECURITY REMINDERS:**

1. **Keep Client Secret Secure**
   - Never share it via email or unsecured channels
   - Store it in a password manager
   - Don't commit it to code repositories

2. **Client Secret Rotation**
   - Set a calendar reminder to rotate the secret before it expires
   - Business Central will stop working if the secret expires

3. **Permissions Review**
   - The permissions we've granted allow full API access
   - This is necessary for the integration but should be monitored

---

## 📝 Your Configuration Values

Fill these in as you complete each step:

```
DYNAMICS_TENANT_ID=086c4475-d0ef-4d2b-871c-4e078a083db5
DYNAMICS_CLIENT_ID=[Your Client ID from Step 4]
DYNAMICS_CLIENT_SECRET=[Your Client Secret from Step 5]
```

---

## 🎯 Next Steps

Once you've completed the Azure Portal setup:

1. **✅ You've Completed**: Azure AD App Registration
2. **🔄 Next**: Business Central Environment Setup
3. **🔄 Then**: Configure Django Integration
4. **🔄 Finally**: Test the Complete Integration

---

## 🆘 Troubleshooting

### Common Issues:

**Can't find Azure Active Directory:**
- Use the search bar at the top of Azure Portal
- Type "Azure Active Directory" or "AAD"

**Don't see Dynamics 365 Business Central in API permissions:**
- Make sure you're looking under "APIs my organization uses"
- Search for "Dynamics" or "Business Central"

**Permission grant fails:**
- Ensure you're logged in as a Global Administrator
- Check that your account has permission to grant consent

**Can't create app registration:**
- Verify you have Application Administrator or Global Administrator role
- Check that app registrations are enabled in your tenant

---

Let me know when you've completed these steps, and I'll guide you through the Business Central environment setup next!
