# Runs Django migrations locally using the local settings
param(
    [string]$AppPath = "."
)

Write-Host "Running local migrations..." -ForegroundColor Cyan

# Ensure we use local settings
$env:DJANGO_SETTINGS_MODULE = 'config.settings.local'

# Switch to the app directory
Set-Location -Path $AppPath

# Run migrations
python manage.py migrate --settings=config.settings.local

if ($LASTEXITCODE -ne 0) {
    Write-Error "Migrations failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

Write-Host "Migrations completed successfully." -ForegroundColor Green
