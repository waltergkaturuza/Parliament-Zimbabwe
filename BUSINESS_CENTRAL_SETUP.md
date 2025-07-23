# Business Central Integration Setup Guide

## Azure Environment Variables Required

To complete the Business Central integration, you need to configure these environment variables in your Azure Web App:

### 1. Business Central API Configuration
```
BC_TENANT_ID=your-azure-ad-tenant-id
BC_CLIENT_ID=your-business-central-app-registration-client-id
BC_CLIENT_SECRET=your-business-central-app-registration-secret
BC_ENVIRONMENT=Production
BC_COMPANY_ID=your-business-central-company-id
BC_BASE_URL=https://api.businesscentral.dynamics.com/v2.0/{tenant_id}/{environment}/api
```

### 2. Azure AD Authentication (if using SSO)
```
AZURE_AD_CLIENT_ID=your-azure-ad-app-client-id
AZURE_AD_CLIENT_SECRET=your-azure-ad-app-secret
AZURE_AD_TENANT_ID=your-azure-ad-tenant-id
```

## Setup Steps

### Step 1: Azure App Registration for Business Central
1. Go to Azure Portal > App Registrations
2. Create new registration or use existing
3. Add API permissions for Dynamics 365 Business Central
4. Generate client secret
5. Note down Client ID, Tenant ID, and Secret

### Step 2: Business Central API Setup
1. Open Business Central Admin Center
2. Go to Environments > Production
3. Enable API access
4. Create API pages/codeunits for fuel coupon operations
5. Note down Company ID and Base URL

### Step 3: Configure Azure Web App
1. Go to Azure Portal > App Services > parliament-fuel-system-*
2. Go to Configuration > Application Settings
3. Add the environment variables listed above
4. Restart the web app

### Step 4: Test Integration
1. Use Django admin to test BC connection
2. Test API endpoints with Swagger UI
3. Verify data sync between systems

## Next Steps
- [ ] Create Azure App Registration
- [ ] Configure Business Central API access
- [ ] Set environment variables in Azure
- [ ] Test BC integration
- [ ] Create admin user for Django
- [ ] Test full end-to-end workflow
