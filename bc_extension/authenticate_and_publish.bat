@echo off
cls
echo.
echo ==========================================
echo   PARLIAMENT FUEL SYSTEM - AUTHENTICATION
echo   Best Practice Method (No New Projects)
echo ==========================================
echo.

echo Step 1: Clearing any cached credentials...
echo.

echo Opening VS Code in your existing extension directory...
echo This will NOT create a new project!
echo.

echo ==========================================
echo   AUTHENTICATION STEPS IN VS CODE:
echo ==========================================
echo.
echo 1. Press Ctrl + Shift + P
echo 2. Type: AL: Clear credentials cache
echo 3. Press Enter to clear old credentials
echo.
echo 4. Press Ctrl + Shift + P again  
echo 5. Type: AL: Download symbols
echo    ^(This downloads symbols for YOUR existing extension^)
echo.
echo 6. When prompted, choose "Your own Business Central (Cloud)"
echo.
echo 7. Enter connection details:
echo    Server: https://businesscentral.dynamics.com
echo    Tenant: 086c4475-d0ef-4d2b-871c-4e078a083db5
echo    Environment: Production
echo.
echo 8. Sign in with your Business Central credentials
echo    ^(Same account you use for Business Central admin^)
echo.
echo 9. Wait for symbol download (2-3 minutes)
echo.
echo 10. After symbols are ready:
echo     Press Ctrl + Shift + P
echo     Type: AL: Publish
echo     Select "Parliament Production" configuration
echo.

pause

echo.
echo Opening VS Code now in your existing extension...
start "" code .

echo.
echo ==========================================
echo   IMPORTANT REMINDERS:
echo ==========================================
echo.
echo * Use "AL: Download symbols" NOT "AL: Go!"
echo * This keeps your existing project structure
echo * Authentication is cached for 8-12 hours
echo * No new windows should open
echo.

pause
