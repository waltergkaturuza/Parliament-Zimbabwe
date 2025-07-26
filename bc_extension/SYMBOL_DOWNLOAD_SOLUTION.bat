@echo off
echo ================================================
echo Business Central Symbol Download - Final Solution
echo ================================================
echo.
echo The issue appears to be related to API version availability
echo and potentially authentication with your BC environment.
echo.
echo CURRENT STATUS:
echo - Version 26.3.0.0: Internal Server Error (not available)
echo - Version 24.0.0.0: Unauthorized (available but needs auth)
echo - Your app.json is now configured for 26.3.0.0
echo.
echo SOLUTION STEPS:
echo.
echo 1. AUTHENTICATION CHECK:
echo    - Open VS Code
echo    - Press Ctrl+Shift+P
echo    - Type "Azure: Sign In" and ensure you're signed in
echo    - Verify your account has BC developer permissions
echo.
echo 2. TRY SYMBOL DOWNLOAD:
echo    - In VS Code, press Ctrl+Shift+P
echo    - Type "AL: Download Symbols"
echo    - Wait for completion
echo.
echo 3. IF STILL FAILING, TRY OFFLINE DEVELOPMENT:
echo    - Download symbols manually from BC Admin Center
echo    - Go to: https://businesscentral.dynamics.com/086c4475-d0ef-4d2b-871c-4e078a083db5/Production
echo    - Navigate to Extension Management
echo    - Download symbol packages manually
echo    - Place them in the .alpackages folder
echo.
echo 4. ALTERNATIVE APPROACH - Use BC Container:
echo    - Set up a local BC development container
echo    - This provides offline symbol access
echo.
echo MICROSOFT SUPPORT REFERENCE:
echo If you need to contact Microsoft Support, provide these IDs:
echo Request IDs: 901ffa10-55a7-4340-8fae-226d494a57af
echo Session ID: 80ff1bbc-7c29-4411-85b4-1c73653b34db
echo.
echo Press any key to open VS Code in this folder...
pause > nul
code .
