# Test backend status and configuration
Write-Host "Testing Parliament Fuel System Backend Status" -ForegroundColor Green
Write-Host "Backend URL: https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net" -ForegroundColor Yellow

# Test basic connectivity
Write-Host "`nTesting basic connectivity..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net/" -Method GET -UseBasicParsing -TimeoutSec 30
    Write-Host "✅ Basic connectivity: SUCCESS" -ForegroundColor Green
    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor White
    Write-Host "Content Length: $($response.Content.Length)" -ForegroundColor White
} catch {
    Write-Host "❌ Basic connectivity: FAILED" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}

# Test API endpoints
$endpoints = @(
    "/api/auth/login/",
    "/api/users/me/",
    "/api/health/",
    "/admin/"
)

Write-Host "`nTesting API endpoints..." -ForegroundColor Cyan
foreach ($endpoint in $endpoints) {
    $url = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net$endpoint"
    try {
        $response = Invoke-WebRequest -Uri $url -Method GET -UseBasicParsing -TimeoutSec 10
        Write-Host "✅ $endpoint - Status: $($response.StatusCode)" -ForegroundColor Green
    } catch {
        $statusCode = "Unknown"
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
        }
        Write-Host "❌ $endpoint - Status: $statusCode - Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`nTest completed." -ForegroundColor Yellow
