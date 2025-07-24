@echo off
echo Business Central Symbol Download Helper
echo =======================================
echo.
echo Current directory: %CD%
echo.
echo Cleaning symbol cache...
if exist .alpackages rmdir /s /q .alpackages
echo Cache cleaned.
echo.
echo Please follow these steps in VS Code:
echo 1. Open this folder in VS Code
echo 2. Press Ctrl+Shift+P to open Command Palette
echo 3. Type "AL: Download Symbols" and press Enter
echo 4. Wait for the download to complete
echo.
echo If you get authentication errors:
echo - Make sure you're signed in to Azure/Microsoft 365
echo - Check that your account has access to the Business Central environment
echo.
echo If symbols still fail to download, try:
echo - Restarting VS Code
echo - Checking your internet connection
echo - Verifying the tenant ID and environment name in launch.json
echo.
pause
