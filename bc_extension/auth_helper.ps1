# Parliament Fuel System - AL Authentication Helper
# This script prepares the environment for proper AL authentication

param(
    [switch]$ClearCache = $false
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " PARLIAMENT FUEL SYSTEM - AL AUTH HELPER" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Function to clear AL cache
function Clear-ALCache {
    Write-Host "🧹 Clearing AL Extension cache..." -ForegroundColor Yellow
    
    $alPackagesPath = Join-Path $PSScriptRoot ".alpackages"
    if (Test-Path $alPackagesPath) {
        Remove-Item $alPackagesPath -Recurse -Force -ErrorAction SilentlyContinue
        New-Item -ItemType Directory -Path $alPackagesPath -Force | Out-Null
        Write-Host "   ✅ Cleared .alpackages cache" -ForegroundColor Green
    }
    
    # Clear VS Code AL settings
    $vsCodeSettings = "$env:APPDATA\Code\User\workspaceStorage"
    if (Test-Path $vsCodeSettings) {
        Get-ChildItem $vsCodeSettings -Recurse -Include "*al*" -Force | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "   ✅ Cleared VS Code AL workspace cache" -ForegroundColor Green
    }
}

# Clear cache if requested
if ($ClearCache) {
    Clear-ALCache
}

Write-Host "🔧 Verifying AL extension configuration..." -ForegroundColor Yellow

# Check if launch.json exists and has correct settings
$launchJsonPath = Join-Path $PSScriptRoot ".vscode\launch.json"
if (Test-Path $launchJsonPath) {
    $launchContent = Get-Content $launchJsonPath -Raw
    if ($launchContent -match "086c4475-d0ef-4d2b-871c-4e078a083db5") {
        Write-Host "   ✅ Tenant ID configured correctly" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Tenant ID may need updating" -ForegroundColor Yellow
    }
    
    if ($launchContent -match "businesscentral.dynamics.com") {
        Write-Host "   ✅ Server URL configured correctly" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Server URL may need updating" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠️  launch.json not found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 Ready to authenticate with Business Central!" -ForegroundColor Green
Write-Host ""

Write-Host "📋 AUTHENTICATION STEPS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. VS Code will open your existing extension project" -ForegroundColor White
Write-Host "2. In VS Code, press Ctrl + Shift + P" -ForegroundColor White
Write-Host "3. Type: AL: Clear credentials cache" -ForegroundColor Yellow
Write-Host "4. Press Ctrl + Shift + P again" -ForegroundColor White
Write-Host "5. Type: AL: Download symbols" -ForegroundColor Yellow
Write-Host "   (This will NOT create a new project)" -ForegroundColor Green
Write-Host ""
Write-Host "6. When prompted for connection details:" -ForegroundColor White
Write-Host "   Server: https://businesscentral.dynamics.com" -ForegroundColor Cyan
Write-Host "   Tenant: 086c4475-d0ef-4d2b-871c-4e078a083db5" -ForegroundColor Cyan
Write-Host "   Environment: Production" -ForegroundColor Cyan
Write-Host ""
Write-Host "7. Sign in with your Business Central account" -ForegroundColor White
Write-Host "8. Wait for symbols to download (2-3 minutes)" -ForegroundColor White
Write-Host "9. Press Ctrl + Shift + P and type: AL: Publish" -ForegroundColor Yellow
Write-Host ""

Write-Host "🔑 AUTHENTICATION BENEFITS:" -ForegroundColor Cyan
Write-Host "• Credentials cached for 8-12 hours" -ForegroundColor Green
Write-Host "• No new project windows" -ForegroundColor Green  
Write-Host "• Works with your existing extension" -ForegroundColor Green
Write-Host "• Secure Azure AD authentication" -ForegroundColor Green
Write-Host ""

$continue = Read-Host "Press Enter to open VS Code and start authentication"

Write-Host ""
Write-Host "🔄 Opening VS Code in your extension directory..." -ForegroundColor Yellow

# Open VS Code in the current directory (bc_extension)
Start-Process "code" -ArgumentList "." -WorkingDirectory $PSScriptRoot

Write-Host ""
Write-Host "✅ VS Code opened! Follow the authentication steps above." -ForegroundColor Green
Write-Host ""
Write-Host "💡 Tip: Use 'AL: Download symbols' not 'AL: Go!' to avoid new projects" -ForegroundColor Yellow
Write-Host ""

Read-Host "Press Enter when authentication and publishing is complete"
