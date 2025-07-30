# PowerShell script to test PostgreSQL connection
Write-Host "=== Azure PostgreSQL Connection Test ===" -ForegroundColor Green
Write-Host ""

# Test different hostname formats
$hostnames = @(
    "parliament-fuel-postgres.postgres.database.azure.com",
    "parliament-fuel-postgres.postgres.database.azure.com:5432"
)

foreach ($hostname in $hostnames) {
    Write-Host "Testing hostname: $hostname" -ForegroundColor Yellow
    
    try {
        $result = Test-NetConnection -ComputerName $hostname.Split(':')[0] -Port 5432 -WarningAction SilentlyContinue
        if ($result.TcpTestSucceeded) {
            Write-Host "✅ Port 5432 is accessible on $hostname" -ForegroundColor Green
        } else {
            Write-Host "❌ Port 5432 is NOT accessible on $hostname" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Error testing $hostname`: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "=== IP Whitelisting Check ===" -ForegroundColor Green
Write-Host "Your current public IP might need to be whitelisted in Azure PostgreSQL firewall."
Write-Host "To check your public IP, go to: https://whatismyipaddress.com/"
Write-Host ""

# Try to get current public IP
try {
    $publicIP = Invoke-RestMethod -Uri "https://api.ipify.org?format=text" -TimeoutSec 10
    Write-Host "Your current public IP is: $publicIP" -ForegroundColor Cyan
    Write-Host "Make sure this IP is added to the Azure PostgreSQL firewall rules." -ForegroundColor Yellow
} catch {
    Write-Host "Could not determine public IP automatically." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Green
Write-Host "1. Go to Azure Portal > PostgreSQL server > Networking"
Write-Host "2. Add your public IP to the firewall rules"
Write-Host "3. Ensure 'Allow public access from any Azure service' is enabled"
Write-Host "4. Try the connection test again"
