# Render Shell Migration Commands - Step by Step Guide

## 🎯 **QUICK START - For Render Shell**

### **Step 1: Access Render Shell**
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Find your service: `parliament-zimbabwe`
3. Click on the **Shell** tab
4. Wait for the shell to load (you'll see a command prompt)

### **Step 2: Run Migration Commands**

Copy and paste these commands **one by one** in the Render shell:

```bash
# Navigate to backend directory
cd /opt/render/project/src/backend

# Set Django environment variables
export DJANGO_SETTINGS_MODULE=backend.settings
export PYTHONPATH="/opt/render/project/src:$PYTHONPATH"

# Check current migration status
python manage.py showmigrations fuel

# Run migrations with verbose output
python manage.py migrate --verbosity=2

# Check final status (last 5 migrations)
python manage.py showmigrations fuel | tail -5
```

### **Step 3: Verify Success**

After running migrations, verify everything works:

```bash
# Test that PoliticalParty model is accessible
python -c "from fuel.models import PoliticalParty; print('✓ PoliticalParty model OK')"

# Test API endpoint registration
python -c "from django.urls import reverse; print('✓ API endpoint:', reverse('politicalparty-list'))"
```

## 🔧 **Alternative: Use Our Scripts**

Instead of manual commands, you can use the scripts we created:

```bash
# Option 1: Quick migration (simple)
cd /opt/render/project/src
bash quick_migrate.sh

# Option 2: Comprehensive migration (detailed)
cd /opt/render/project/src
bash render_migrate.sh
```

## 📊 **Expected Output**

### **Migration Status Display:**
```
fuel
 [X] 0001_initial
 [X] 0002_add_missing_fields
 ...
 [X] 10017_merge_20250901_1204
 [X] 10018_politicalparty_and_more
```

### **Successful Migration Output:**
```
Operations to perform:
  Apply all migrations: admin, auth, contenttypes, fuel, sessions, token_blacklist
Running migrations:
  Applying fuel.10018_politicalparty_and_more... OK
```

### **Model Verification Output:**
```
✓ PoliticalParty model OK
✓ API endpoint: /api/v1/political-parties/
```

## ⚠️ **Common Issues & Solutions**

### **Issue: "No module named 'fuel'"**
```bash
export PYTHONPATH="/opt/render/project/src:$PYTHONPATH"
```

### **Issue: "Settings module not found"**
```bash
export DJANGO_SETTINGS_MODULE=backend.settings
```

### **Issue: Permission denied**
Make sure you're in the correct directory:
```bash
cd /opt/render/project/src/backend
pwd  # Should show: /opt/render/project/src/backend
```

## 🏠 **For Local Development (Windows)**

If you want to run these locally on Windows, use:

```powershell
# Navigate to backend
cd "C:\Users\Administrator\Parliament-Zimbabwe\backend"

# Set environment variables (PowerShell)
$env:DJANGO_SETTINGS_MODULE="backend.settings"
$env:PYTHONPATH="C:\Users\Administrator\Parliament-Zimbabwe;$env:PYTHONPATH"

# Run commands (if Python environment is properly set up)
python manage.py showmigrations fuel
python manage.py migrate --verbosity=2
```

## 🚀 **After Migration Success**

### **Test API Endpoints:**
Open these URLs in your browser or use curl:

- `https://parliament-zimbabwe.onrender.com/api/v1/political-parties/`
- `https://parliament-zimbabwe.onrender.com/api/v1/political-parties/active_parties/`
- `https://parliament-zimbabwe.onrender.com/api/v1/political-parties/statistics/`

### **Test Django Admin:**
- Navigate to: `https://parliament-zimbabwe.onrender.com/admin/`
- Login with your admin credentials
- Look for "Political Parties" section

### **Test Frontend:**
- Open your frontend application
- Navigate to the Political Parties tab
- Verify it loads data without 404 errors

## 📝 **What These Commands Do**

1. **`cd /opt/render/project/src/backend`** - Navigate to Django project directory
2. **`export DJANGO_SETTINGS_MODULE=backend.settings`** - Tell Django which settings to use
3. **`export PYTHONPATH="/opt/render/project/src:$PYTHONPATH"`** - Make Python find your modules
4. **`python manage.py showmigrations fuel`** - Show migration status for fuel app
5. **`python manage.py migrate --verbosity=2`** - Apply all pending migrations with detailed output
6. **`python manage.py showmigrations fuel | tail -5`** - Show last 5 migrations to verify completion

## 🆘 **Need Help?**

If migrations fail:
1. Copy the error message
2. Check if the environment variables are set correctly
3. Verify you're in the right directory
4. Look for migration conflicts in the output
5. Use our comprehensive script for better error reporting: `bash render_migrate.sh`

---

**Ready to go?** 🚀 Just copy those commands into the Render shell!
