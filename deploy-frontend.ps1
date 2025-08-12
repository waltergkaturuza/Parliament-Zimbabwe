# Frontend Deployment Script
# Deploy the updated BoxReceiptManagement.tsx with box_code fix

param(
    [string]$FrontendPath = "fuel-coupon-frontend",
    [string]$BuildOutput = "dist"
)

Write-Host "🚀 Deploying Frontend Changes - Box Code Fix" -ForegroundColor Green
Write-Host "=" * 50

# Check if frontend directory exists
if (!(Test-Path $FrontendPath)) {
    Write-Host "❌ Frontend directory not found: $FrontendPath" -ForegroundColor Red
    Write-Host "Please run this script from the parent directory of your frontend project" -ForegroundColor Red
    exit 1
}

# Navigate to frontend directory
Write-Host "📁 Entering frontend directory..." -ForegroundColor Yellow
Set-Location $FrontendPath

# Check if package.json exists
if (!(Test-Path "package.json")) {
    Write-Host "❌ No package.json found. Not a valid Node.js project." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found valid frontend project" -ForegroundColor Green

# Install dependencies
Write-Host "📦 Installing/updating dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm install failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green

# Build the project
Write-Host "🔨 Building frontend project..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Frontend built successfully" -ForegroundColor Green

# Check if build output exists
if (!(Test-Path $BuildOutput)) {
    Write-Host "❌ Build output directory not found: $BuildOutput" -ForegroundColor Red
    exit 1
}

# Show build info
$buildSize = (Get-ChildItem $BuildOutput -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "📊 Build completed:" -ForegroundColor Cyan
Write-Host "   📁 Output directory: $BuildOutput" -ForegroundColor White
Write-Host "   📏 Total size: $([math]::Round($buildSize, 2)) MB" -ForegroundColor White

# List key files
Write-Host "📋 Key files in build:" -ForegroundColor Cyan
Get-ChildItem $BuildOutput -File | Where-Object { $_.Extension -in ".html", ".js", ".css" } | ForEach-Object {
    $size = [math]::Round($_.Length / 1KB, 1)
    Write-Host "   📄 $($_.Name) ($size KB)" -ForegroundColor White
}

Write-Host ""
Write-Host "🎉 FRONTEND BUILD COMPLETE!" -ForegroundColor Green
Write-Host "=" * 50
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Upload the contents of '$BuildOutput' directory to your web hosting" -ForegroundColor White
Write-Host "2. Or configure your hosting provider to pull from this build" -ForegroundColor White
Write-Host "3. Test the updated form submission (no more box_code in POST data)" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Key Changes Deployed:" -ForegroundColor Cyan
Write-Host "   ✅ Removed box_code from form submissions" -ForegroundColor Green
Write-Host "   ✅ Enhanced error handling for API responses" -ForegroundColor Green
Write-Host "   ✅ Form optimized for backend auto-generation" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Expected Result: No more duplicate box_code errors!" -ForegroundColor Green

# Return to original directory
Set-Location ..
