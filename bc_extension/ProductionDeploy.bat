@echo off
echo ===============================================
echo Parliament Fuel System - PRODUCTION DEPLOYMENT
echo ===============================================
echo.
echo WARNING: This will deploy to PRODUCTION Business Central!
echo.

set /p CONFIRM="Are you sure you want to continue? (Type YES to proceed): "
if /i not "%CONFIRM%"=="YES" (
    echo Deployment cancelled.
    pause
    exit /b
)

echo.
echo ============================================
echo PRODUCTION DEPLOYMENT CHECKLIST
echo ============================================
echo.

set /p BACKUP="1. Have you created a full system backup? (Y/N): "
if /i not "%BACKUP%"=="Y" (
    echo ERROR: Please create a full backup before proceeding.
    echo Deployment cancelled for safety.
    pause
    exit /b
)

set /p STAGING="2. Have you tested in staging environment? (Y/N): "
if /i not "%STAGING%"=="Y" (
    echo WARNING: It's highly recommended to test in staging first.
    set /p CONTINUE="Continue anyway? (Y/N): "
    if /i not "%CONTINUE%"=="Y" (
        echo Deployment cancelled.
        pause
        exit /b
    )
)

set /p INSTANCE="3. Enter your BC Server Instance name (e.g., BC): "
if "%INSTANCE%"=="" (
    echo ERROR: BC Instance name is required.
    pause
    exit /b
)

echo.
echo ============================================
echo DEPLOYMENT CONFIGURATION
echo ============================================
echo BC Server Instance: %INSTANCE%
echo Extension: Parliament Fuel System Lite v1.0.0.0
echo Object ID Range: 50110-50149
echo.

set /p FINAL="Ready to deploy? (Type DEPLOY to continue): "
if /i not "%FINAL%"=="DEPLOY" (
    echo Deployment cancelled.
    pause
    exit /b
)

echo.
echo ============================================
echo DEPLOYMENT STEPS
echo ============================================
echo.

echo Step 1: Package Extension in VS Code
echo =====================================
echo 1. VS Code should be open with your extension
echo 2. Press Ctrl+Shift+P
echo 3. Type: AL: Package
echo 4. Wait for compilation to complete
echo.
pause

echo Step 2: Locate the .app file
echo =============================
echo The .app file should be in the 'output' folder
echo Default location: %CD%\output\
echo.
if exist "output" (
    echo Found output folder. Contents:
    dir output\*.app /b 2>nul
) else (
    echo Output folder not found. Please package the extension first.
)
echo.
pause

echo Step 3: Deploy to Business Central
echo ===================================
echo.
echo Open Business Central Administration Shell as Administrator
echo Then run these commands (replace paths as needed):
echo.
echo 1. Publish-NAVApp -ServerInstance "%INSTANCE%" -Path "PATH_TO_YOUR_APP_FILE"
echo 2. Sync-NAVApp -ServerInstance "%INSTANCE%" -Name "Parliament Fuel System Lite"
echo 3. Install-NAVApp -ServerInstance "%INSTANCE%" -Name "Parliament Fuel System Lite"
echo.
pause

echo Step 4: Configure User Access
echo ==============================
echo.
echo In Business Central Web Client:
echo 1. Go to Users
echo 2. Select users who need access
echo 3. Add Permission Set: "Fuel Manager Objects"
echo 4. Set Profile to: "FUEL MANAGER"
echo.
pause

echo Step 5: Validate Deployment
echo ============================
echo.
echo Test the following:
echo 1. User can login and see Fuel Manager Role Center
echo 2. Can create a fuel transaction
echo 3. Can approve/reject transactions
echo 4. Can access fuel rates setup
echo 5. Can generate reports
echo.
pause

echo ============================================
echo DEPLOYMENT COMPLETE!
echo ============================================
echo.
echo Your Parliament Fuel System has been deployed to production.
echo.
echo Important reminders:
echo - Monitor system performance for the first 24 hours
echo - Provide user training as needed
echo - Keep deployment documentation updated
echo.
echo For issues or rollback, see PRODUCTION_DEPLOYMENT.md
echo.
pause
