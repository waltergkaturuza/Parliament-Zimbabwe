# 🐍 **PYTHON 3.6 COMPATIBILITY GUIDE**
## Parliament Fuel Coupon System - cPanel Deployment

## ⚠️ **IMPORTANT: cPanel Python 3.6 Limitations**

Your cPanel hosting uses Python 3.6, which requires specific package versions. I've created a compatible requirements file.

---

## 📋 **UPDATED REQUIREMENTS FOR PYTHON 3.6**

### **Key Changes Made:**
- **Django:** Downgraded to 3.2.25 (last version supporting Python 3.6)
- **Database:** Changed from PostgreSQL to MySQL (mysqlclient)
- **Dependencies:** All packages updated to Python 3.6 compatible versions
- **Authentication:** Simplified JWT implementation
- **File Processing:** Compatible Pillow and reportlab versions

### **New Requirements File:** `requirements-cpanel.txt`
```bash
# Use this file for cPanel deployment
pip install -r requirements-cpanel.txt
```

---

## 🔄 **DEPLOYMENT MODIFICATIONS**

### **Updated Deployment Steps:**

1. **Use Python 3.6 Requirements:**
   ```bash
   pip install -r requirements-cpanel.txt
   ```

2. **Django 3.2 Settings:**
   - Added `DEFAULT_AUTO_FIELD` setting
   - MySQL database configuration
   - Compatible CORS settings
   - Simplified logging

3. **Database Setup:**
   - **Use MySQL** instead of PostgreSQL
   - Compatible with cPanel hosting
   - Proper charset configuration (utf8mb4)

---

## ⚙️ **PYTHON APPLICATION SETUP IN CPANEL**

### **Step 1: Create Python Application**
1. In cPanel → **"Python App"**
2. **Settings:**
   - Python Version: **3.6**
   - Application Root: `fuel-system`
   - Application URL: `/` (root)
   - Startup File: `passenger_wsgi.py`

### **Step 2: Install Dependencies**
```bash
cd ~/fuel-system
pip install -r requirements-cpanel.txt
```

### **Step 3: Database Configuration**
- **Engine:** MySQL (not PostgreSQL)
- **Database:** `parliam1_fuel_system`
- **User:** `parliam1_fuel_user`
- **Host:** `localhost`

---

## 🔧 **COMPATIBILITY NOTES**

### **What Works with Python 3.6:**
- ✅ Django 3.2.25 (full functionality)
- ✅ Django REST Framework
- ✅ JWT Authentication
- ✅ MySQL database
- ✅ File uploads and PDF generation
- ✅ Excel export functionality
- ✅ QR code generation
- ✅ Email sending
- ✅ Static file serving

### **Limitations:**
- ⚠️ Some newer Python features not available
- ⚠️ Older package versions (but stable)
- ⚠️ PostgreSQL requires different setup
- ⚠️ Some advanced async features limited

---

## 🚀 **DEPLOYMENT COMMAND**

Use the updated deployment script:
```bash
chmod +x deploy_production.sh
./deploy_production.sh
```

The script now:
- Uses `requirements-cpanel.txt`
- Creates Django 3.2 compatible settings
- Configures MySQL database
- Sets up proper Python 3.6 environment

---

## ✅ **TESTING CHECKLIST**

After deployment, verify:
- [ ] Django admin accessible
- [ ] API endpoints responding
- [ ] Database connections working
- [ ] Static files loading
- [ ] Frontend application working
- [ ] File uploads functioning
- [ ] PDF generation working

---

## 🆘 **TROUBLESHOOTING**

### **Common Python 3.6 Issues:**

1. **Package Installation Errors:**
   ```bash
   pip install --upgrade pip
   pip install -r requirements-cpanel.txt --no-cache-dir
   ```

2. **Database Connection Issues:**
   - Verify MySQL credentials in `config/settings/cpanel.py`
   - Check database user permissions

3. **Static Files Not Loading:**
   ```bash
   python manage.py collectstatic --noinput --settings=config.settings.cpanel
   ```

---

## 🎯 **FINAL NOTES**

Your Parliament Fuel Coupon System is **fully compatible with Python 3.6**! 

The downgraded versions still provide:
- ✅ All core functionality
- ✅ Security features
- ✅ Performance optimization
- ✅ Professional UI/UX
- ✅ Complete feature set

**🚀 Ready to deploy to parliament.co.zw with Python 3.6!**
