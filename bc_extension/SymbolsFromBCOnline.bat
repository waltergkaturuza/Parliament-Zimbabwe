@echo off
echo ================================================
echo BC ONLINE SYMBOL DOWNLOAD - READY TO PROCEED
echo Parliament Fuel System Lite
echo ================================================
echo.

echo ✅ CONFIGURATION UPDATED FOR YOUR BC ONLINE:
echo.
echo Environment: Production
echo Tenant: 086c4475-d0ef-4d2b-871c-4e078a083db5
echo BC Version: 26.3 (Updated in app.json)
echo URL: https://businesscentral.dynamics.com/086c4475-d0ef-4d2b-871c-4e078a083db5/Production
echo.

echo ================================================
echo STEP 1: DOWNLOAD SYMBOLS FROM BC ONLINE
echo ================================================
echo.

echo Now VS Code is configured to download symbols from YOUR BC Online environment
echo instead of trying to connect to localhost.
echo.

echo IN VS CODE (do this now):
echo 1. Press Ctrl+Shift+P
echo 2. Type: AL: Download Symbols
echo 3. You may be prompted to authenticate with your BC Online account
echo 4. Wait for symbols to download (5-10 minutes)
echo.

echo You should see progress like:
echo "Downloading symbols from BC Online environment..."
echo "Tenant: 086c4475-d0ef-4d2b-871c-4e078a083db5"
echo.

echo ================================================
echo STEP 2: AFTER SYMBOLS DOWNLOAD
echo ================================================
echo.

echo Once symbols finish downloading:
echo 1. Press Ctrl+Shift+P
echo 2. Type: AL: Package
echo 3. Extension will compile successfully
echo 4. Upload the .app file to BC Online
echo.

echo ================================================
echo AUTHENTICATION
echo ================================================
echo.

echo If prompted for authentication, use:
echo Account: admin@parliamentzw.onmicrosoft.com
echo (The same account you use for BC Online access)
echo.

echo ================================================
echo READY TO PROCEED!
echo ================================================
echo.

echo Your extension is now properly configured for BC Online.
echo Go to VS Code and download symbols from your actual environment!
echo.

pause
