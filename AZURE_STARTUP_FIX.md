# ========================================
# AZURE APP SERVICE STARTUP FIX
# ========================================

# PROBLEM: Azure App Service Configuration showing wrong startup command
# CURRENT (Wrong): gunicorn config.wsgi:application
# 
# SOLUTION: Use one of these correct startup commands:

# ----------------------------------------
# OPTION 1: Use Startup Script (RECOMMENDED)
# ----------------------------------------
# In Azure Portal Configuration > Startup Command, enter:
bash startup.sh

# ----------------------------------------
# OPTION 2: Direct Gunicorn Command
# ----------------------------------------
# In Azure Portal Configuration > Startup Command, enter:
gunicorn --bind=0.0.0.0:8000 --timeout=600 --workers=2 config.wsgi:application

# ----------------------------------------
# OPTION 3: Python Module
# ----------------------------------------
# In Azure Portal Configuration > Startup Command, enter:
python -m gunicorn config.wsgi:application --bind=0.0.0.0:8000

# ----------------------------------------
# AZURE PORTAL STEPS TO FIX:
# ----------------------------------------
1. Go to Azure Portal
2. Navigate to your App Service: parliament-fuel-system
3. Click on "Configuration" in left menu
4. In "Stack settings" section
5. Clear the current "Startup Command" field
6. Enter: bash startup.sh
7. Click "Save"
8. Go to "Overview" and click "Restart"

# ----------------------------------------
# ENVIRONMENT VARIABLES TO CHECK:
# ----------------------------------------
# Make sure these are set in Azure App Service Configuration > Application settings:

DJANGO_SETTINGS_MODULE=config.settings.production
WEBSITES_PORT=8000
PORT=8000
SCM_DO_BUILD_DURING_DEPLOYMENT=true
ENABLE_ORYX_BUILD=true

# ----------------------------------------
# IF STARTUP SCRIPT FAILS, TRY MINIMAL:
# ----------------------------------------
# Use this minimal startup command:
gunicorn config.wsgi --bind=0.0.0.0:8000

# ----------------------------------------
# DEBUGGING STEPS:
# ----------------------------------------
# 1. Check App Service Logs in Azure Portal
# 2. Go to Monitoring > Log stream
# 3. Look for startup errors
# 4. Check if requirements.txt is installing properly

# ----------------------------------------
# COMMON ISSUES & FIXES:
# ----------------------------------------
# Error: "No module named 'config'"
# Fix: Ensure PYTHONPATH includes /home/site/wwwroot

# Error: "Address already in use"
# Fix: Use $PORT environment variable instead of hardcoded port

# Error: "Application failed to start"
# Fix: Check Django settings are loading correctly
