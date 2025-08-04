# AZURE 502 BAD GATEWAY - COMPLETE FIX GUIDE

## CRITICAL ISSUE
Your Django backend is returning 502 Bad Gateway errors because the application isn't starting properly.

## ROOT CAUSE ANALYSIS
1. **CORS Configuration Conflict**: `CORS_ALLOW_ALL_ORIGINS = True` + `CORS_ALLOW_CREDENTIALS = True` is invalid
2. **Missing Dependencies**: Some Python packages might not be installed
3. **Database Connection**: PostgreSQL connection issues
4. **Startup Command**: Wrong or missing startup command in Azure

## IMMEDIATE FIXES REQUIRED

### 1. Update Azure App Service Startup Command
Go to Azure Portal → Your App Service → Configuration → General Settings
**Change Startup Command to:**
```
bash startup_final.sh
```

### 2. Verify Environment Variables
Go to Azure Portal → Your App Service → Configuration → Application settings
**Ensure these are set:**
```
DJANGO_SETTINGS_MODULE = config.settings.production
DATABASE_URL = postgresql://[your-db-connection-string]
SECRET_KEY = [your-secret-key]
ALLOWED_HOSTS = parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net
```

### 3. Check Database Connection
In Azure Portal → PostgreSQL server → Connection security:
- Ensure "Allow access to Azure services" is ON
- Add your App Service IP to firewall rules

### 4. Deploy Fixed Files
Run these commands in your local terminal:
```bash
git add startup_final.sh config/settings/production.py
git commit -m "Fix 502 Bad Gateway - CORS and startup fixes"
git push origin main
```

### 5. Restart App Service
Go to Azure Portal → Your App Service → Overview → Restart

## DEBUGGING STEPS

### Step 1: Check App Service Logs
Go to Azure Portal → Your App Service → Monitoring → Log stream
Look for error messages during startup

### Step 2: SSH into App Service (if available)
Go to Azure Portal → Your App Service → Development Tools → SSH
Run:
```bash
cd /home/site/wwwroot
python manage.py check --deploy
```

### Step 3: Test Database Connection
```bash
python manage.py shell -c "from django.db import connection; connection.ensure_connection(); print('DB OK')"
```

## FIXED ISSUES IN THIS UPDATE

1. **CORS Configuration**: Fixed incompatible CORS settings that prevented startup
2. **Startup Script**: Created `startup_final.sh` with proper error handling
3. **Database Migrations**: Ensured migrations run before server starts
4. **Static Files**: Proper static file collection
5. **Dependencies**: Install requirements with no-cache to avoid corruption

## TESTING THE FIX

After applying all changes:

1. Wait 2-3 minutes for deployment
2. Test backend URL: `https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net/`
3. Should see Django homepage instead of 502 error
4. Test API endpoint: `https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net/api/`
5. Test admin: `https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net/admin/`

## FRONTEND CONNECTION

Once backend is working:
1. Frontend should automatically connect
2. CORS is configured for: `https://jolly-ocean-0e0dee90f.2.azurestaticapps.net`
3. Test login and API calls

## IF STILL FAILING

1. Check Azure App Service logs for specific error messages
2. Verify all environment variables are correctly set
3. Check PostgreSQL server status and connection
4. Contact Azure support if infrastructure issues persist

## EMERGENCY CONTACT
If critical system failure persists, escalate to Azure technical support with:
- App Service name: parliament-fuel-system-d0bvbjfrdbepdrfh
- Error: 502 Bad Gateway
- This troubleshooting guide

---
**Status**: Ready for deployment
**Priority**: CRITICAL - Production system down
**ETA**: 5-10 minutes after applying fixes
