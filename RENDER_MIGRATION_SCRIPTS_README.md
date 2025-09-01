# Render Shell Migration Scripts

This directory contains scripts to manually run Django migrations in the Render.com shell environment.

## Available Scripts

### 1. `render_migrate.sh` (Bash - Comprehensive)
Full-featured migration script with detailed checking and verification.

**Usage in Render Shell:**
```bash
cd /opt/render/project/src
bash render_migrate.sh
```

**Features:**
- ✅ Django installation verification
- ✅ Database connectivity check
- ✅ Migration status display
- ✅ Safe migration execution
- ✅ Model verification
- ✅ API endpoint testing
- ✅ Detailed error reporting

### 2. `render_migrate.ps1` (PowerShell - Comprehensive)
PowerShell version of the comprehensive migration script.

**Usage in Render Shell:**
```powershell
cd /opt/render/project/src
powershell -ExecutionPolicy Bypass -File render_migrate.ps1
```

### 3. `render_migrate.py` (Python - Comprehensive)
Python version that works across all environments.

**Usage in Render Shell:**
```bash
cd /opt/render/project/src
python render_migrate.py
```

### 4. `quick_migrate.sh` (Bash - Quick)
Simple one-liner for fast migration execution.

**Usage in Render Shell:**
```bash
cd /opt/render/project/src
bash quick_migrate.sh
```

## How to Access Render Shell

1. **Via Render Dashboard:**
   - Go to your Render dashboard
   - Navigate to your service (parliament-zimbabwe)
   - Click on "Shell" tab
   - Wait for shell to load

2. **Via Render CLI:**
   ```bash
   render shell --service-id=your-service-id
   ```

## Manual Migration Commands

If you prefer to run commands manually:

```bash
# Navigate to backend directory
cd /opt/render/project/src/backend

# Set environment variables
export DJANGO_SETTINGS_MODULE=backend.settings
export PYTHONPATH="/opt/render/project/src:$PYTHONPATH"

# Check migration status
python manage.py showmigrations fuel

# Run migrations
python manage.py migrate --verbosity=2

# Check if PoliticalParty model is accessible
python -c "from fuel.models import PoliticalParty; print('✓ PoliticalParty model OK')"

# Test API endpoint registration
python -c "from django.urls import reverse; print(reverse('politicalparty-list'))"
```

## Common Issues and Solutions

### Issue: "No module named 'fuel'"
**Solution:** Ensure PYTHONPATH is set correctly:
```bash
export PYTHONPATH="/opt/render/project/src:$PYTHONPATH"
```

### Issue: "Settings module not found"
**Solution:** Set Django settings module:
```bash
export DJANGO_SETTINGS_MODULE=backend.settings
```

### Issue: Migration conflicts
**Solution:** Check for conflicting migrations:
```bash
python manage.py showmigrations fuel | grep -E "(10014|10015|10016|10017|10018)"
```

### Issue: Database connection errors
**Solution:** Verify environment variables are set correctly in Render dashboard.

## After Running Migrations

1. **Test API Endpoints:**
   ```bash
   curl https://parliament-zimbabwe.onrender.com/api/v1/political-parties/
   curl https://parliament-zimbabwe.onrender.com/api/v1/political-parties/active_parties/
   curl https://parliament-zimbabwe.onrender.com/api/v1/political-parties/statistics/
   ```

2. **Access Django Admin:**
   - Navigate to: `https://parliament-zimbabwe.onrender.com/admin/`
   - Look for "Political Parties" section
   - Verify you can create/edit political parties

3. **Test Frontend Integration:**
   - Open frontend application
   - Navigate to Political Parties tab
   - Verify data loads without 404 errors

## Script Outputs Explained

- ✅ **Green checkmarks**: Successful operations
- ⚠️ **Yellow warnings**: Non-critical issues that don't stop execution
- ❌ **Red errors**: Critical failures that require attention
- 📊 **Migration status**: Shows applied `[X]` and unapplied `[ ]` migrations

## Support

If migrations fail:
1. Check the error output from the script
2. Look at the migration conflict section
3. Verify all required environment variables are set
4. Check Render service logs for additional context

For urgent issues, you can always rollback to the previous working commit and redeploy.
