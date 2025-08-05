# Parliament Fuel System - Local Deployment Verification
# PowerShell version of the deployment verification script

param(
    [string]$BackendUrl = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net",
    [string]$FrontendUrl = "https://jolly-ocean-0e0dee90f.2.azurestaticapps.net",
    [int]$Timeout = 30
)

$TotalTests = 0
$PassedTests = 0
$FailedTests = 0

# Function to write colored output
function Write-TestResult {
    param(
        [string]$Message,
        [string]$Status,
        [string]$Details = ""
    )
    
    $global:TotalTests++
    
    switch ($Status) {
        "PASS" { 
            Write-Host "✅ $Message" -ForegroundColor Green
            $global:PassedTests++
        }
        "FAIL" { 
            Write-Host "❌ $Message" -ForegroundColor Red
            $global:FailedTests++
            if ($Details) { Write-Host "   $Details" -ForegroundColor Yellow }
        }
        "WARN" { 
            Write-Host "⚠️ $Message" -ForegroundColor Yellow
        }
        "INFO" { 
            Write-Host "ℹ️ $Message" -ForegroundColor Cyan
        }
    }
}

# Function to test HTTP endpoint
function Test-Endpoint {
    param(
        [string]$Url,
        [string]$Description,
        [int]$ExpectedStatus = 200,
        [string]$Method = "GET"
    )
    
    try {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        
        if ($Method -eq "GET") {
            $response = Invoke-WebRequest -Uri $Url -Method $Method -TimeoutSec $Timeout -UseBasicParsing
        } else {
            $response = Invoke-WebRequest -Uri $Url -Method $Method -TimeoutSec $Timeout -UseBasicParsing
        }
        
        $stopwatch.Stop()
        
        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-TestResult "$Description (${Method})" "PASS" "Status: $($response.StatusCode), Time: $($stopwatch.ElapsedMilliseconds)ms"
        } else {
            Write-TestResult "$Description (${Method})" "FAIL" "Expected: $ExpectedStatus, Got: $($response.StatusCode)"
        }
    }
    catch {
        Write-TestResult "$Description (${Method})" "FAIL" "Error: $($_.Exception.Message)"
    }
}

# Function to test CORS
function Test-CORS {
    param(
        [string]$Url,
        [string]$Origin,
        [string]$Description
    )
    
    try {
        $headers = @{
            "Origin" = $Origin
            "Access-Control-Request-Method" = "POST"
            "Access-Control-Request-Headers" = "Content-Type,Authorization"
        }
        
        $response = Invoke-WebRequest -Uri $Url -Method OPTIONS -Headers $headers -TimeoutSec $Timeout -UseBasicParsing
        
        if ($response.Headers.Keys -contains "Access-Control-Allow-Origin") {
            Write-TestResult $Description "PASS"
        } else {
            Write-TestResult $Description "FAIL" "No CORS headers found"
        }
    }
    catch {
        Write-TestResult $Description "FAIL" "CORS preflight failed: $($_.Exception.Message)"
    }
}

# Main verification
Write-Host "🏛️ Parliament Fuel System - Deployment Verification" -ForegroundColor Blue
Write-Host "=" * 60
Write-Host "Backend URL: $BackendUrl"
Write-Host "Frontend URL: $FrontendUrl"
Write-Host "Timeout: ${Timeout}s"
Write-Host ""

Write-Host "🔌 Basic Connectivity Tests" -ForegroundColor Blue
Write-Host "-" * 30
Test-Endpoint $BackendUrl "Backend root endpoint"
Test-Endpoint "$BackendUrl/health/simple/" "Simple health check"
Test-Endpoint "$BackendUrl/health/" "Detailed health check"
Test-Endpoint $FrontendUrl "Frontend availability"

Write-Host ""
Write-Host "🔌 API Endpoint Tests" -ForegroundColor Blue
Write-Host "-" * 22
Test-Endpoint "$BackendUrl/api/" "API root endpoint"
Test-Endpoint "$BackendUrl/admin/" "Django admin interface"
Test-Endpoint "$BackendUrl/api/schema/" "API schema endpoint"

Write-Host ""
Write-Host "🌐 CORS Configuration Tests" -ForegroundColor Blue
Write-Host "-" * 30
Test-CORS "$BackendUrl/api/" $FrontendUrl "CORS from frontend to API"
Test-CORS "$BackendUrl/health/" $FrontendUrl "CORS from frontend to health"

Write-Host ""
Write-Host "🔐 Authentication Tests" -ForegroundColor Blue
Write-Host "-" * 24
Test-Endpoint "$BackendUrl/api/auth/login/" "Login endpoint" 405  # Should return 405 for GET
Test-Endpoint "$BackendUrl/api/token/refresh/" "Token refresh endpoint" 401  # Should require auth

Write-Host ""
Write-Host "🔒 Security Tests" -ForegroundColor Blue
Write-Host "-" * 17
if ($BackendUrl.StartsWith("https://")) {
    try {
        $response = Invoke-WebRequest -Uri "$BackendUrl/health/simple/" -UseBasicParsing -TimeoutSec 10
        Write-TestResult "SSL certificate validation" "PASS"
    }
    catch {
        Write-TestResult "SSL certificate validation" "FAIL" $_.Exception.Message
    }
} else {
    Write-TestResult "SSL configuration" "WARN" "Backend not using HTTPS"
}

# Performance test
Write-Host ""
Write-Host "⚡ Performance Tests" -ForegroundColor Blue
Write-Host "-" * 20
$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
try {
    Invoke-WebRequest -Uri "$BackendUrl/health/simple/" -UseBasicParsing -TimeoutSec $Timeout | Out-Null
    $stopwatch.Stop()
    $responseTime = $stopwatch.ElapsedMilliseconds
    
    if ($responseTime -lt 5000) {
        Write-TestResult "Response time test" "PASS" "${responseTime}ms"
    } else {
        Write-TestResult "Response time test" "WARN" "${responseTime}ms (may be slow)"
    }
}
catch {
    Write-TestResult "Response time test" "FAIL" $_.Exception.Message
}

# Summary
Write-Host ""
Write-Host "=" * 60
Write-Host "📊 Verification Summary" -ForegroundColor Blue
Write-Host "=" * 60
Write-Host "Total Tests: $TotalTests"
Write-Host "Passed: $PassedTests" -ForegroundColor Green
Write-Host "Failed: $FailedTests" -ForegroundColor Red

if ($FailedTests -eq 0) {
    Write-Host "✅ All tests passed! Deployment appears successful." -ForegroundColor Green
    exit 0
} elseif ($FailedTests -lt 3) {
    Write-Host "⚠️ Some tests failed, but deployment may be functional." -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "❌ Multiple tests failed. Deployment needs attention." -ForegroundColor Red
    exit 2
}
