@echo off
echo ========================================
echo  BC Online Symbol Download Fix
echo ========================================
echo.

echo ISSUE: BC Online API returning Internal Server Errors for symbol download
echo.
echo SOLUTIONS TO TRY:
echo.

echo 1. RETRY SYMBOL DOWNLOAD
echo    - Sometimes the BC Online API has temporary issues
echo    - Try: Ctrl+Shift+P -> "AL: Download Symbols" again
echo.

echo 2. CHECK BC ONLINE ENVIRONMENT VERSION
echo    - Your BC Online might be on a different version than 23.0.0.0
echo    - Login to: https://businesscentral.dynamics.com/086c4475-d0ef-4d2b-871c-4e078a083db5/Production
echo    - Go to Help ^& Support -> About to check the actual version
echo.

echo 3. USE DIFFERENT AUTHENTICATION
echo    - Clear VS Code authentication: Ctrl+Shift+P -> "Azure: Sign Out"
echo    - Sign in again with: admin@parliamentzw.onmicrosoft.com
echo.

echo 4. ALTERNATIVE: USE SANDBOX ENVIRONMENT
echo    - Changed launch.json to use Sandbox instead of Production
echo    - Production environments sometimes restrict symbol downloads
echo    - Sandbox is better for development
echo.

echo 5. MANUAL SYMBOL DOWNLOAD (If automated fails):
echo    - Download symbols from Microsoft's GitHub releases
echo    - URL: https://github.com/microsoft/ALAppExtensions/releases
echo    - Look for Business Central symbols matching your version
echo.

echo 6. VERSION COMPATIBILITY APPROACH:
echo    - Currently set to version 23.0.0.0 for better compatibility
echo    - If issues persist, we can try version 22.0.0.0
echo.

echo CURRENT CONFIGURATION:
echo - Tenant: 086c4475-d0ef-4d2b-871c-4e078a083db5
echo - Environment: Sandbox (changed from Production)
echo - Version: 23.0.0.0 (more stable than 26.0.0.0)
echo - Auth: admin@parliamentzw.onmicrosoft.com
echo.

echo NEXT STEPS:
echo 1. Try AL: Download Symbols again
echo 2. If fails, check actual BC version in your online environment
echo 3. Let me know the exact version, and I'll update app.json accordingly
echo.

pause
