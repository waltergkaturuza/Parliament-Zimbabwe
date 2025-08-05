# Pre-deployment validation script for Windows PowerShell
Write-Host "🔍 PRE-DEPLOYMENT VALIDATION" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan

# Check requirements.txt
Write-Host "📦 Checking requirements.txt..." -ForegroundColor Yellow
if (Test-Path "requirements.txt") {
    Write-Host "✅ requirements.txt exists" -ForegroundColor Green
    $deps = (Get-Content "requirements.txt" | Where-Object { $_ -notmatch '^#' -and $_ -ne '' }).Count
    Write-Host "   Dependencies: $deps packages" -ForegroundColor Green
} else {
    Write-Host "❌ requirements.txt missing!" -ForegroundColor Red
    exit 1
}

# Check Django settings
Write-Host "🔧 Checking Django settings..." -ForegroundColor Yellow
if (Test-Path "config/settings/production.py") {
    Write-Host "✅ Production settings exist" -ForegroundColor Green
    # Check for critical settings
    $content = Get-Content "config/settings/production.py" -Raw
    if ($content -match "parliament-fuel-system\.azurewebsites\.net") {
        Write-Host "✅ Correct backend URL configured" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Backend URL may be incorrect" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Production settings missing!" -ForegroundColor Red
    exit 1
}

# Check manage.py
Write-Host "📋 Checking Django project structure..." -ForegroundColor Yellow
if (Test-Path "manage.py") {
    Write-Host "✅ manage.py exists" -ForegroundColor Green
} else {
    Write-Host "❌ manage.py missing!" -ForegroundColor Red
    exit 1
}

# Check models
Write-Host "📊 Checking models..." -ForegroundColor Yellow
if (Test-Path "fuel/models.py") {
    Write-Host "✅ Fuel models exist" -ForegroundColor Green
} else {
    Write-Host "❌ Fuel models missing!" -ForegroundColor Red
    exit 1
}

# Check startup script
Write-Host "🚀 Checking startup script..." -ForegroundColor Yellow
if (Test-Path "startup.sh") {
    Write-Host "✅ startup.sh exists" -ForegroundColor Green
} else {
    Write-Host "⚠️  startup.sh missing (will use default)" -ForegroundColor Yellow
}

# Check frontend workflow
Write-Host "🌐 Checking frontend workflow..." -ForegroundColor Yellow
$workflowPath = ".github/workflows/azure-static-web-apps-jolly-ocean-0e0dee90f.yml"
if (Test-Path $workflowPath) {
    Write-Host "✅ Frontend workflow exists" -ForegroundColor Green
    $workflowContent = Get-Content $workflowPath -Raw
    if ($workflowContent -match "VITE_API_BASE_URL.*parliament-fuel-system\.azurewebsites\.net") {
        Write-Host "✅ Frontend workflow has correct backend URL" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Frontend workflow backend URL may be incorrect" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Frontend workflow missing" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎯 VALIDATION COMPLETE" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host "✅ Ready for Azure deployment!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. git add ." -ForegroundColor White
Write-Host "2. git commit -m 'Production deployment ready'" -ForegroundColor White
Write-Host "3. git push origin main" -ForegroundColor White
Write-Host ""
Write-Host "To test locally first (optional):" -ForegroundColor Yellow
Write-Host "1. .\source\Scripts\Activate.ps1" -ForegroundColor White
Write-Host "2. python manage.py collectstatic --noinput" -ForegroundColor White
Write-Host "3. python manage.py migrate" -ForegroundColor White
Write-Host ""
