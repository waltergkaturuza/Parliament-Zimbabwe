# Parliament Fuel System - Azure 500 Error Fix Guide
# Comprehensive Manual Deployment Steps

## Current Problem
Your Azure App Service is returning 500 Internal Server Errors due to:
1. Database schema out of sync (missing `category_multiplier` column)
2. Migration issues in production
3. Possible CORS/middleware configuration issues

## Solution Options

### Option 1: Manual Azure Portal Deployment (Recommended)

1. **Login to Azure Portal**
   - Go to: https://portal.azure.com
   - Login with: admin@parliamentzw.onmicrosoft.com

2. **Find Your App Service**
   - Search for "parliament-fuel-system" in the search bar
   - Click on your App Service

3. **Deploy via VS Code / ZIP**
   - In your local project: create a zip file of the entire project
   - In Azure Portal: Go to App Service → Deployment Center
   - Choose "External Git" or "ZIP Deploy"
   - Upload your project

4. **Configure App Settings**
   - Go to App Service → Configuration → Application Settings
   - Add/Update these settings:
     ```
     DJANGO_SETTINGS_MODULE = config.settings.production
     PYTHONPATH = /home/site/wwwroot
     SCM_DO_BUILD_DURING_DEPLOYMENT = true
     WEBSITE_RUN_FROM_PACKAGE = 0
     ```

5. **Set Startup Command**
   - Go to App Service → Configuration → General Settings
   - Set Startup Command: `bash startup.sh`

6. **Restart the App**
   - Go to App Service → Overview
   - Click "Restart"

### Option 2: Fix Database Issues Directly

Since the main issue is the missing `category_multiplier` column, you can fix this by:

1. **Connect to Azure PostgreSQL directly**
   - Use Azure Cloud Shell or any PostgreSQL client
   - Connection details from your production.py:
     - Host: parliament-fuel-postgres.postgres.database.azure.com
     - Database: parliament-fuel-postgres
     - User: parliament_admin

2. **Run Database Fix SQL**
   ```sql
   -- Add missing column
   ALTER TABLE fuel_beneficiarycategory 
   ADD COLUMN IF NOT EXISTS category_multiplier DECIMAL(5,2) DEFAULT 1.0;

   -- Verify the column exists
   SELECT column_name, data_type, is_nullable, column_default
   FROM information_schema.columns
   WHERE table_name = 'fuel_beneficiarycategory'
   AND column_name = 'category_multiplier';
   ```

### Option 3: Azure CLI Commands (After Login)

If you can login to Azure CLI successfully:

```bash
# 1. Login with management scope
az login --scope https://management.core.windows.net//.default

# 2. Find your resource group
az webapp list --query "[?name=='parliament-fuel-system'].resourceGroup" --output tsv

# 3. Deploy (replace [RESOURCE_GROUP] with actual value)
az webapp up --name parliament-fuel-system --resource-group [RESOURCE_GROUP]

# 4. Configure settings
az webapp config appsettings set --name parliament-fuel-system --resource-group [RESOURCE_GROUP] --settings DJANGO_SETTINGS_MODULE="config.settings.production"

# 5. Set startup script
az webapp config set --name parliament-fuel-system --resource-group [RESOURCE_GROUP] --startup-file "startup.sh"

# 6. Restart
az webapp restart --name parliament-fuel-system --resource-group [RESOURCE_GROUP]
```

## Quick Test Commands

After deployment, test these endpoints:

1. **Health Check**: https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net/health/
2. **Home Page**: https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net/
3. **API Boxes**: https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net/api/v1/boxes/
4. **Admin Panel**: https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net/admin/

## Expected Results

After successful deployment:
- All endpoints should return HTTP 200 instead of 500
- Database should have the `category_multiplier` column
- API endpoints should return JSON data instead of error pages

## Troubleshooting

If still getting 500 errors:

1. **Check Logs**
   - Azure Portal → App Service → Log Stream
   - Or: `az webapp log tail --name parliament-fuel-system --resource-group [RESOURCE_GROUP]`

2. **Verify Database Connection**
   - Test with Azure Cloud Shell using psql

3. **Check Startup Script**
   - Ensure startup.sh is being executed
   - Verify Python dependencies are installed

## Files Modified in This Fix

1. `startup.sh` - Enhanced with database column fix
2. `config/settings/production.py` - Production settings verified
3. `requirements.txt` - Updated dependencies
4. Database schema - `category_multiplier` column added

## Next Steps

1. Choose one of the deployment options above
2. Deploy the updated code
3. Test all endpoints
4. Verify the 500 errors are resolved

The enhanced `startup.sh` script will automatically handle the database schema fixes during deployment.
