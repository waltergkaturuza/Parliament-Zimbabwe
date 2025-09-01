# 🚨 EMERGENCY RENDER SHELL COMMANDS - COPY THESE EXACTLY 🚨

## The Problem
The Python path in Render is not set correctly. The error `ModuleNotFoundError: No module named 'backend.settings'` 
means Python can't find the backend module.

## ✅ CORRECTED COMMANDS - Copy/Paste These in Render Shell:

### Step 1: Navigate and Set Correct Python Path
```bash
cd /opt/render/project/src
export PYTHONPATH="/opt/render/project/src:/opt/render/project/src/backend:$PYTHONPATH"
export DJANGO_SETTINGS_MODULE="backend.settings"
```

### Step 2: Test Environment Setup
```bash
cd /opt/render/project/src/backend
python -c "import django; print(f'Django version: {django.get_version()}')"
python -c "from backend import settings; print('✅ Settings imported successfully')"
```

### Step 3: Run Migrations
```bash
python manage.py showmigrations fuel | tail -10
python manage.py migrate --verbosity=2
python manage.py showmigrations fuel | tail -5
```

### Step 4: Verify Models and APIs
```bash
python -c "from fuel.models import PoliticalParty; print('✅ PoliticalParty model accessible')"
python -c "from django.urls import reverse; print('✅ API endpoint:', reverse('politicalparty-list'))"
```

## 🔧 Alternative: One-Line Command Sequence

Copy this entire block and paste it in Render shell:

```bash
cd /opt/render/project/src && \
export PYTHONPATH="/opt/render/project/src:/opt/render/project/src/backend:$PYTHONPATH" && \
export DJANGO_SETTINGS_MODULE="backend.settings" && \
cd /opt/render/project/src/backend && \
echo "Testing setup..." && \
python -c "from backend import settings; print('✅ Settings OK')" && \
echo "Running migrations..." && \
python manage.py migrate --verbosity=2 && \
echo "Checking final status..." && \
python manage.py showmigrations fuel | tail -5 && \
echo "Testing models..." && \
python -c "from fuel.models import PoliticalParty; print('✅ PoliticalParty OK')" && \
echo "🎉 Migration completed successfully!"
```

## 🔍 What Was Wrong

The original PYTHONPATH was:
```bash
export PYTHONPATH="/opt/render/project/src:$PYTHONPATH"
```

The corrected PYTHONPATH is:
```bash
export PYTHONPATH="/opt/render/project/src:/opt/render/project/src/backend:$PYTHONPATH"
```

The key difference: We added `/opt/render/project/src/backend` to the path so Python can find the `backend.settings` module.

## 🎯 Expected Success Output

When the commands work correctly, you should see:

```
✅ Settings imported successfully
Operations to perform:
  Apply all migrations: admin, auth, contenttypes, fuel, sessions, token_blacklist
Running migrations:
  Applying fuel.10018_politicalparty_and_more... OK
✅ PoliticalParty model accessible
✅ API endpoint: /api/v1/political-parties/
```

## 🚀 After Success

Test these URLs:
- https://parliament-zimbabwe.onrender.com/api/v1/political-parties/
- https://parliament-zimbabwe.onrender.com/api/v1/political-parties/statistics/
- https://parliament-zimbabwe.onrender.com/admin/ (look for Political Parties)

---

**The fix is adding the backend directory to PYTHONPATH!** 🎯
