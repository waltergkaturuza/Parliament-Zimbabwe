# 🏛️ PARLIAMENT FUEL SYSTEM - AZURE DEPLOYMENT FIX GUIDE

## 🚨 IMMEDIATE FIXES NEEDED

### 1. 🔧 AZURE STARTUP COMMAND
**Current:** `gunicorn config.wsgi:application`
**Change to:** `bash startup.sh`

**Steps in Azure Portal:**
1. Go to Configuration → General Settings
2. Change "Startup Command" to: `bash startup.sh`
3. Click Save
4. Restart the app

### 2. 📋 REQUIRED ENVIRONMENT VARIABLES
Set these in Azure Portal → Configuration → Application Settings:

```bash
DJANGO_SETTINGS_MODULE=config.settings.production
PYTHONPATH=/home/site/wwwroot
WEBSITES_PORT=8000
DJANGO_SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://user:pass@host:5432/dbname
DEBUG=False
ALLOWED_HOSTS=parliament-fuel-system.azurewebsites.net,*.azurewebsites.net
CORS_ALLOWED_ORIGINS=https://jolly-ocean-0e0dee90f.2.azurestaticapps.net
CORS_ALLOW_ALL_ORIGINS=False
```

### 3. 🔄 DEPLOYMENT TROUBLESHOOTING

**If startup.sh fails, use this simplified startup command:**
```bash
python manage.py collectstatic --noinput && python manage.py migrate --noinput && gunicorn --bind=0.0.0.0:8000 --workers=2 --timeout=600 --access-logfile=- --error-logfile=- config.wsgi:application
```

### 4. 🐛 DEBUGGING STEPS

**Check App Service Logs:**
1. Go to Monitoring → Log Stream
2. Look for errors during startup
3. Common issues:
   - Missing environment variables
   - Database connection failures
   - Static files not collected
   - Import errors

### 5. 🚀 QUICK DEPLOYMENT TEST

**Test locally first:**
```bash
# Set environment
set DJANGO_SETTINGS_MODULE=config.settings.production
set DEBUG=False

# Test Django
python manage.py check --deploy
python manage.py collectstatic --noinput
python manage.py migrate --dry-run

# Test startup
bash startup.sh
```

### 6. 🔗 FRONTEND CONNECTION FIX

**Update environment variable:**
```bash
VITE_API_BASE_URL=https://parliament-fuel-system.azurewebsites.net
```

**NOT:**
```bash
VITE_API_BASE_URL=https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net
```

### 7. 📊 HEALTH CHECK VERIFICATION

After deployment, test these URLs:
- https://parliament-fuel-system.azurewebsites.net/
- https://parliament-fuel-system.azurewebsites.net/api/health/
- https://parliament-fuel-system.azurewebsites.net/admin/

### 8. 🆘 EMERGENCY FALLBACK

If all else fails, use this minimal startup command:
```bash
gunicorn --bind=0.0.0.0:8000 --workers=1 --timeout=120 config.wsgi:application
```

---

## 🎯 PRIMARY ACTION ITEMS:

1. **IMMEDIATE:** Change Azure startup command to `bash startup.sh`
2. **URGENT:** Verify all environment variables are set
3. **CRITICAL:** Check App Service logs for specific errors
4. **IMPORTANT:** Update frontend API URL to correct domain

## 🔍 COMMON ERRORS & SOLUTIONS:

**Error: "ModuleNotFoundError"**
- Solution: Add `PYTHONPATH=/home/site/wwwroot`

**Error: "Database connection failed"**
- Solution: Verify `DATABASE_URL` is correctly set

**Error: "Static files not found"**
- Solution: Ensure `python manage.py collectstatic` runs in startup

**Error: "CORS blocked"**
- Solution: Update `CORS_ALLOWED_ORIGINS` with correct frontend URL

---

**NEXT STEP:** Update the Azure startup command and restart your app service!
