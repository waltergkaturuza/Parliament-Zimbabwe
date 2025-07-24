@echo off
echo.
echo ========================================
echo  CLEARING AL EXTENSION CACHE
echo ========================================
echo.

echo Clearing AL package cache...
rd /s /q ".alpackages" 2>nul
mkdir ".alpackages"

echo.
echo Clearing VS Code workspace cache...
rd /s /q ".vscode\.alsettings" 2>nul

echo.
echo Cache cleared successfully!
echo.
echo ========================================
echo  PARLIAMENT FUEL SYSTEM BC EXTENSION
echo  VS Code Upload Assistant (CLEAN START)
echo ========================================
echo.

echo Opening VS Code in BC Extension directory...
echo.

echo IMPORTANT: STEP BY STEP GUIDE (EXISTING EXTENSION)
echo.
echo 1. When VS Code opens, press Ctrl + Shift + P
echo 2. Type: AL: Clear credentials cache
echo 3. Press Enter to clear old credentials
echo.
echo 4. Press Ctrl + Shift + P again
echo 5. Type: AL: Download symbols
echo    (NOT "AL: Go!" - that creates new projects)
echo.
echo 6. If prompted for connection details:
echo    Server URL: https://businesscentral.dynamics.com
echo    Tenant: 086c4475-d0ef-4d2b-871c-4e078a083db5
echo    Environment: Production
echo.
echo 7. Sign in with your Business Central credentials
echo 8. Wait for symbol download to complete
echo.
echo 9. After symbols are downloaded successfully:
echo    Press Ctrl + Shift + P
echo    Type: AL: Publish
echo.
echo 10. Choose "Parliament Production" from launch configuration
echo.

pause

echo Opening VS Code now...
start "" code .

echo.
echo VS Code is opening with cleared cache!
echo Follow the STEP BY STEP GUIDE above carefully.
echo.
pause
