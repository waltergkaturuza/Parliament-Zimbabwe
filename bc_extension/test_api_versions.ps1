# Test BC API Version Availability
# This script tests which BC versions are accessible via the API

$tenant = "086c4475-d0ef-4d2b-871c-4e078a083db5"
$baseUrl = "https://api.businesscentral.dynamics.com/v2.0/Production/dev/packages"

$versionsToTest = @("26.3.0.0", "26.0.0.0", "25.0.0.0", "24.0.0.0", "23.0.0.0")

Write-Host "Testing Business Central API version availability..." -ForegroundColor Cyan
Write-Host "Tenant: $tenant`n" -ForegroundColor Yellow

foreach ($version in $versionsToTest) {
    Write-Host "Testing version $version..." -ForegroundColor White -NoNewline
    
    $testUrl = "$baseUrl?publisher=Microsoft&appName=Application&versionText=$version&tenant=$tenant"
    
    try {
        $response = Invoke-WebRequest -Uri $testUrl -Method Head -TimeoutSec 10 -ErrorAction Stop
        Write-Host " ✓ Available (Status: $($response.StatusCode))" -ForegroundColor Green
    } catch {
        $statusCode = $_.Exception.Response.StatusCode
        $errorMsg = $_.Exception.Message
        
        if ($statusCode -eq "InternalServerError") {
            Write-Host " ✗ Internal Server Error" -ForegroundColor Red
        } elseif ($statusCode -eq "NotFound") {
            Write-Host " ✗ Not Found" -ForegroundColor Yellow
        } elseif ($statusCode -eq "Unauthorized") {
            Write-Host " ? Unauthorized (might be available with proper auth)" -ForegroundColor Magenta
        } else {
            Write-Host " ✗ Error: $statusCode" -ForegroundColor Red
        }
    }
}

Write-Host "`nNote: 'Unauthorized' responses might indicate the version exists but requires authentication." -ForegroundColor Cyan
Write-Host "Internal Server Errors suggest the version is not available in the API." -ForegroundColor Yellow
