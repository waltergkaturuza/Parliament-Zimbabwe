# PowerShell script to start Django backend with proper environment
Write-Host "===========================================" -ForegroundColor Green
Write-Host "   STARTING DJANGO BACKEND SERVER" -ForegroundColor Green  
Write-Host "===========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Setting environment variables..." -ForegroundColor Yellow
$env:DJANGO_DEBUG = "True"
$env:DJANGO_SECRET_KEY = "django-insecure-1*p133x5+uzwh8&axhdhi41jq=%&p(9)pzmoyob$(a01)rcs&z"

Write-Host ""
Write-Host "Checking virtual environment..." -ForegroundColor Yellow
if (Test-Path ".\.venv\Scripts\Activate.ps1") {
    Write-Host "Activating virtual environment..." -ForegroundColor Yellow
    & .\.venv\Scripts\Activate.ps1
} else {
    Write-Host "Virtual environment not found. Please run from project root." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Running Django checks..." -ForegroundColor Yellow
python manage.py check

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Running migrations..." -ForegroundColor Yellow
    python manage.py migrate
    
    Write-Host ""
    Write-Host "Starting Django development server..." -ForegroundColor Green
    Write-Host "Backend will be available at: http://127.0.0.1:8000" -ForegroundColor Cyan
    Write-Host "Admin interface: http://127.0.0.1:8000/admin/" -ForegroundColor Cyan
    Write-Host "API documentation: http://127.0.0.1:8000/api/docs/" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
    Write-Host ""
    
    python manage.py runserver 127.0.0.1:8000
} else {
    Write-Host "Django check failed. Please fix the errors above." -ForegroundColor Red
    exit 1
}
