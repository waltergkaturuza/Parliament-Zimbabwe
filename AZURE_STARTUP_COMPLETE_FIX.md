# 🚀 AZURE STARTUP COMMAND FIXES

## ❌ **Current Issues:**
1. SSH not accessible for debugging
2. Admin page might not be accessible
3. Potential startup script issues

## ✅ **SOLUTION: Multiple Startup Options**

### **Option 1: Update Startup Command in Azure Portal**

**Current Command:** `gunicorn config.wsgi:application`

**✅ RECOMMENDED COMMAND:**
```bash
bash startup_minimal.sh
```

**🔧 Steps to Fix:**
1. Go to Azure Portal → Your App Service
2. Configuration → General Settings
3. Change Startup Command to: `bash startup_minimal.sh`
4. Save and restart

### **Option 2: Alternative Startup Commands**

**🎯 Direct Gunicorn (if startup script fails):**
```bash
gunicorn config.wsgi:application --bind=0.0.0.0:8000 --workers=2 --timeout=300
```

**🎯 With Migrations:**
```bash
python manage.py migrate && python manage.py collectstatic --noinput && gunicorn config.wsgi:application --bind=0.0.0.0:8000
```

**🎯 Enhanced Startup:**
```bash
bash startup_enhanced.sh
```

## 🔑 **Admin Access Fix**

### **Default Admin Credentials Created:**
- **Username:** `admin`
- **Password:** `Parliament2024!`
- **URL:** `https://parliament-fuel-system.azurewebsites.net/admin/`

### **If Admin Still Not Accessible:**

**Option A: Create via Azure SSH Console:**
```bash
# Enable SSH in Azure Portal first
python manage.py createsuperuser
```

**Option B: Via Environment Variables in Azure:**
```bash
# Add these to Azure App Settings:
DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_PASSWORD=Parliament2024!
DJANGO_SUPERUSER_EMAIL=admin@parliament.gov.zw
```

## 🔧 **SSH Access Fix**

### **Enable SSH in Azure:**
1. Azure Portal → Your App Service
2. Development Tools → SSH
3. Go → This opens SSH console
4. If not available, add to startup script:

```bash
# Add to startup script
service ssh start
echo "root:Parliament2024!" | chpasswd
```

## 🌐 **Test URLs After Fix:**

- **Main App:** https://parliament-fuel-system.azurewebsites.net/
- **Admin:** https://parliament-fuel-system.azurewebsites.net/admin/
- **API:** https://parliament-fuel-system.azurewebsites.net/api/
- **Health:** https://parliament-fuel-system.azurewebsites.net/api/health/

## 🚨 **Emergency Commands**

**If app won't start, try in order:**

1. **Minimal Startup:**
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```

2. **Basic Gunicorn:**
   ```bash
   gunicorn config.wsgi:application
   ```

3. **Force Migration:**
   ```bash
   python manage.py migrate --run-syncdb && gunicorn config.wsgi:application
   ```

## 📋 **Current Configuration Status:**

✅ **WSGI Configuration:** Correct (`config.wsgi:application`)
✅ **Django Settings:** Production mode configured
✅ **Database:** PostgreSQL configured
✅ **Static Files:** Whitenoise configured
✅ **CORS:** Properly configured for frontend

## 🔄 **Immediate Action Required:**

1. **Update Azure Startup Command** to: `bash startup_minimal.sh`
2. **Restart the App Service**
3. **Test Admin Access** at `/admin/`
4. **Enable SSH** in Azure Portal if needed

**Your startup command structure is correct - the issue is likely in execution environment or missing admin user setup.**
