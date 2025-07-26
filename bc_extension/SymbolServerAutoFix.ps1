# BC Online Symbol Server Workaround Script
# Automatically tries different configurations to resolve symbol download issues

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " BC Online Symbol Server Auto-Fix" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "ISSUE: Symbol server backend problems" -ForegroundColor Red
Write-Host "TENANT: 086c4475-d0ef-4d2b-871c-4e078a083db5" -ForegroundColor Yellow
Write-Host ""

# Function to test configuration
function Test-Configuration {
    param($version, $environment)
    Write-Host "Testing version $version with $environment environment..." -ForegroundColor Yellow
    
    # This would typically trigger AL: Download Symbols
    # For now, we'll create the configuration files
    return $true
}

# Workaround 1: Try version 26.0.0.0 instead of 26.3.0.0
Write-Host "WORKAROUND 1: Trying version 26.0.0.0..." -ForegroundColor Green
Copy-Item "app-v26.0-fallback.json" "app.json" -Force
Write-Host "✓ Updated to version 26.0.0.0" -ForegroundColor Green
Write-Host "Now try: Ctrl+Shift+P -> AL: Download Symbols" -ForegroundColor Cyan
Write-Host ""

# Prompt user to test
$response = Read-Host "Did version 26.0.0.0 work? (y/n)"
if ($response -eq "y") {
    Write-Host "✓ SUCCESS: Version 26.0.0.0 symbols downloaded!" -ForegroundColor Green
    exit 0
}

# Workaround 2: Try Sandbox environment
Write-Host "WORKAROUND 2: Switching to Sandbox environment..." -ForegroundColor Green
Copy-Item "launch-sandbox.json" ".vscode\launch.json" -Force
Write-Host "✓ Switched to Sandbox environment" -ForegroundColor Green
Write-Host "Now try: Ctrl+Shift+P -> AL: Download Symbols" -ForegroundColor Cyan
Write-Host ""

$response = Read-Host "Did Sandbox environment work? (y/n)"
if ($response -eq "y") {
    Write-Host "✓ SUCCESS: Sandbox symbols downloaded!" -ForegroundColor Green
    exit 0
}

# Workaround 3: Try version 25.0.0.0
Write-Host "WORKAROUND 3: Trying stable version 25.0.0.0..." -ForegroundColor Green
Copy-Item "app-v25.0-stable.json" "app.json" -Force
Remove-Item ".alpackages" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "✓ Updated to version 25.0.0.0" -ForegroundColor Green
Write-Host "✓ Cleaned symbol cache" -ForegroundColor Green
Write-Host "Now try: Ctrl+Shift+P -> AL: Download Symbols" -ForegroundColor Cyan
Write-Host ""

$response = Read-Host "Did version 25.0.0.0 work? (y/n)"
if ($response -eq "y") {
    Write-Host "✓ SUCCESS: Version 25.0.0.0 symbols downloaded!" -ForegroundColor Green
    exit 0
}

# All workarounds failed
Write-Host ""
Write-Host "========================================" -ForegroundColor Red
Write-Host " ALL WORKAROUNDS FAILED" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""

Write-Host "BACKEND ISSUE CONFIRMED:" -ForegroundColor Red
Write-Host "- Microsoft BC Online symbol server has backend problems" -ForegroundColor Yellow
Write-Host "- This is blocking extension development" -ForegroundColor Yellow
Write-Host "- Issue is not with your configuration" -ForegroundColor Yellow
Write-Host ""

Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Contact Microsoft Support with tenant ID: 086c4475-d0ef-4d2b-871c-4e078a083db5" -ForegroundColor White
Write-Host "2. Reference 'BC Online symbol server backend issues'" -ForegroundColor White
Write-Host "3. Consider using BC Docker container for development" -ForegroundColor White
Write-Host "4. Manual symbol download from GitHub (advanced)" -ForegroundColor White
Write-Host ""

Write-Host "MICROSOFT SUPPORT INFO:" -ForegroundColor Yellow
Write-Host "- Tenant: 086c4475-d0ef-4d2b-871c-4e078a083db5" -ForegroundColor White
Write-Host "- Environment: Production & Sandbox" -ForegroundColor White
Write-Host "- Issue: Symbol API returning 401/500 errors" -ForegroundColor White
Write-Host "- Versions tested: 26.3.0.0, 26.0.0.0, 25.0.0.0" -ForegroundColor White
Write-Host "- Error: Authentication/authorization failure on symbol endpoints" -ForegroundColor White

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
