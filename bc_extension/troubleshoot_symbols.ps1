# Business Central Symbol Download Troubleshooting Script
# This script helps resolve common issues with downloading AL symbols

param(
    [switch]$Force,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

Write-Host "=== Business Central Symbol Download Troubleshooter ===" -ForegroundColor Cyan

# Set the working directory
$projectPath = "c:\Users\Administrator\Documents\POZ\fuel_coupon_system\bc_extension"
Set-Location $projectPath

Write-Host "Working directory: $projectPath" -ForegroundColor Yellow

# Step 1: Check AL Extension
Write-Host "`n1. Checking AL Language Extension..." -ForegroundColor Green
try {
    $alExtensions = code --list-extensions | Where-Object { $_ -like "*ms-dynamics-smb.al*" }
    if ($alExtensions) {
        Write-Host "   ✓ AL Language Extension found: $alExtensions" -ForegroundColor Green
    } else {
        Write-Host "   ✗ AL Language Extension not found!" -ForegroundColor Red
        Write-Host "   Please install it from: https://marketplace.visualstudio.com/items?itemName=ms-dynamics-smb.al" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "   ⚠ Could not check VS Code extensions. Make sure VS Code is in PATH." -ForegroundColor Yellow
}

# Step 2: Clean symbol cache
Write-Host "`n2. Cleaning symbol cache..." -ForegroundColor Green
$cacheDir = ".alpackages"
if (Test-Path $cacheDir) {
    if ($Force) {
        Remove-Item -Path "$cacheDir\*" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "   ✓ Cache cleaned" -ForegroundColor Green
    } else {
        $items = Get-ChildItem $cacheDir -ErrorAction SilentlyContinue
        if ($items) {
            Write-Host "   ⚠ Cache contains $($items.Count) items. Use -Force to clean." -ForegroundColor Yellow
        } else {
            Write-Host "   ✓ Cache is already empty" -ForegroundColor Green
        }
    }
} else {
    Write-Host "   ✓ No cache directory found (will be created)" -ForegroundColor Green
}

# Step 3: Validate app.json
Write-Host "`n3. Validating app.json configuration..." -ForegroundColor Green
if (Test-Path "app.json") {
    try {
        $appJson = Get-Content "app.json" | ConvertFrom-Json
        Write-Host "   ✓ app.json is valid JSON" -ForegroundColor Green
        Write-Host "   Platform: $($appJson.platform)" -ForegroundColor Cyan
        Write-Host "   Application: $($appJson.application)" -ForegroundColor Cyan
        Write-Host "   Runtime: $($appJson.runtime)" -ForegroundColor Cyan
        Write-Host "   Dependencies: $($appJson.dependencies.Count)" -ForegroundColor Cyan
        
        # Check for common issues
        if ($appJson.platform -ne $appJson.application) {
            Write-Host "   ⚠ Platform and Application versions differ" -ForegroundColor Yellow
        }
        
        if (-not $appJson.dependencies -or $appJson.dependencies.Count -eq 0) {
            Write-Host "   ⚠ No dependencies specified" -ForegroundColor Yellow
        }
        
    } catch {
        Write-Host "   ✗ app.json has invalid JSON: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "   ✗ app.json not found!" -ForegroundColor Red
    exit 1
}

# Step 4: Check launch.json
Write-Host "`n4. Validating launch.json configuration..." -ForegroundColor Green
$launchJsonPath = ".vscode\launch.json"
if (Test-Path $launchJsonPath) {
    try {
        $launchJson = Get-Content $launchJsonPath | ConvertFrom-Json
        Write-Host "   ✓ launch.json is valid JSON" -ForegroundColor Green
        
        $config = $launchJson.configurations[0]
        Write-Host "   Server: $($config.server)" -ForegroundColor Cyan
        Write-Host "   Tenant: $($config.tenant)" -ForegroundColor Cyan
        Write-Host "   Environment: $($config.environmentName)" -ForegroundColor Cyan
        
    } catch {
        Write-Host "   ✗ launch.json has invalid JSON: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "   ⚠ launch.json not found" -ForegroundColor Yellow
}

# Step 5: Test connectivity
Write-Host "`n5. Testing Business Central API connectivity..." -ForegroundColor Green
$tenant = "086c4475-d0ef-4d2b-871c-4e078a083db5"
$testUrl = "https://api.businesscentral.dynamics.com/v2.0/Production/dev"

try {
    $response = Invoke-WebRequest -Uri $testUrl -Method Head -TimeoutSec 10 -ErrorAction Stop
    Write-Host "   ✓ Business Central API is accessible" -ForegroundColor Green
} catch {
    Write-Host "   ⚠ Could not reach Business Central API: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "   This might be due to authentication requirements" -ForegroundColor Yellow
}

# Step 6: Recommendations
Write-Host "`n=== RECOMMENDATIONS ===" -ForegroundColor Cyan
Write-Host "1. Try downloading symbols manually:" -ForegroundColor White
Write-Host "   - Open VS Code in this directory" -ForegroundColor Gray
Write-Host "   - Press Ctrl+Shift+P" -ForegroundColor Gray
Write-Host "   - Type 'AL: Download Symbols' and press Enter" -ForegroundColor Gray

Write-Host "`n2. If symbols still fail to download:" -ForegroundColor White
Write-Host "   - Check your Business Central user permissions" -ForegroundColor Gray
Write-Host "   - Verify the tenant ID and environment name are correct" -ForegroundColor Gray
Write-Host "   - Try restarting VS Code" -ForegroundColor Gray

Write-Host "`n3. Alternative: Use local symbols (offline development)" -ForegroundColor White
Write-Host "   - Download symbols manually from Business Central Admin Center" -ForegroundColor Gray
Write-Host "   - Place them in the .alpackages folder" -ForegroundColor Gray

Write-Host "`n4. Version compatibility check:" -ForegroundColor White
Write-Host "   - Your app targets platform 26.3.0.0" -ForegroundColor Gray
Write-Host "   - Make sure your BC environment supports this version" -ForegroundColor Gray

Write-Host "`nFor more help, check the AL Language Extension output panel in VS Code." -ForegroundColor Yellow
