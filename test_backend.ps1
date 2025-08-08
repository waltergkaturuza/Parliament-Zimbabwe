# Backend health check script for PowerShell

Write-Host "=============================================="
Write-Host "   PARLIAMENT FUEL SYSTEM - BACKEND TEST"
Write-Host "=============================================="
Write-Host ""

$BACKEND_URL = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"

Write-Host "Testing backend URL: $BACKEND_URL"
Write-Host ""

# Test 1: Health endpoint
Write-Host "1. Testing health endpoint..."
try {
    $response = Invoke-RestMethod -Uri "$BACKEND_URL/api/health/" -Method GET -Headers @{
        "Accept" = "application/json"
    }
    Write-Host "✅ Health check successful: $($response | ConvertTo-Json)"
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)"
}

Write-Host ""

# Test 2: CORS preflight
Write-Host "2. Testing CORS preflight for login..."
try {
    $headers = @{
        "Origin" = "https://jolly-ocean-0e0dee90f.2.azurestaticapps.net"
        "Access-Control-Request-Method" = "POST"
        "Access-Control-Request-Headers" = "Content-Type"
    }
    $response = Invoke-WebRequest -Uri "$BACKEND_URL/api/auth/login/" -Method OPTIONS -Headers $headers
    Write-Host "✅ CORS preflight successful. Status: $($response.StatusCode)"
    Write-Host "CORS Headers: $($response.Headers['Access-Control-Allow-Origin'])"
} catch {
    Write-Host "❌ CORS preflight failed: $($_.Exception.Message)"
}

Write-Host ""

# Test 3: CSRF token
Write-Host "3. Testing CSRF token endpoint..."
try {
    $response = Invoke-RestMethod -Uri "$BACKEND_URL/api/csrf/" -Method GET -Headers @{
        "Accept" = "application/json"
        "Origin" = "https://jolly-ocean-0e0dee90f.2.azurestaticapps.net"
    }
    Write-Host "✅ CSRF token successful: $($response | ConvertTo-Json)"
} catch {
    Write-Host "❌ CSRF endpoint failed: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "=============================================="
Write-Host "   TEST COMPLETE"
Write-Host "=============================================="

# Check if login endpoint is responding
Write-Host ""
Write-Host "4. Testing login endpoint structure..."
try {
    $response = Invoke-WebRequest -Uri "$BACKEND_URL/api/auth/login/" -Method GET
    Write-Host "✅ Login endpoint reachable. Status: $($response.StatusCode)"
} catch {
    Write-Host "❌ Login endpoint failed: $($_.Exception.Message)"
}

Read-Host "Press Enter to exit"
