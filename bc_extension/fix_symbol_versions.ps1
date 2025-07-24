# Business Central Symbol Download - Version Compatibility Fixer
# This script tries different BC versions to find a working configuration

param(
    [switch]$AutoFix
)

$ErrorActionPreference = "Continue"

Write-Host "=== Business Central Symbol Download - Version Fixer ===" -ForegroundColor Cyan
Write-Host "This script will try different BC versions to fix symbol download issues`n" -ForegroundColor Yellow

# Define version combinations to try (from newest to oldest stable)
$versionConfigs = @(
    @{ Platform = "25.0.0.0"; Runtime = "12.0" },
    @{ Platform = "24.0.0.0"; Runtime = "11.0" },
    @{ Platform = "23.0.0.0"; Runtime = "10.0" },
    @{ Platform = "22.0.0.0"; Runtime = "9.0" }
)

$projectPath = "c:\Users\Administrator\Documents\POZ\fuel_coupon_system\bc_extension"
Set-Location $projectPath

# Backup current app.json
$backupFile = "app_original_$(Get-Date -Format 'yyyyMMdd_HHmmss').json"
Copy-Item "app.json" $backupFile
Write-Host "✓ Created backup: $backupFile" -ForegroundColor Green

foreach ($config in $versionConfigs) {
    Write-Host "`n--- Trying Platform Version: $($config.Platform) ---" -ForegroundColor Cyan
    
    # Read current app.json
    $appJson = Get-Content "app.json" -Raw | ConvertFrom-Json
    
    # Update versions
    $appJson.platform = $config.Platform
    $appJson.application = $config.Platform
    $appJson.runtime = $config.Runtime
    
    # Update dependencies
    foreach ($dep in $appJson.dependencies) {
        $dep.version = $config.Platform
    }
    
    # Save updated app.json
    $appJson | ConvertTo-Json -Depth 10 | Set-Content "app.json"
    
    Write-Host "Updated app.json with:" -ForegroundColor Yellow
    Write-Host "  Platform: $($config.Platform)" -ForegroundColor Gray
    Write-Host "  Runtime: $($config.Runtime)" -ForegroundColor Gray
    
    if ($AutoFix) {
        Write-Host "Testing symbol download..." -ForegroundColor Yellow
        
        # Clean cache
        if (Test-Path ".alpackages") {
            Remove-Item -Path ".alpackages\*" -Recurse -Force -ErrorAction SilentlyContinue
        }
        
        Write-Host "Cache cleaned. Please test symbol download in VS Code now." -ForegroundColor Green
        Write-Host "If this version works, keep it. Otherwise, run this script again." -ForegroundColor Yellow
        break
    } else {
        Write-Host "Configuration updated. Test symbol download in VS Code:" -ForegroundColor Green
        Write-Host "1. Press Ctrl+Shift+P" -ForegroundColor Gray
        Write-Host "2. Type 'AL: Download Symbols'" -ForegroundColor Gray
        Write-Host "3. Press Enter and wait" -ForegroundColor Gray
        
        $response = Read-Host "`nDid symbol download work? (y/n/q to quit)"
        
        if ($response -eq 'y' -or $response -eq 'Y') {
            Write-Host "`n✓ Success! Keeping configuration with Platform $($config.Platform)" -ForegroundColor Green
            Write-Host "Backup saved as: $backupFile" -ForegroundColor Yellow
            break
        } elseif ($response -eq 'q' -or $response -eq 'Q') {
            # Restore original
            Copy-Item $backupFile "app.json"
            Write-Host "Restored original configuration" -ForegroundColor Yellow
            break
        }
        # Continue to next version if 'n'
    }
}

Write-Host "`n=== Alternative Solutions ===" -ForegroundColor Cyan
Write-Host "If all versions fail, try these options:" -ForegroundColor Yellow
Write-Host "1. Use Docker with AL Development Environment" -ForegroundColor White
Write-Host "2. Download symbols manually from BC Admin Center" -ForegroundColor White
Write-Host "3. Use a different BC environment for development" -ForegroundColor White
Write-Host "4. Contact Microsoft Support with the Request IDs from the error" -ForegroundColor White

Write-Host "`nRequest IDs from your error for Microsoft Support:" -ForegroundColor Yellow
Write-Host "- 901ffa10-55a7-4340-8fae-226d494a57af" -ForegroundColor Gray
Write-Host "- 0c4bb168-91f5-44c8-a0cd-fda95b346aed" -ForegroundColor Gray
Write-Host "- ce9da7c1-c486-4a94-9e98-3a4586fc2127" -ForegroundColor Gray
Write-Host "- Session ID: 80ff1bbc-7c29-4411-85b4-1c73653b34db" -ForegroundColor Gray
