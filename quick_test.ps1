# Quick backend test script
$backendUrl = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"

Write-Host "Testing Parliament Fuel System Backend..." -ForegroundColor Green
Write-Host "URL: $backendUrl" -ForegroundColor Yellow

# Test basic connectivity
Write-Host "`nTesting basic connectivity..." -ForegroundColor Cyan
try {
    $startTime = Get-Date
    $response = Invoke-WebRequest -Uri $backendUrl -Method GET -UseBasicParsing -TimeoutSec 30
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalMilliseconds
    
    Write-Host "✅ SUCCESS: Status $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Response time: $($duration)ms" -ForegroundColor White
    Write-Host "   Content length: $($response.Content.Length) bytes" -ForegroundColor White
    
    # Try to parse as JSON
    try {
        $jsonData = $response.Content | ConvertFrom-Json
        Write-Host "   JSON Response: $($jsonData.message)" -ForegroundColor White
    } catch {
        Write-Host "   Response (first 200 chars): $($response.Content.Substring(0, [Math]::Min(200, $response.Content.Length)))" -ForegroundColor White
    }
} catch {
    Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "   HTTP Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
        Write-Host "   Status Description: $($_.Exception.Response.StatusDescription)" -ForegroundColor Red
    }
}

# Test health endpoint
Write-Host "`nTesting health endpoint..." -ForegroundColor Cyan
try {
    $healthUrl = "$backendUrl/api/health/"
    $response = Invoke-WebRequest -Uri $healthUrl -Method GET -UseBasicParsing -TimeoutSec 15
    Write-Host "✅ Health endpoint: Status $($response.StatusCode)" -ForegroundColor Green
    
    try {
        $healthData = $response.Content | ConvertFrom-Json
        Write-Host "   Status: $($healthData.status)" -ForegroundColor White
        Write-Host "   Database: $($healthData.database)" -ForegroundColor White
        Write-Host "   Debug: $($healthData.debug)" -ForegroundColor White
    } catch {
        Write-Host "   Raw response: $($response.Content)" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Health endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "   HTTP Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}

# Test login endpoint
Write-Host "`nTesting login endpoint..." -ForegroundColor Cyan
try {
    $loginUrl = "$backendUrl/api/auth/login/"
    $response = Invoke-WebRequest -Uri $loginUrl -Method GET -UseBasicParsing -TimeoutSec 15
    Write-Host "✅ Login endpoint accessible: Status $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Login endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "   HTTP Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}

Write-Host "`nTest completed." -ForegroundColor Yellow
