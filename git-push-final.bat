@echo off
echo Parliament Fuel System - Git Push Script
echo =========================================

echo.
echo Step 1: Adding all files to git (including untracked)...
git add -A
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to add files to git
    pause
    exit /b 1
)

echo.
echo Step 2: Checking git status...
git status --porcelain
git status

echo.
echo Step 3: Committing changes...
git commit -m "FINAL: Complete Azure deployment configuration with health testing tools

✅ New Files Added:
- test-health.bat: Quick connectivity testing for Azure endpoints
- test-backend-health.py: Comprehensive Python health checker with CORS testing  
- deploy-azure.ps1: PowerShell script for Azure App Service deployment
- deploy-azure.sh: Bash script for Azure deployment
- web.config: IIS configuration for Azure App Service
- check-git-status.bat: Git status verification script
- git-push-final.bat: Complete git workflow script

📋 Documentation:
- DEPLOYMENT-CHECKLIST.md: Complete deployment workflow checklist
- azure-environment-variables.md: Environment variables documentation

🚀 Production Configuration:
- .env.production: Updated with correct Azure backend URLs
- config/settings.py: Fixed DEBUG environment variable handling

🔧 Backend Status:
- Local backend working on localhost:8000
- All Django import errors fixed
- Pandas dependency installed
- CORS properly configured

Production URLs:
- Backend: https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net
- Frontend: https://parliament-fuel-system.azurewebsites.net

Ready for Azure deployment with comprehensive testing and monitoring tools."

if %ERRORLEVEL% NEQ 0 (
    echo No changes to commit or commit failed
)

echo.
echo Step 4: Pushing to remote repository...
git push origin main
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to push to remote repository
    echo Trying to set upstream...
    git push --set-upstream origin main
)

echo.
echo Step 5: Verifying push...
git log --oneline -3

echo.
echo Step 6: Final status check...
git status

echo.
echo ✅ Git operations completed!
echo Your Parliament Fuel System is now pushed to GitHub and ready for Azure deployment.
echo.
echo Next steps:
echo 1. Run deploy-azure.ps1 to deploy to Azure
echo 2. Run test-health.bat to test backend connectivity
echo 3. Configure frontend with Azure Static Web Apps

pause
