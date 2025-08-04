# 🆘 EMERGENCY SSH & ADMIN ACCESS FIX

## 🚨 IMMEDIATE ISSUE: App Service Not Starting → SSH Not Available → Admin Page Inaccessible

### **🔥 URGENT FIXES TO TRY RIGHT NOW:**

#### **1. Azure Portal - Change Startup Command**
1. Go to **Azure Portal** → **parliament-fuel-system**
2. **Configuration** → **General Settings**
3. **Startup Command** field: Change to `bash startup-with-ssh.sh`
4. **Save** → **Restart**

#### **2. Alternative Startup Commands (try in order):**
```bash
# Option A (recommended):
bash startup-with-ssh.sh

# Option B:
bash startup-simple.sh

# Option C (emergency):
python -m pip install -r requirements.txt && python manage.py migrate --noinput && gunicorn config.wsgi:application --bind=0.0.0.0:8000
```

#### **3. Essential Environment Variables**
**Configuration** → **Application Settings** → Add these:
```
DJANGO_SETTINGS_MODULE=config.settings.production
DATABASE_URL=postgresql://user:pass@host:5432/dbname
PYTHONPATH=/home/site/wwwroot
WEBSITES_PORT=8000
SCM_DO_BUILD_DURING_DEPLOYMENT=true
```

### **🔍 SSH ACCESS METHODS (once app starts):**

#### **Method 1: Browser SSH**
- URL: `https://parliament-fuel-system.scm.azurewebsites.net/webssh/host`
- Navigate: Azure Portal → Development Tools → SSH

#### **Method 2: Kudu Console**
- URL: `https://parliament-fuel-system.scm.azurewebsites.net/DebugConsole`
- Navigate: Azure Portal → Advanced Tools → Go

#### **Method 3: Azure CLI**
```bash
az webapp ssh --resource-group parliament-fuel-rg --name parliament-fuel-system
```

### **📋 DIAGNOSTIC CHECKLIST:**

#### **Check App Service Status:**
1. Azure Portal → parliament-fuel-system → **Overview**
2. Status should be **"Running"**
3. URL should respond: `https://parliament-fuel-system.azurewebsites.net/`

#### **View Startup Logs:**
1. **Monitoring** → **Log Stream**
2. Look for Django startup messages
3. Check for error messages

### **🔐 ADMIN PAGE ACCESS (after app starts):**

#### **Default Admin Credentials:**
- **URL:** `https://parliament-fuel-system.azurewebsites.net/admin/`
- **Username:** `admin`
- **Password:** `AdminPass2025!`

#### **Create New Admin (via SSH):**
```bash
cd /home/site/wwwroot
python manage.py createsuperuser
```

### **⚡ EMERGENCY FALLBACK:**

If nothing works, use this minimal startup command:
```bash
pip install django gunicorn psycopg2-binary && gunicorn config.wsgi:application --bind=0.0.0.0:8000 --timeout=300
```

### **🎯 SUCCESS INDICATORS:**

✅ **App Service Status:** Running  
✅ **Home Page:** https://parliament-fuel-system.azurewebsites.net/ loads  
✅ **SSH Access:** Console available via browser/CLI  
✅ **Admin Page:** https://parliament-fuel-system.azurewebsites.net/admin/ accessible  
✅ **API Health:** https://parliament-fuel-system.azurewebsites.net/api/health/ responds  

### **📞 IMMEDIATE ACTION PLAN:**

1. **Change startup command** to `bash startup-with-ssh.sh`
2. **Set DATABASE_URL** environment variable
3. **Restart** App Service
4. **Wait 3-5 minutes** for startup
5. **Test** home page and admin access
6. **Use SSH** for further debugging if needed

**Your app should be accessible after these fixes!** 🚀
