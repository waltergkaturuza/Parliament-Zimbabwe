# Git push verification script
Write-Host "=== Git Push Verification ===" -ForegroundColor Green

# Check git status
Write-Host "`nChecking git status..." -ForegroundColor Yellow
try {
    $status = git status --porcelain
    if ($status) {
        Write-Host "Uncommitted changes found:" -ForegroundColor Yellow
        git status --short
    } else {
        Write-Host "✅ Working directory clean" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Error checking git status: $($_.Exception.Message)" -ForegroundColor Red
}

# Check last commit
Write-Host "`nLast commit:" -ForegroundColor Yellow
try {
    git log --oneline -1
} catch {
    Write-Host "❌ Error getting last commit: $($_.Exception.Message)" -ForegroundColor Red
}

# Check remote status
Write-Host "`nChecking if local is up to date with remote..." -ForegroundColor Yellow
try {
    git fetch origin main
    $behind = git rev-list --count HEAD..origin/main
    $ahead = git rev-list --count origin/main..HEAD
    
    if ($behind -eq "0" -and $ahead -eq "0") {
        Write-Host "✅ Local branch is up to date with remote" -ForegroundColor Green
    } elseif ($ahead -gt 0) {
        Write-Host "⚠️  Local branch is $ahead commits ahead of remote" -ForegroundColor Yellow
        Write-Host "   Run 'git push origin main' to push changes" -ForegroundColor Yellow
    } elseif ($behind -gt 0) {
        Write-Host "⚠️  Local branch is $behind commits behind remote" -ForegroundColor Yellow
        Write-Host "   Run 'git pull origin main' to pull changes" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error checking remote status: $($_.Exception.Message)" -ForegroundColor Red
}

# Summary of key files that should be in the repository
Write-Host "`nKey files that should be in the repository:" -ForegroundColor Yellow
$keyFiles = @(
    "fuel/views.py",
    "config/settings/production_stable.py", 
    "fuel-coupon-frontend/staticwebapp.database.config.json",
    "fuel/urls.py"
)

foreach ($file in $keyFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file (missing)" -ForegroundColor Red
    }
}

Write-Host "`n=== Verification Complete ===" -ForegroundColor Green
