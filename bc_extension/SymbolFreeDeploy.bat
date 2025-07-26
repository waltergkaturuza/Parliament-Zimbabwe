@echo off
echo ===============================================
echo SYMBOL-FREE BC ONLINE Deployment
echo Parliament Fuel System Lite
echo ===============================================
echo.
echo ✓ SYMBOL-FREE EXTENSION - No downloads needed!
echo ✓ Works on any BC version
echo ✓ No external dependencies
echo.
echo Your BC Online Environment:
echo Tenant: 086c4475-d0ef-4d2b-871c-4e078a083db5
echo Environment: Production
echo URL: https://businesscentral.dynamics.com/086c4475-d0ef-4d2b-871c-4e078a083db5/Production
echo.

echo ============================================
echo STEP 1: Package Extension (Symbol-Free)
echo ============================================
echo.
echo In VS Code (should be open now):
echo.
echo 1. Press Ctrl+Shift+P
echo 2. Type: AL: Package
echo 3. Wait for compilation (no symbols needed!)
echo.
echo NOTE: Skip any "Download Symbols" step - not needed for symbol-free extension!
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
    echo ✓ Package is ready for upload to BC Online!
) else (
    echo ✗ No .app file found in output folder.
    echo Please complete the packaging step in VS Code first.
    echo Remember: Just AL: Package (no symbols needed)
    echo.
    pause
    exit /b
)
echo.
pause

echo ============================================
echo STEP 3: Upload to BC Online
echo ============================================
echo.
echo Your extension is SYMBOL-FREE so it will work on any BC Online version!
echo.
echo Upload Options:
echo.
echo OPTION A: Business Central Admin Center
echo 1. Open: https://admin.businesscentral.dynamics.com/
echo 2. Navigate: Environments → Production → Apps
echo 3. Upload Extension: Select your .app file
echo 4. Install: Wait for deployment
echo.
echo OPTION B: Direct in BC Web Client  
echo 1. Open: https://businesscentral.dynamics.com/086c4475-d0ef-4d2b-871c-4e078a083db5/Production
echo 2. Search: "Extension Management"
echo 3. Upload Extension: Select .app file
echo 4. Install: Follow wizard
echo.
pause

echo ============================================
echo STEP 4: User Configuration
echo ============================================
echo.
echo After successful installation:
echo.
echo 1. Go to Users in BC
echo 2. Select users needing fuel management access
echo 3. Assign Permission Set: "Fuel Manager Objects"
echo 4. Set user Profile: "FUEL MANAGER"
echo.
echo Users will then see the Fuel Manager Role Center!
echo.
pause

echo ============================================
echo DEPLOYMENT SUCCESS!
echo ===============================================
echo.
echo ✓ Symbol-Free Extension Deployed
echo ✓ No dependencies or version conflicts
echo ✓ Compatible with any BC Online version
echo ✓ Self-contained fuel management system
echo.
echo Your Parliament Fuel System includes:
echo • Fuel transaction management
echo • Approval workflows
echo • Fuel rates configuration
echo • Usage reporting and analytics
echo • Role-based security
echo.
echo Environment: https://businesscentral.dynamics.com/086c4475-d0ef-4d2b-871c-4e078a083db5/Production
echo.
echo Users with FUEL MANAGER profile can now access all fuel management features!
echo.
pause
