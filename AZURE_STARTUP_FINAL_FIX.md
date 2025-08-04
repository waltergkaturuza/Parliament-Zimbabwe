# 🎯 AZURE STARTUP COMMAND - FINAL FIX

## ✅ CONFIRMED: Production Settings Working!

Your `config/settings/production.py` file **IS** being loaded correctly! The test shows:
```
[PRODUCTION SETTINGS] Using config/settings/production.py file
✅ Django setup successful
DEBUG: False
```

## 🔧 AZURE PORTAL FIX STEPS:

### 1. **Change Startup Command**
In Azure Portal → parliament-fuel-system → Configuration → General Settings:

**Change from:** `gunicorn config.wsgi:application`
**Change to:** `bash startup-simple.sh`

### 2. **Required Environment Variables**
Set these in Configuration → Application Settings:

```bash
# Django Settings
DJANGO_SETTINGS_MODULE=config.settings.production
PYTHONPATH=/home/site/wwwroot

# Database (CRITICAL - this is what's missing!)
DATABASE_URL=postgresql://username:password@hostname:5432/database_name

# OR set individual database variables:
DATABASE_NAME=your_db_name
DATABASE_USER=your_db_user  
DATABASE_PASSWORD=your_db_password
DATABASE_HOST=your_db_host.postgres.database.azure.com

# Other required
WEBSITES_PORT=8000
PORT=8000
DEBUG=False
ALLOWED_HOSTS=parliament-fuel-system.azurewebsites.net,*.azurewebsites.net
```

### 3. **Alternative Startup Commands**
If `bash startup-simple.sh` doesn't work, try these in order:

**Option A:**
```bash
python -m pip install -r requirements.txt && python manage.py migrate --noinput && python manage.py collectstatic --noinput && gunicorn config.wsgi:application --bind=0.0.0.0:8000
```

**Option B:**
```bash
sh startup-simple.sh
```

**Option C:**
```bash
gunicorn config.wsgi:application --bind=0.0.0.0:8000 --timeout=300 --workers=2
```

## 🔍 DEBUGGING TIPS:

1. **Check Azure App Service Logs:**
   - Go to Monitoring → Log Stream
   - Look for Django startup messages

2. **Environment Variable Test:**
   - The error shows: "Missing required database environment variables"
   - This confirms Django is loading, just missing DB config

3. **Test URLs after fix:**
   - https://parliament-fuel-system.azurewebsites.net/
   - https://parliament-fuel-system.azurewebsites.net/admin/

## 🚀 SUMMARY:

1. ✅ **Production settings ARE working correctly**
2. ✅ **Django setup is successful**  
3. ❌ **Missing DATABASE_URL environment variable**
4. ❌ **Wrong startup command in Azure Portal**

**Fix the startup command + set DATABASE_URL = Your app will work!** 🎯
