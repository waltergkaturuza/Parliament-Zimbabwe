# Start Local Development Servers
Write-Host "🚀 Starting Local Development Environment" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Cyan

# Check if we're in the right directory
if (!(Test-Path "manage.py")) {
    Write-Host "❌ Error: manage.py not found. Please run from the project root." -ForegroundColor Red
    exit 1
}

# Activate virtual environment if not already active
if ($env:VIRTUAL_ENV -eq $null) {
    Write-Host "🔧 Activating virtual environment..." -ForegroundColor Yellow
    & ".\\.venv\\Scripts\\Activate.ps1"
}

Write-Host "🔥 Starting Django Backend Server on port 8000..." -ForegroundColor Yellow
Write-Host "   Backend will be available at: http://localhost:8000" -ForegroundColor White

# Start Django server in background
Start-Process powershell -ArgumentList "-Command", "cd '$PWD'; .\.venv\Scripts\python.exe manage.py runserver 8000" -WindowStyle Minimized

# Wait a moment for backend to start
Start-Sleep -Seconds 3

Write-Host "⚡ Starting Frontend Development Server..." -ForegroundColor Yellow
Write-Host "   Frontend will be available at: http://localhost:5173" -ForegroundColor White
Write-Host "   API calls will be proxied to backend automatically" -ForegroundColor White

# Change to frontend directory and start Vite
cd fuel-coupon-frontend

# Check if node_modules exists
if (!(Test-Path "node_modules")) {
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host "🌐 Starting Vite development server..." -ForegroundColor Green
Write-Host "   This will automatically proxy API calls to the backend" -ForegroundColor White
Write-Host "   Press Ctrl+C to stop both servers" -ForegroundColor White

npm run dev

Write-Host "✅ Development environment ready!" -ForegroundColor Green
Write-Host "Backend: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
