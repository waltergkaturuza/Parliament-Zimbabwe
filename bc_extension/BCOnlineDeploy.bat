@echo off
echo ===============================================
echo Parliament Fuel System - BC ONLINE Deployment
echo ===============================================
echo.
echo Your BC Online Environment:
echo Tenant: 086c4475-d0ef-4d2b-871c-4e078a083db5
echo Environment: Production
echo URL: https://businesscentral.dynamics.com/086c4475-d0ef-4d2b-871c-4e078a083db5/Production
echo.

echo ============================================
echo STEP 1: Package Extension
echo ============================================
echo.
echo VS Code should now be open with your extension.
echo.
echo Actions needed in VS Code:
echo 1. Press Ctrl+Shift+P
echo 2. Type: AL: Download Symbols (wait for completion)
echo 3. Press Ctrl+Shift+P again  
echo 4. Type: AL: Package (creates .app file)
echo.
echo The .app file will be created in the 'output' folder.
echo.
pause

echo ============================================
echo STEP 2: Check Package Created
echo ============================================
echo.
if exist "output\*.app" (
    echo ✓ Extension package found:
    dir output\*.app /b
    echo.
    echo Package is ready for upload!
) else (
    echo ✗ No .app file found in output folder.
    echo Please complete the packaging step in VS Code first.
    echo.
    pause
    exit /b
)
echo.
pause

echo ============================================
echo STEP 3: Deploy to BC Online
echo ============================================
echo.
echo Choose your deployment method:
echo.
echo METHOD A: Business Central Admin Center (Recommended)
echo 1. Open: https://admin.businesscentral.dynamics.com/
echo 2. Navigate: Environments → Production → Apps
echo 3. Click: Upload Extension
echo 4. Select your .app file from the output folder
echo 5. Click Deploy and wait for installation
echo.
echo METHOD B: Direct Upload in BC
echo 1. Open: https://businesscentral.dynamics.com/086c4475-d0ef-4d2b-871c-4e078a083db5/Production
echo 2. Search for: Extension Management
echo 3. Click: Upload Extension
echo 4. Select your .app file
echo 5. Follow installation wizard
echo.
pause

echo ============================================
echo STEP 4: Configure User Access
echo ============================================
echo.
echo After successful installation:
echo.
echo 1. In Business Central, go to Users
echo 2. Select users who need fuel management access
echo 3. Add Permission Set: "Fuel Manager Objects"
echo 4. Set user Profile to: "FUEL MANAGER"
echo.
pause

echo ============================================
echo STEP 5: Test Deployment
echo ============================================
echo.
echo Test these functions:
echo ✓ User can login and see Fuel Manager Role Center
echo ✓ Can create new fuel transaction
echo ✓ Can approve/reject transactions  
echo ✓ Can access fuel rates setup
echo ✓ Can generate summary reports
echo.
pause

echo ============================================
echo DEPLOYMENT COMPLETE!
echo ============================================
echo.
echo Your Parliament Fuel System is now deployed to BC Online!
echo.
echo Environment: https://businesscentral.dynamics.com/086c4475-d0ef-4d2b-871c-4e078a083db5/Production
echo.
echo Users with "FUEL MANAGER" profile can now access:
echo - Fuel transaction management
echo - Approval workflows
echo - Fuel rates configuration  
echo - Usage reports and analytics
echo.
echo For detailed documentation, see BC_ONLINE_DEPLOYMENT.md
echo.
pause
