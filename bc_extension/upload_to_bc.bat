@echo off
echo.
echo ========================================
echo  PARLIAMENT FUEL SYSTEM BC EXTENSION
echo  VS Code Upload Assistant
echo ========================================
echo.

echo Opening VS Code in BC Extension directory...
echo.

echo NEXT STEPS IN VS CODE:
echo.
echo 1. Press Ctrl + Shift + P
echo 2. Type: AL: Go!
echo 3. Choose "Your own Business Central (Cloud)"
echo    - Tenant: 086c4475-d0ef-4d2b-871c-4e078a083db5
echo    - Environment: Production
echo.
echo 4. You will be prompted to sign in with Azure AD
echo 5. After authentication, press Ctrl + Shift + P again
echo 6. Type: AL: Publish
echo 6. Wait for upload completion
echo.
echo Your extension package is ready:
echo File: Parliament-Fuel-System-1.0.0.0.app
echo Size: 11.3 KB
echo.

pause

echo Opening VS Code now...
start "" code .

echo.
echo VS Code is opening with your BC extension!
echo Follow the steps above to upload to Business Central.
echo.
pause
