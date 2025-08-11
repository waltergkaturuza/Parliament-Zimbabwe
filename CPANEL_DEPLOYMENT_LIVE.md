# 🚀 CPANEL DEPLOYMENT INSTRUCTIONS - PARLIAMENT.CO.ZW
## IMMEDIATE DEPLOYMENT GUIDE

## 🔐 **HOSTING CREDENTIALS (CONFIDENTIAL)**

### **Server Information**
- **Server IP:** 129.232.213.109
- **Control Panel:** http://129.232.213.109:2082/
- **Username:** parliam1
- **Password:** -7jkVEcvD34.S3
- **Domain:** parliament.co.zw

### **FTP/SSH Access**
- **FTP Host:** parliament.co.zw
- **Username:** parliam1
- **Password:** -7jkVEcvD34.S3

---

## 🚀 **DEPLOYMENT STEPS (15-30 MINUTES)**

### **Step 1: Access cPanel**
1. Open browser and navigate to: http://129.232.213.109:2082/
2. Login with:
   - Username: `parliam1`
   - Password: `-7jkVEcvD34.S3`

### **Step 2: Setup Database**
1. In cPanel, find "MySQL Databases"
2. Create database: `parliam1_fuel_system`
3. Create database user: `parliam1_fuel_user`
4. Set strong password for database user
5. Assign user to database with ALL PRIVILEGES

### **Step 3: Upload Code via Git**
1. In cPanel, find "Git Version Control"
2. Click "Create" to add repository
3. Repository URL: `https://github.com/waltergkaturuza/Parliament-Zimbabwe.git`
4. Repository Path: `fuel-system`
5. Branch: `main`
6. Click "Create"

### **Step 4: Setup Python Environment**
1. In cPanel, find "Python App"
2. Create new Python app:
   - Python version: 3.11
   - Application root: `fuel-system`
   - Application URL: `/` (root domain)
   - Application startup file: `passenger_wsgi.py`

### **Step 5: Configure Environment**
1. Access Terminal in cPanel or SSH
2. Navigate to application directory
3. Install dependencies:
   ```bash
   cd ~/fuel-system
   pip install -r requirements.txt
   ```

### **Step 6: Create Production Settings**
Create file `config/settings/cpanel.py`:
```python
from .base import *

DEBUG = False
ALLOWED_HOSTS = ['parliament.co.zw', 'www.parliament.co.zw', '129.232.213.109']

# Database configuration
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'parliam1_fuel_system',
        'USER': 'parliam1_fuel_user',
        'PASSWORD': 'YOUR_DB_PASSWORD',  # Set this
        'HOST': 'localhost',
        'PORT': '3306',
    }
}

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = '/home/parliam1/public_html/static/'

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = '/home/parliam1/public_html/media/'
```

### **Step 7: Deploy Application**
```bash
# Run migrations
python manage.py migrate --settings=config.settings.cpanel

# Collect static files
python manage.py collectstatic --noinput --settings=config.settings.cpanel

# Create superuser
python manage.py createsuperuser --settings=config.settings.cpanel
```

### **Step 8: Configure Passenger WSGI**
Create `passenger_wsgi.py` in root:
```python
import os
import sys

# Add project directory to path
sys.path.insert(0, os.path.dirname(__file__))

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.cpanel')

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
```

### **Step 9: Build and Deploy Frontend**
```bash
cd fuel-coupon-frontend
npm install
npm run build
cp -r dist/* ~/public_html/
```

---

## ✅ **POST-DEPLOYMENT CHECKLIST**

- [ ] Database created and configured
- [ ] Python environment setup
- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Static files collected
- [ ] Frontend built and deployed
- [ ] SSL certificate configured
- [ ] Domain pointing to server
- [ ] Admin user created
- [ ] System tested and working

---

## 🌐 **ACCESS URLS AFTER DEPLOYMENT**
- **Website:** http://www.parliament.co.zw
- **Admin Panel:** http://www.parliament.co.zw/admin
- **API:** http://www.parliament.co.zw/api

---

## 📞 **SUPPORT INFORMATION**
If you need assistance during deployment, your hosting provider's support can help with:
- Database setup
- Python environment configuration
- Domain propagation issues
- SSL certificate installation

**🎉 Your Parliament Fuel Coupon System will be LIVE within 30 minutes!**
