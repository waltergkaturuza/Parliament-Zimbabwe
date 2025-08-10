Write-Host "Fixing API paths in frontend files..." -ForegroundColor Green

$files = @(
    "fuel-coupon-frontend\src\api\admin.ts",
    "fuel-coupon-frontend\src\api\dashboard.ts", 
    "fuel-coupon-frontend\src\services\homeApi.ts",
    "fuel-coupon-frontend\src\pages\Register.tsx",
    "fuel-coupon-frontend\src\pages\profile\ProfilePage.tsx"
)

foreach ($file in $files) {
    $fullPath = Join-Path $PWD $file
    if (Test-Path $fullPath) {
        Write-Host "Processing: $file"
        $content = Get-Content $fullPath -Raw
        $content = $content -replace "'/api/v1/", "'/"
        $content = $content -replace '"/api/v1/', '"/'
        Set-Content $fullPath $content -NoNewline
        Write-Host "Fixed $file"
    }
}

Write-Host "Done!"
