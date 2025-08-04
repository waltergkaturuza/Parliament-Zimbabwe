# 🏛️ AZURE SSH ACCESS & ADMIN PAGE FIX

## 🚨 ISSUE: SSH Not Running + Admin Page Inaccessible

### **🔧 ENABLE SSH ACCESS TO AZURE APP SERVICE**

#### **Method 1: Enable SSH via Azure Portal**
1. Go to Azure Portal → parliament-fuel-system
2. Navigate to **Development Tools** → **SSH**
3. Click **"Go"** to open SSH console
4. If SSH is disabled, enable it in Configuration

#### **Method 2: Enable SSH via Kudu Console**
1. Go to: `https://parliament-fuel-system.scm.azurewebsites.net/`
2. Click **Debug Console** → **CMD** or **PowerShell**
3. Navigate to `/site/wwwroot`
4. Check startup logs

#### **Method 3: Azure CLI (if logged in)**
```bash
az webapp ssh --resource-group parliament-fuel-rg --name parliament-fuel-system
```

### **🔍 IMMEDIATE DIAGNOSTICS**

#### **Check App Service Status:**
1. Azure Portal → parliament-fuel-system → **Overview**
2. Look at **Status**: Should be "Running"
3. Check **URL**: https://parliament-fuel-system.azurewebsites.net/

#### **View Application Logs:**
1. Go to **Monitoring** → **Log Stream**
2. Look for startup errors
3. Check for Django/Python errors

### **🚀 QUICK FIXES TO TRY**

#### **Fix 1: Update Startup Command**
Azure Portal → Configuration → General Settings:
```bash
# Change startup command to:
bash startup-simple.sh
```

#### **Fix 2: Set Required Environment Variables**
Configuration → Application Settings → Add:
```bash
DJANGO_SETTINGS_MODULE=config.settings.production
DATABASE_URL=postgresql://user:pass@host:5432/dbname
PYTHONPATH=/home/site/wwwroot
WEBSITES_PORT=8000
SCM_DO_BUILD_DURING_DEPLOYMENT=true
```

#### **Fix 3: Restart App Service**
1. Overview → **Restart**
2. Wait 2-3 minutes
3. Test: https://parliament-fuel-system.azurewebsites.net/admin/

### **🐛 COMMON STARTUP FAILURES**

#### **Error: "Application didn't respond"**
**Solution:** Wrong startup command
- Use `bash startup-simple.sh` instead of `gunicorn config.wsgi:application`

#### **Error: "Module not found"**
**Solution:** Missing PYTHONPATH
- Set `PYTHONPATH=/home/site/wwwroot`

#### **Error: "Database connection failed"**
**Solution:** Missing DATABASE_URL
- Set your PostgreSQL connection string

#### **Error: "Static files not found"**
**Solution:** Static files not collected
- Startup script runs `collectstatic` automatically

### **📋 ADMIN PAGE ACCESS CHECKLIST**

Before accessing admin, ensure:
1. ✅ App Service is **Running**
2. ✅ Django is **Started** (check logs)
3. ✅ Database is **Connected**
4. ✅ Static files are **Collected**
5. ✅ Admin user **Exists**

### **🔐 CREATE ADMIN USER (via SSH)**
Once SSH is working, run:
```bash
cd /home/site/wwwroot
python manage.py createsuperuser
```

### **🌐 TEST URLS**
After fixes, test these:
1. **Health Check:** https://parliament-fuel-system.azurewebsites.net/
2. **Admin Login:** https://parliament-fuel-system.azurewebsites.net/admin/
3. **API Health:** https://parliament-fuel-system.azurewebsites.net/api/health/

### **⚡ EMERGENCY MINIMAL STARTUP**
If all else fails, use this minimal startup command:
```bash
pip install django psycopg2-binary gunicorn && python manage.py migrate --noinput && gunicorn config.wsgi:application --bind=0.0.0.0:8000
```

## 🎯 IMMEDIATE ACTION PLAN:

1. **Check App Service Status** in Azure Portal
2. **View Log Stream** for specific errors
3. **Update startup command** to `bash startup-simple.sh`
4. **Set DATABASE_URL** environment variable
5. **Restart** App Service
6. **Test admin page** access

Your SSH access should work once the app starts properly! 🚀
