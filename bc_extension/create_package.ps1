# PowerShell script to create AL Package
Write-Host "Creating Business Central AL Package..." -ForegroundColor Green

# Ensure .alpackages directory exists
if (!(Test-Path ".alpackages")) {
    New-Item -ItemType Directory -Path ".alpackages" -Force
}

Write-Host "Project Directory: $(Get-Location)" -ForegroundColor Yellow

# Check if AL files exist
$alFiles = Get-ChildItem -Path "." -Filter "*.al"
Write-Host "Found $($alFiles.Count) AL files:" -ForegroundColor Yellow
foreach ($file in $alFiles) {
    Write-Host "  - $($file.Name)" -ForegroundColor White
}

# Check app.json
if (Test-Path "app.json") {
    Write-Host "✓ app.json found" -ForegroundColor Green
} else {
    Write-Host "✗ app.json missing" -ForegroundColor Red
    exit 1
}

Write-Host "Opening VS Code with AL extension..." -ForegroundColor Green
Write-Host "Please use Ctrl+Shift+P and run 'AL: Package' command" -ForegroundColor Yellow

# Open VS Code
Start-Process -FilePath "code" -ArgumentList "." -Wait

Write-Host "Package creation completed. Check for .app files in this directory." -ForegroundColor Green
