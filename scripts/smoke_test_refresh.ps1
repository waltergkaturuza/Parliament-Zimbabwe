# Smoke test: login, store tokens, force expired access, call protected endpoint to exercise refresh
# Usage: .\smoke_test_refresh.ps1 -ApiBase 'http://localhost:5176/api/v1' -Username 'subcenter_admin' -Password 'subc@123'
param(
  [string]$ApiBase = 'http://localhost:5176/api/v1',
  [string]$Username = 'subcenter_admin',
  [string]$Password = 'subc@123'
)

$loginUrl = "$ApiBase/auth/login/"
$refreshUrl = "$ApiBase/auth/refresh/"
$protected = "$ApiBase/boxes/"

Write-Host "Logging in to $loginUrl"
$body = @{ username = $Username; password = $Password } | ConvertTo-Json
try {
  $resp = Invoke-RestMethod -Uri $loginUrl -Method Post -ContentType 'application/json' -Body $body
  Write-Host "Login success. Received tokens (access length):" $resp.access_token.Length
  $access = $resp.access_token
  $refresh = $resp.refresh_token
} catch {
  Write-Host "Login failed:" $_.Exception.Message
  exit 1
}

# Store tokens in memory (simulate storage)
$global:access = $access
$global:refresh = $refresh

# Force expire access token
$global:access = $global:access.Substring(0,8) + 'EXPIRED'
Write-Host "Forced expired access token set. Length:" $global:access.Length

# Call protected endpoint with expired token
$headers = @{ Authorization = "Bearer $($global:access)" }
try {
  $p = Invoke-RestMethod -Uri $protected -Method Get -Headers $headers
  Write-Host "Protected call unexpectedly succeeded:", $p
} catch {
  Write-Host "Protected call failed as expected with expired token. Error:" $_.Exception.Message
  Write-Host "Attempting refresh..."
  # Call refresh
  $body = @{ refresh = $global:refresh } | ConvertTo-Json
  try {
    $r = Invoke-RestMethod -Uri $refreshUrl -Method Post -ContentType 'application/json' -Body $body
    Write-Host "Refresh success, new access length:" $r.access.Length
    $global:access = $r.access
    # Retry protected with new token
    $headers = @{ Authorization = "Bearer $($global:access)" }
    $p2 = Invoke-RestMethod -Uri $protected -Method Get -Headers $headers
    Write-Host "Retried protected succeeded:" ( ($p2 | ConvertTo-Json -Depth 2) )
  } catch {
    Write-Host "Refresh failed:" $_.Exception.Message
    exit 1
  }
}

Write-Host "Smoke test completed."
