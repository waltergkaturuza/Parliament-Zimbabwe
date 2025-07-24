# Business Central Version Auto-Fixer
# This script tries different BC versions to find one that works

param(
    [string]$SpecificVersion = ""
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " BC VERSION AUTO-FIXER" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$appJsonPath = "app.json"

if (-not (Test-Path $appJsonPath)) {
    Write-Host "❌ app.json not found in current directory" -ForegroundColor Red
    exit 1
}

# Common BC Online versions to try
$versions = @(
    @{Version="26.0.0.0"; Runtime="26.0"; Name="2025 Release Wave 1"},
    @{Version="25.0.0.0"; Runtime="25.0"; Name="2024 Release Wave 2"},
    @{Version="24.0.0.0"; Runtime="24.0"; Name="2024 Release Wave 1"},
    @{Version="23.0.0.0"; Runtime="23.0"; Name="2023 Release Wave 2"},
    @{Version="22.0.0.0"; Runtime="22.0"; Name="2023 Release Wave 1"},
    @{Version="21.0.0.0"; Runtime="21.0"; Name="2022 Release Wave 2"}
)

function Update-BCVersion {
    param($Version, $Runtime)
    
    Write-Host "🔄 Updating app.json to version $Version..." -ForegroundColor Yellow
    
    $appJson = Get-Content $appJsonPath -Raw
    $appJson = $appJson -replace '"platform":\s*"[^"]*"', "`"platform`": `"$Version`""
    $appJson = $appJson -replace '"application":\s*"[^"]*"', "`"application`": `"$Version`""
    $appJson = $appJson -replace '"runtime":\s*"[^"]*"', "`"runtime`": `"$Runtime`""
    
    $appJson | Set-Content $appJsonPath -Encoding UTF8
    
    Write-Host "   ✅ Updated to version $Version" -ForegroundColor Green
}

function Clear-ALCache {
    Write-Host "🧹 Clearing AL cache..." -ForegroundColor Yellow
    
    if (Test-Path ".alpackages") {
        Remove-Item ".alpackages" -Recurse -Force
    }
    New-Item -ItemType Directory -Path ".alpackages" -Force | Out-Null
    
    Write-Host "   ✅ Cache cleared" -ForegroundColor Green
}

# If specific version provided, use it
if ($SpecificVersion) {
    $version = $versions | Where-Object { $_.Version -eq $SpecificVersion }
    if ($version) {
        Update-BCVersion $version.Version $version.Runtime
        Clear-ALCache
        Write-Host "✅ Updated to $SpecificVersion. Try downloading symbols now." -ForegroundColor Green
        exit 0
    } else {
        Write-Host "❌ Version $SpecificVersion not found in supported versions" -ForegroundColor Red
        exit 1
    }
}

Write-Host "🎯 Let's find the right Business Central version for your environment" -ForegroundColor Green
Write-Host ""

Write-Host "Available versions to try:" -ForegroundColor Cyan
for ($i = 0; $i -lt $versions.Count; $i++) {
    $v = $versions[$i]
    Write-Host "  $($i+1). $($v.Version) - $($v.Name)" -ForegroundColor White
}
Write-Host ""

# Check current version
$currentAppJson = Get-Content $appJsonPath -Raw | ConvertFrom-Json
Write-Host "Current version in app.json: $($currentAppJson.platform)" -ForegroundColor Yellow
Write-Host ""

Write-Host "Recommendation: Try versions in order from newest to oldest" -ForegroundColor Green
Write-Host ""

$choice = Read-Host "Enter version number to try (1-$($versions.Count)) or 'auto' to try all automatically"

if ($choice -eq "auto") {
    Write-Host ""
    Write-Host "🤖 Auto-trying versions from newest to oldest..." -ForegroundColor Cyan
    Write-Host ""
    
    foreach ($version in $versions) {
        Write-Host "Trying $($version.Version) - $($version.Name)..." -ForegroundColor Yellow
        
        Update-BCVersion $version.Version $version.Runtime
        Clear-ALCache
        
        Write-Host "Updated to $($version.Version). Please test symbol download in VS Code." -ForegroundColor Green
        Write-Host ""
        
        $result = Read-Host "Did symbol download work? (y/n/q to quit)"
        
        if ($result -eq "y") {
            Write-Host ""
            Write-Host "🎉 SUCCESS! Version $($version.Version) works!" -ForegroundColor Green
            Write-Host "Your extension is now configured for $($version.Name)" -ForegroundColor Green
            exit 0
        } elseif ($result -eq "q") {
            Write-Host "Stopping auto-try process" -ForegroundColor Yellow
            break
        }
        
        Write-Host "Continuing to next version..." -ForegroundColor Yellow
        Write-Host ""
    }
} else {
    $versionIndex = [int]$choice - 1
    if ($versionIndex -ge 0 -and $versionIndex -lt $versions.Count) {
        $selectedVersion = $versions[$versionIndex]
        Update-BCVersion $selectedVersion.Version $selectedVersion.Runtime
        Clear-ALCache
        
        Write-Host ""
        Write-Host "✅ Updated to $($selectedVersion.Version) - $($selectedVersion.Name)" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. In VS Code: Ctrl + Shift + P" -ForegroundColor White
        Write-Host "2. Type: AL: Clear credentials cache" -ForegroundColor White
        Write-Host "3. Type: AL: Download symbols" -ForegroundColor White
        Write-Host "4. Try authentication again" -ForegroundColor White
    } else {
        Write-Host "❌ Invalid choice" -ForegroundColor Red
    }
}

Write-Host ""
Read-Host "Press Enter to continue"
