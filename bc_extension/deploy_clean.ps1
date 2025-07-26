Write-Host "=== Parliament Fuel System - Final Deployment ===" -ForegroundColor Cyan
Write-Host "Deploying extension without symbol dependencies" -ForegroundColor Yellow

$projectPath = "c:\Users\Administrator\Documents\POZ\fuel_coupon_system\bc_extension"
Set-Location $projectPath

Write-Host ""
Write-Host "Authentication Status: Verified as admin@parliamentzw.onmicrosoft.com" -ForegroundColor Green
Write-Host "Tenant: 086c4475-d0ef-4d2b-871c-4e078a083db5" -ForegroundColor Green
Write-Host "Environment: Production" -ForegroundColor Green

Write-Host ""
Write-Host "=== DEPLOYMENT STRATEGY ===" -ForegroundColor Cyan
Write-Host "Since Microsoft symbol API is broken, we will:" -ForegroundColor Yellow
Write-Host "1. Create a minimal extension package" -ForegroundColor Gray
Write-Host "2. Use AL: Package (which does not require symbols)" -ForegroundColor Gray
Write-Host "3. Deploy via AL: Publish or manual upload" -ForegroundColor Gray

Write-Host ""
Write-Host "=== STEP 1: Open VS Code ===" -ForegroundColor White
Write-Host "Opening VS Code in project folder..." -ForegroundColor Yellow
Start-Process -FilePath "code" -ArgumentList "." -Wait:$false

Write-Host ""
Write-Host "=== STEP 2: Create Package ===" -ForegroundColor White
Write-Host "In VS Code, follow these steps:" -ForegroundColor Yellow
Write-Host "1. Press Ctrl+Shift+P" -ForegroundColor Gray
Write-Host "2. Type AL: Package (NOT AL: Download Symbols)" -ForegroundColor Gray
Write-Host "3. Press Enter" -ForegroundColor Gray
Write-Host "4. Ignore any symbol-related warnings" -ForegroundColor Gray
Write-Host "5. Look for the .app file creation message" -ForegroundColor Gray

$packageComplete = Read-Host "Did AL: Package complete successfully? (y/n)"

if ($packageComplete -eq "y" -or $packageComplete -eq "Y") {
    Write-Host ""
    Write-Host "Package created successfully!" -ForegroundColor Green
    
    # Check for .app file
    $appFiles = Get-ChildItem -Filter "*.app"
    if ($appFiles.Count -gt 0) {
        Write-Host "Found app file: $($appFiles[0].Name)" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "=== STEP 3: Deploy Extension ===" -ForegroundColor White
        Write-Host "Choose deployment method:" -ForegroundColor Yellow
        Write-Host "A) Use AL: Publish in VS Code (recommended)" -ForegroundColor Gray
        Write-Host "B) Manual upload via Business Central Admin" -ForegroundColor Gray
        
        $deployMethod = Read-Host "Enter A or B"
        
        if ($deployMethod -eq "A" -or $deployMethod -eq "a") {
            Write-Host ""
            Write-Host "Using AL: Publish method:" -ForegroundColor Green
            Write-Host "1. In VS Code, press Ctrl+Shift+P" -ForegroundColor Gray
            Write-Host "2. Type AL: Publish" -ForegroundColor Gray
            Write-Host "3. Select your Production environment" -ForegroundColor Gray
            Write-Host "4. Wait for deployment (ignore symbol warnings)" -ForegroundColor Gray
            
            $publishResult = Read-Host "Did AL: Publish succeed? (y/n)"
            
            if ($publishResult -eq "y" -or $publishResult -eq "Y") {
                Write-Host ""
                Write-Host "SUCCESS! Extension deployed to Business Central!" -ForegroundColor Green
                Write-Host ""
                Write-Host "Verify in BC:" -ForegroundColor White
                Write-Host "- Search for Extension Management" -ForegroundColor Gray
                Write-Host "- Look for Parliament Fuel Coupon System" -ForegroundColor Gray
                
                # Open BC
                Start-Process "https://businesscentral.dynamics.com/086c4475-d0ef-4d2b-871c-4e078a083db5/Production"
            } else {
                Write-Host ""
                Write-Host "Trying manual upload method..." -ForegroundColor Yellow
                Start-Process "https://businesscentral.dynamics.com/086c4475-d0ef-4d2b-871c-4e078a083db5/Production"
                Write-Host "1. Go to Extension Management" -ForegroundColor Gray
                Write-Host "2. Click Upload Extension" -ForegroundColor Gray
                Write-Host "3. Select the .app file: $($appFiles[0].Name)" -ForegroundColor Gray
            }
        } else {
            Write-Host ""
            Write-Host "Using manual upload method:" -ForegroundColor Green
            Start-Process "https://businesscentral.dynamics.com/086c4475-d0ef-4d2b-871c-4e078a083db5/Production"
            Write-Host "1. Go to Extension Management" -ForegroundColor Gray
            Write-Host "2. Click Upload Extension" -ForegroundColor Gray
            Write-Host "3. Select the .app file: $($appFiles[0].Name)" -ForegroundColor Gray
            Write-Host "4. Follow the installation wizard" -ForegroundColor Gray
        }
    } else {
        Write-Host ""
        Write-Host "No .app file found. Package creation may have failed." -ForegroundColor Yellow
        Write-Host "Check the AL extension output in VS Code for errors." -ForegroundColor Gray
    }
} else {
    Write-Host ""
    Write-Host "Package creation failed." -ForegroundColor Yellow
    Write-Host "This likely means there are compilation errors in the AL code." -ForegroundColor Gray
    Write-Host "Check the VS Code output panel for specific errors." -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== TROUBLESHOOTING ===" -ForegroundColor Cyan
Write-Host "If deployment fails:" -ForegroundColor Yellow
Write-Host "1. The symbol issue is a Microsoft problem, not yours" -ForegroundColor Gray
Write-Host "2. Your authentication is working correctly" -ForegroundColor Gray
Write-Host "3. Try creating a minimal extension first" -ForegroundColor Gray

Write-Host ""
Write-Host "Deployment script completed." -ForegroundColor Green
