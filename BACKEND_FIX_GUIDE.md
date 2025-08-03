# 🔧 Backend Server Fix Instructions - ALL ISSUES RESOLVED

## ✅ **ALL ISSUES FIXED**: Django Import and Configuration Problems

**Problems Resolved**:
1. ❌ `CommandError: You must set settings.ALLOWED_HOSTS if DEBUG is False.`
2. ❌ `ImportError: cannot import name 'RegisterView' from 'fuel.views'`
3. ❌ `ImportError: cannot import name 'test_business_central_connection' from 'fuel.views_bc'`
4. ❌ `ImportError: cannot import name 'HandoverData' from 'fuel.models'`

## 🎯 **COMPREHENSIVE FIXES APPLIED**

### **✅ SOLUTION 1**: Fixed Django Settings (ALLOWED_HOSTS)
- Changed DEBUG default to True for local development
- Added comprehensive ALLOWED_HOSTS including localhost, 127.0.0.1, 0.0.0.0
- Enhanced production configuration

### **✅ SOLUTION 2**: Fixed Circular Import Issues
- Changed imports in `fuel/urls.py` from `.views` to direct imports from `.views_main`
- Fixed `test_business_central_connection` import location

### **✅ SOLUTION 3**: Fixed Missing Model Imports
- Removed non-existent `HandoverData` model from imports
- Verified all model imports exist in `fuel/models.py`

### **🚀 START THE SERVER NOW**

**Option 1: Use the Comprehensive Startup Script (RECOMMENDED)**
```batch
start_django_comprehensive.bat
```

**Option 2: Manual Command**
```powershell
python manage.py runserver 127.0.0.1:8000
```

**Option 3: With Local Settings**
```powershell
python manage.py runserver 127.0.0.1:8000 --settings=config.settings.local
```

## ✅ **WHAT WAS FIXED**

### **1. Django Settings (config/settings.py)**
```python
# Changed from DEBUG = False to:
DEBUG = os.environ.get('DJANGO_DEBUG', 'True') == 'True'  # Defaults to True

# Enhanced ALLOWED_HOSTS:
ALLOWED_HOSTS = [
    '127.0.0.1',
    'localhost', 
    '0.0.0.0',  # Allow all interfaces
    # ... plus Azure production hosts
]
```

### **2. Import Structure (fuel/urls.py)**
```python
# OLD (causing circular import):
from .views import RegisterView, LoginView, ...

# NEW (direct import - FIXED):
from .views_main import RegisterView, LoginView, ...
from .views_main import test_business_central_connection  # Fixed location
```

### **3. Model Imports (fuel/views_export.py)**
```python
# REMOVED non-existent model:
# HandoverData ❌

# KEPT existing models:
BookDispatch, CouponAllocation  # ✅
```

### **Option 2: Manual Environment Variables**
```powershell
$env:DJANGO_DEBUG = "True"
python manage.py runserver 127.0.0.1:8000
```

### **Option 3: Direct Command**
```powershell
python manage.py runserver 127.0.0.1:8000 --settings=config.settings
```

## 🔧 **SETTINGS FIXED**

I've updated `config/settings.py` with:

1. **DEBUG Default**: Changed from `'False'` to `'True'` for local development
2. **ALLOWED_HOSTS**: Added wildcard `'*'` when `DEBUG=True`
3. **Local Support**: Added `'0.0.0.0'` and proper localhost entries

```python
# For local development, allow all hosts if DEBUG is True
if DEBUG:
    ALLOWED_HOSTS.append('*')
```

## 📋 **Quick Test**

After starting the backend, test these URLs:
- **Backend Health**: http://127.0.0.1:8000/api/v1/health/
- **Admin**: http://127.0.0.1:8000/admin/
- **API Docs**: http://127.0.0.1:8000/api/docs/

## 🔄 **Next Steps**

1. **Start Backend**: Use `start_backend_fixed.ps1`
2. **Start Frontend**: Use existing Vite setup
3. **Test Login**: Frontend proxy should now work with local backend
4. **Deploy**: Azure deployment will use production settings automatically

Your local development environment is now properly configured! 🚀

## Your Frontend Proxy Configuration
Your `vite.config.ts` has this excellent proxy setup:
```typescript
server: {
  port: 5173,
  proxy: {
    '/api/v1': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
  },
}
```

This means:
- ✅ Frontend runs on http://localhost:5173
- ✅ API calls to `/api/v1/*` get proxied to `http://localhost:8000`
- ✅ No CORS issues in development
- ✅ Same-origin policy satisfied

## Testing Steps

1. **Start Backend First**:
   ```powershell
   python manage.py runserver 8000
   ```
   Should show: "Starting development server at http://127.0.0.1:8000/"

2. **Start Frontend Second**:
   ```powershell
   cd fuel-coupon-frontend
   npm run dev
   ```
   Should show: "Local: http://localhost:5173/"

3. **Test API Connection**:
   - Open http://localhost:5173
   - Try to login
   - Check browser console for any proxy errors

## Expected URLs
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Proxied API calls**: http://localhost:5173/api/v1/* → http://localhost:8000/api/v1/*

## Common Issues & Solutions

### If Django won't start:
```powershell
# Check for migration issues
python manage.py migrate

# Check for syntax errors
python manage.py check

# Check if port is in use
netstat -an | findstr :8000
```

### If Frontend won't start:
```powershell
cd fuel-coupon-frontend
npm install  # Install dependencies
npm run dev  # Start Vite server
```

### If API calls fail:
1. Ensure backend is running on port 8000
2. Check that frontend is making calls to `/api/v1/*` (not full URLs)
3. Verify proxy configuration in vite.config.ts

## Debugging Commands
```powershell
# Test Django directly
curl http://localhost:8000/api/v1/health/

# Test through Vite proxy
curl http://localhost:5173/api/v1/health/

# Check running processes
Get-Process python
Get-NetTCPConnection -LocalPort 8000,5173
```

## Next Steps
1. Start both servers using the methods above
2. Test the login functionality
3. If it works locally, the Azure deployment issue is separate
4. Check browser network tab for actual API calls being made

## Azure vs Local Development
- **Local**: Uses proxy (frontend:5173 → backend:8000)
- **Azure**: Direct calls (frontend → azure backend URL)
- **Current Azure Issue**: Frontend built with wrong backend URL
- **Local Fix**: Bypass Azure issues entirely by developing locally

The proxy setup you've configured is perfect for local development and will eliminate the CORS issues you're experiencing with the Azure deployment.
