@echo off
echo ===============================================
echo Parliament Oversight Pages Test Script
echo ===============================================
echo.

cd /d "c:\Users\Administrator\Documents\POZ\fuel_coupon_system\fuel-coupon-frontend"

echo Checking if Node.js and npm are available...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not available
    pause
    exit /b 1
)

echo.
echo Node.js and npm are available!
echo.

echo Installing dependencies (if needed)...
if not exist node_modules (
    echo Installing npm packages...
    npm install
) else (
    echo Dependencies already installed.
)

echo.
echo Starting development server...
echo.
echo ===========================================
echo TESTING INSTRUCTIONS:
echo ===========================================
echo 1. Wait for server to start (usually localhost:5173)
echo 2. Open browser and login as MAIN_CENTER user
echo 3. Navigate to Parliament Oversight section
echo 4. Test these pages:
echo    - Parliament Reports (/dashboard/parliament-reports)
echo    - SubCenter Activities (/dashboard/subcenter-activities)  
echo    - System Analytics (/dashboard/system-analytics)
echo.
echo Press Ctrl+C to stop the server when done testing
echo ===========================================
echo.

npm run dev
