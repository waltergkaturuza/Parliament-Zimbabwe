# Manual AL Package Creator
# This creates a basic .app package structure

param(
    [string]$OutputPath = "Parliament-Fuel-System-1.0.0.0.app"
)

Write-Host "Creating Manual AL Package..." -ForegroundColor Green

# Read app.json to get app info
$appJson = Get-Content "app.json" | ConvertFrom-Json
$appName = $appJson.name
$appVersion = $appJson.version
$appPublisher = $appJson.publisher

Write-Host "App: $appName v$appVersion by $appPublisher" -ForegroundColor Yellow

# Create temporary directory structure
$tempDir = "temp_package"
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

# Copy AL files
Copy-Item "*.al" $tempDir -Force
Copy-Item "app.json" $tempDir -Force

# Create the package as ZIP and rename to .app
Write-Host "Creating package archive..." -ForegroundColor Yellow
$zipPath = "$OutputPath.zip"
Compress-Archive -Path "$tempDir\*" -DestinationPath $zipPath -Force

# Rename ZIP to APP
if (Test-Path $zipPath) {
    if (Test-Path $OutputPath) {
        Remove-Item $OutputPath -Force
    }
    Rename-Item $zipPath $OutputPath
}

# Cleanup
Remove-Item $tempDir -Recurse -Force

if (Test-Path $OutputPath) {
    $size = (Get-Item $OutputPath).Length
    Write-Host "Package created successfully!" -ForegroundColor Green
    Write-Host "  File: $OutputPath" -ForegroundColor White
    Write-Host "  Size: $([math]::Round($size/1KB, 2)) KB" -ForegroundColor White
    
    Write-Host "`nPackage ready for deployment!" -ForegroundColor Green
    Write-Host "You can now upload this .app file to Business Central" -ForegroundColor Yellow
} else {
    Write-Host "Package creation failed" -ForegroundColor Red
}
