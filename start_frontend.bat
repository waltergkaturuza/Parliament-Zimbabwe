@echo off
echo Starting Frontend Development Server...
echo.
echo Frontend will be available at: http://localhost:5173
echo API calls will be proxied to backend at localhost:8000
echo.

cd /d "C:\Users\Administrator\Documents\POZ\fuel_coupon_system\fuel-coupon-frontend"

REM Install dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

echo Starting Vite server...
npm run dev

pause
