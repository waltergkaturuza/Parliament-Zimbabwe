#!/bin/bash

echo "🚀 AZURE APP SERVICE CONFIGURATION FIX"
echo "======================================"

echo "❌ CURRENT PROBLEMS IDENTIFIED:"
echo "1. Wrong startup command in Azure: 'gunicorn config.wsgi:application'"
echo "2. Backend URL mismatch between frontend and actual deployment"
echo "3. CORS headers not working properly"
echo ""

echo "✅ REQUIRED FIXES:"
echo ""

echo "🔧 1. AZURE PORTAL CONFIGURATION CHANGES:"
echo "   Go to: Azure Portal > parliament-fuel-system > Configuration"
echo "   Change Startup Command from:"
echo "   ❌ OLD: gunicorn config.wsgi:application"
echo "   ✅ NEW: bash startup-simple.sh"
echo ""

echo "🔧 2. ALTERNATIVE STARTUP COMMANDS (if above fails):"
echo "   Option A: python -m gunicorn config.wsgi:application --bind=0.0.0.0:\$PORT"
echo "   Option B: ./startup.sh"
echo "   Option C: python manage.py runserver 0.0.0.0:\$PORT"
echo ""

echo "🔧 3. ENVIRONMENT VARIABLES TO ADD/CHECK:"
echo "   Go to: Configuration > Application Settings"
echo "   Ensure these are set:"
echo "   - DJANGO_SETTINGS_MODULE=config.settings.production"
echo "   - WEBSITES_PORT=8000"
echo "   - SCM_DO_BUILD_DURING_DEPLOYMENT=true"
echo ""

echo "🔧 4. BACKEND URL VERIFICATION:"
echo "   Your actual backend URL appears to be:"
echo "   https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"
echo ""
echo "   Frontend is correctly configured to use this URL."
echo ""

echo "🔧 5. MANUAL STEPS TO FIX:"
echo ""
echo "STEP 1: Go to Azure Portal"
echo "STEP 2: Find 'parliament-fuel-system' App Service"
echo "STEP 3: Go to Configuration > General Settings"
echo "STEP 4: Change 'Startup Command' to: bash startup-simple.sh"
echo "STEP 5: Click Save"
echo "STEP 6: Go to Overview and click Restart"
echo ""

echo "🔧 6. TEST THE FIX:"
echo "   After restart, test these URLs:"
echo "   - https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net/health/"
echo "   - https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net/api/auth/login/"
echo ""

echo "🔧 7. IF STARTUP STILL FAILS, try these alternatives:"
echo "   Alternative 1: gunicorn config.wsgi:application --bind=0.0.0.0:\$PORT --timeout=600"
echo "   Alternative 2: python manage.py runserver 0.0.0.0:\$PORT"
echo "   Alternative 3: Leave blank (Azure will auto-detect)"
echo ""

echo "📋 DEPLOYMENT LOG COMMANDS:"
echo "   To check what's happening:"
echo "   az webapp log tail --name parliament-fuel-system --resource-group <your-resource-group>"
echo ""

echo "🎯 EXPECTED RESULT:"
echo "   After fix, frontend login should work without CORS errors"
echo "   Backend should respond to health checks"
echo ""

read -p "Press Enter to continue and create the simple startup script..."

# Create the simple startup script
cat > startup-simple.sh << 'EOF'
#!/bin/bash
# Simple Azure startup script
echo "Starting Parliament Fuel System..."
cd /home/site/wwwroot
echo "Installing requirements..."
pip install -r requirements.txt
echo "Running migrations..."
python manage.py migrate --noinput
echo "Collecting static files..."
python manage.py collectstatic --noinput
echo "Starting Gunicorn..."
exec gunicorn config.wsgi:application --bind=0.0.0.0:${PORT:-8000} --timeout 600 --workers 1
EOF

chmod +x startup-simple.sh

echo "✅ Created startup-simple.sh"
echo ""
echo "🚀 NOW GO TO AZURE PORTAL AND:"
echo "1. Set Startup Command to: bash startup-simple.sh"
echo "2. Restart the app service"
echo "3. Test the frontend login"
