Write-Host "Fixing all remaining API paths..." -ForegroundColor Green

# Get all TypeScript and JavaScript files in the frontend
$files = Get-ChildItem -Path "fuel-coupon-frontend\src" -Include "*.ts", "*.tsx", "*.js", "*.jsx" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Replace all /api/v1/ patterns
    $content = $content -replace "'/api/v1/", "'/"
    $content = $content -replace '"/api/v1/', '"/'
    $content = $content -replace '`/api/v1/', '`/'
    $content = $content -replace '\$\{API_BASE_URL\}/api/v1/', '${API_BASE_URL}/'
    
    # If content changed, write it back
    if ($content -ne $originalContent) {
        Set-Content $file.FullName $content -NoNewline
        Write-Host "Fixed: $($file.Name)" -ForegroundColor Yellow
    }
}

Write-Host "All API paths fixed!" -ForegroundColor Green
