@echo off
echo ============================================
echo Parliament Fuel System - Quick Deploy
echo ============================================
echo.

echo Opening extension folder in VS Code...
code .

echo.
echo NEXT STEPS:
echo 1. In VS Code, install the AL Language extension if not already installed
echo 2. Press Ctrl+Shift+P and type "AL: Package"
echo 3. Follow the detailed instructions in DEPLOYMENT_GUIDE.md
echo.

echo Extension files ready for deployment:
dir *.al /b

echo.
echo For detailed deployment instructions, see DEPLOYMENT_GUIDE.md
pause
