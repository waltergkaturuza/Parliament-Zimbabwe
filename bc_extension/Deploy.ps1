# Parliament Fuel System - Deployment Script
# Run this script to compile and deploy the extension

Write-Host "============================================" -ForegroundColor Green
Write-Host "Parliament Fuel System Deployment Script" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

# Check prerequisites
Write-Host "1. Checking Prerequisites..." -ForegroundColor Yellow

# Check if VS Code is installed
if (Get-Command "code" -ErrorAction SilentlyContinue) {
    $vscodeVersion = code --version
    Write-Host "   ✓ VS Code installed: $($vscodeVersion[0])" -ForegroundColor Green
} else {
    Write-Host "   ✗ VS Code not found. Please install VS Code first." -ForegroundColor Red
    exit 1
}

# Check if AL extension is available (indirectly by checking if alc.exe exists)
$alcPath = Get-Command "alc.exe" -ErrorAction SilentlyContinue
if ($alcPath) {
    Write-Host "   ✓ AL Compiler found" -ForegroundColor Green
} else {
    Write-Host "   ⚠ AL Compiler not found in PATH. Make sure AL Language extension is installed in VS Code." -ForegroundColor Yellow
    Write-Host "     You may need to use VS Code's built-in compilation instead." -ForegroundColor Yellow
}

Write-Host ""

# Create output directory
Write-Host "2. Preparing Output Directory..." -ForegroundColor Yellow
$outputDir = ".\output"
if (!(Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
    Write-Host "   ✓ Created output directory" -ForegroundColor Green
} else {
    Write-Host "   ✓ Output directory exists" -ForegroundColor Green
}

Write-Host ""

# Display extension info
Write-Host "3. Extension Information:" -ForegroundColor Yellow
$appJson = Get-Content "app.json" | ConvertFrom-Json
Write-Host "   Name: $($appJson.name)" -ForegroundColor Cyan
Write-Host "   Version: $($appJson.version)" -ForegroundColor Cyan
Write-Host "   Publisher: $($appJson.publisher)" -ForegroundColor Cyan
Write-Host "   Target: $($appJson.target)" -ForegroundColor Cyan
Write-Host "   Symbol-Free: $(if ($appJson.dependencies.Count -eq 0) { 'Yes' } else { 'No' })" -ForegroundColor Cyan

Write-Host ""

# List AL files
Write-Host "4. AL Files to be compiled:" -ForegroundColor Yellow
Get-ChildItem -Name "*.al" | ForEach-Object {
    Write-Host "   - $_" -ForegroundColor Cyan
}

Write-Host ""

Write-Host "5. Next Steps for Deployment:" -ForegroundColor Yellow
Write-Host ""

Write-Host "OPTION A: Using VS Code (Recommended)" -ForegroundColor Green
Write-Host "1. Open this folder in VS Code" -ForegroundColor White
Write-Host "2. Press Ctrl+Shift+P and type 'AL: Package'" -ForegroundColor White
Write-Host "3. This will create a .app file in the output folder" -ForegroundColor White
Write-Host ""

Write-Host "OPTION B: Manual Compilation (if AL compiler is available)" -ForegroundColor Green
Write-Host "Run: alc.exe /project:`"$PWD`" /out:`"$outputDir`"" -ForegroundColor White
Write-Host ""

Write-Host "OPTION C: Business Central Administration" -ForegroundColor Green
Write-Host "1. Compile the extension (using Option A or B)" -ForegroundColor White
Write-Host "2. Open Business Central Administration Shell as Administrator" -ForegroundColor White
Write-Host "3. Run these commands:" -ForegroundColor White
Write-Host "   Publish-NAVApp -ServerInstance BC -Path `"path\to\your.app`"" -ForegroundColor Gray
Write-Host "   Sync-NAVApp -ServerInstance BC -Name `"Parliament Fuel System Lite`"" -ForegroundColor Gray
Write-Host "   Install-NAVApp -ServerInstance BC -Name `"Parliament Fuel System Lite`"" -ForegroundColor Gray
Write-Host ""

Write-Host "6. Post-Deployment Steps:" -ForegroundColor Yellow
Write-Host "1. Assign 'Fuel Manager Objects' permission set to users" -ForegroundColor White
Write-Host "2. Set users' Role Center to 'Fuel Manager'" -ForegroundColor White
Write-Host "3. Test the functionality:" -ForegroundColor White
Write-Host "   - Create a fuel transaction" -ForegroundColor White
Write-Host "   - Approve/reject transactions" -ForegroundColor White
Write-Host "   - Configure fuel rates" -ForegroundColor White
Write-Host "   - Generate reports" -ForegroundColor White
Write-Host ""

Write-Host "============================================" -ForegroundColor Green
Write-Host "Ready for deployment!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
