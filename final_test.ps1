# Final backend test after critical fixes
Write-Host "=== CRITICAL FIXES VERIFICATION ===" -ForegroundColor Red
Write-Host "Testing backend after removing views directory conflict and fixing ALLOWED_HOSTS" -ForegroundColor Yellow

$backendUrl = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"

# Wait for restart
Write-Host "`nWaiting 45 seconds for app restart..." -ForegroundColor Yellow
Start-Sleep -Seconds 45

# Test multiple times to ensure consistency
for ($attempt = 1; $attempt -le 5; $attempt++) {
    Write-Host "`n--- Attempt $attempt ---" -ForegroundColor Cyan
    
    try {
        $startTime = Get-Date
        $response = Invoke-WebRequest -Uri $backendUrl -Method GET -UseBasicParsing -TimeoutSec 30
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalMilliseconds
        
        Write-Host "✅ SUCCESS: HTTP $($response.StatusCode)" -ForegroundColor Green
        Write-Host "   Response time: $([Math]::Round($duration))ms" -ForegroundColor White
        Write-Host "   Content length: $($response.Content.Length) bytes" -ForegroundColor White
        
        # Try to parse response
        try {
            $jsonData = $response.Content | ConvertFrom-Json
            Write-Host "   Message: $($jsonData.message)" -ForegroundColor White
            Write-Host "   Version: $($jsonData.version)" -ForegroundColor White
            Write-Host "   Endpoints: $($jsonData.endpoints -join ', ')" -ForegroundColor White
        } catch {
            $preview = $response.Content.Substring(0, [Math]::Min(100, $response.Content.Length))
            Write-Host "   Response preview: $preview" -ForegroundColor White
        }
        
        # If we get here, the backend is working
        Write-Host "`n🎉 BACKEND IS NOW WORKING! 🎉" -ForegroundColor Green -BackgroundColor DarkGreen
        break
        
    } catch {
        Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
        
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
            Write-Host "   HTTP Status: $statusCode" -ForegroundColor Red
            
            if ($statusCode -eq 500) {
                Write-Host "   Still getting 500 errors - import/configuration issue persists" -ForegroundColor Red
            } elseif ($statusCode -eq 400) {
                Write-Host "   400 error - possible ALLOWED_HOSTS issue" -ForegroundColor Red  
            }
        }
        
        if ($attempt -lt 5) {
            Write-Host "   Retrying in 15 seconds..." -ForegroundColor Yellow
            Start-Sleep -Seconds 15
        }
    }
}

# Test health endpoint if main endpoint works
Write-Host "`nTesting health endpoint..." -ForegroundColor Cyan
try {
    $healthUrl = "$backendUrl/api/health/"
    $response = Invoke-WebRequest -Uri $healthUrl -Method GET -UseBasicParsing -TimeoutSec 15
    Write-Host "✅ Health endpoint: HTTP $($response.StatusCode)" -ForegroundColor Green
    
    $healthData = $response.Content | ConvertFrom-Json
    Write-Host "   Status: $($healthData.status)" -ForegroundColor White
    Write-Host "   Database: $($healthData.database)" -ForegroundColor White
} catch {
    Write-Host "❌ Health endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Test completed ===" -ForegroundColor Yellow
