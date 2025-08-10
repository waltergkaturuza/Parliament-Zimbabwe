# PowerShell script to fix API paths by removing /api/v1/ prefixes

Write-Host "Fixing API paths in frontend files..." -ForegroundColor Green

# List of files to fix (most critical ones first)
$files = @(
    "fuel-coupon-frontend\src\api\admin.ts",
    "fuel-coupon-frontend\src\api\dashboard.ts", 
    "fuel-coupon-frontend\src\services\homeApi.ts",
    "fuel-coupon-frontend\src\pages\Register.tsx",
    "fuel-coupon-frontend\src\pages\profile\ProfilePage.tsx",
    "fuel-coupon-frontend\src\contexts\NotificationContext.tsx",
    "fuel-coupon-frontend\src\pages\main-center\MainCenterDashboard.tsx",
    "fuel-coupon-frontend\src\pages\fuel\FuelRequirementsManagement.tsx"
)

foreach ($file in $files) {
    $fullPath = Join-Path $PWD $file
    if (Test-Path $fullPath) {
        Write-Host "Processing: $file" -ForegroundColor Yellow
        
        # Read content
        $content = Get-Content $fullPath -Raw
        
        # Replace common patterns
        $content = $content -replace "'/api/v1/", "'/"
        $content = $content -replace '"/api/v1/', '"/'
        $content = $content -replace "`'/api/v1/", "`'/"
        $content = $content -replace '`"/api/v1/', '`"/'
        $content = $content -replace '\$\{API_BASE_URL\}/api/v1/', '${API_BASE_URL}/'
        
        # Write back
        Set-Content $fullPath $content -NoNewline
        Write-Host "  ✓ Fixed $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ File not found: $file" -ForegroundColor Red
    }
}

Write-Host "API path fixing complete!" -ForegroundColor Green
Write-Host "Now all API calls will use the base URL with /api/v1/ prefix." -ForegroundColor Cyan
