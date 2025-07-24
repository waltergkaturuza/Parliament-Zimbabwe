# Quick Extension Compiler - Bypasses Symbol Issues
# This script helps compile your AL extension without downloading symbols

Write-Host "Parliament Fuel System - Extension Compiler" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan

$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectPath

Write-Host "`nProject Path: $projectPath" -ForegroundColor Yellow

# Clean any existing packages
Write-Host "`nCleaning previous builds..." -ForegroundColor Green
Remove-Item -Path "*.app" -Force -ErrorAction SilentlyContinue
Remove-Item -Path ".alpackages\*" -Recurse -Force -ErrorAction SilentlyContinue

# Create minimal .alpackages directory
if (-not (Test-Path ".alpackages")) {
    New-Item -ItemType Directory -Path ".alpackages" -Force | Out-Null
    Write-Host "Created .alpackages directory" -ForegroundColor Green
}

# Check if AL files exist
$alFiles = Get-ChildItem -Filter "*.al"
Write-Host "Found $($alFiles.Count) AL files:" -ForegroundColor Green
foreach ($file in $alFiles) {
    Write-Host "  - $($file.Name)" -ForegroundColor Gray
}

# Try to compile using VS Code AL extension
Write-Host "`nAttempting to compile extension..." -ForegroundColor Green

try {
    # Open VS Code in the current directory
    Write-Host "Opening VS Code..." -ForegroundColor Yellow
    Start-Process -FilePath "code" -ArgumentList "." -Wait:$false
    
    Write-Host "`nManual steps required in VS Code:" -ForegroundColor Cyan
    Write-Host "1. Wait for VS Code to fully load" -ForegroundColor White
    Write-Host "2. Press Ctrl+Shift+P" -ForegroundColor White
    Write-Host "3. Type 'AL: Package' and press Enter" -ForegroundColor White
    Write-Host "4. Ignore any symbol download errors" -ForegroundColor White
    Write-Host "5. The extension will compile with available symbols" -ForegroundColor White
    
    Read-Host "`nPress Enter when you've completed the AL: Package command"
    
    # Check if app file was created
    $appFiles = Get-ChildItem -Filter "*.app"
    if ($appFiles.Count -gt 0) {
        Write-Host "`n✓ SUCCESS! Extension compiled:" -ForegroundColor Green
        foreach ($app in $appFiles) {
            Write-Host "  📦 $($app.Name)" -ForegroundColor Green
        }
        
        Write-Host "`nNext steps:" -ForegroundColor Yellow
        Write-Host "1. In VS Code: Ctrl+Shift+P > 'AL: Publish'" -ForegroundColor White
        Write-Host "2. Select your Production environment" -ForegroundColor White
        Write-Host "3. Sign in when prompted" -ForegroundColor White
        Write-Host "4. Wait for deployment to complete" -ForegroundColor White
        
    } else {
        Write-Host "`n⚠ No .app file found." -ForegroundColor Yellow
        Write-Host "This might mean compilation failed." -ForegroundColor Yellow
        Write-Host "Check the AL Language Extension output in VS Code." -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "`n✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nAlternative deployment methods:" -ForegroundColor Cyan
Write-Host "1. Run DEPLOY_MANUALLY.bat for step-by-step guide" -ForegroundColor White
Write-Host "2. Use Business Central Admin Center to upload .app file" -ForegroundColor White
Write-Host "3. Contact your BC administrator for assistance" -ForegroundColor White

Write-Host "`nScript completed." -ForegroundColor Green
