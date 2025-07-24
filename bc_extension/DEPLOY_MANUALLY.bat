@echo off
cls
echo.
echo ================================================================
echo    Parliament Fuel System Extension - Manual Deployment
echo ================================================================
echo.
echo This guide will help you deploy your extension manually to bypass
echo the symbol download issues you've been experiencing.
echo.
pause

:STEP1
echo.
echo [STEP 1] Prepare VS Code
echo ========================================
echo.
echo 1. Make sure VS Code is closed
echo 2. Delete the .alpackages folder to start fresh
echo.
if exist ".alpackages" (
    echo Deleting existing .alpackages folder...
    rmdir /s /q ".alpackages"
    echo Done.
) else (
    echo .alpackages folder doesn't exist.
)
echo.
pause

:STEP2
echo.
echo [STEP 2] Open VS Code and Sign In
echo ========================================
echo.
echo 1. Open VS Code by running this command:
echo    code .
echo.
echo 2. In VS Code, press Ctrl+Shift+P
echo.
echo 3. Type "Azure: Sign In" and press Enter
echo.
echo 4. Sign in with your Business Central account in the browser
echo.
echo 5. Return to this window when signed in
echo.
start "" code .
pause

:STEP3
echo.
echo [STEP 3] Compile Extension Without Symbols
echo ========================================
echo.
echo Since symbol download is failing, we'll compile with minimal dependencies:
echo.
echo 1. In VS Code, press Ctrl+Shift+P
echo.
echo 2. Type "AL: Package" and press Enter
echo    (This creates the .app file without needing full symbols)
echo.
echo 3. If you get errors, try:
echo    - Press Ctrl+Shift+P
echo    - Type "Developer: Reload Window"
echo    - Try AL: Package again
echo.
echo 4. Look for a .app file created in your project folder
echo.
pause

:STEP4
echo.
echo [STEP 4] Manual Upload to Business Central
echo ========================================
echo.
echo Option A - Use VS Code AL: Publish:
echo -----------------------------------
echo 1. In VS Code, press Ctrl+Shift+P
echo 2. Type "AL: Publish" and press Enter
echo 3. Select your Production environment
echo 4. Wait for deployment
echo.
echo Option B - Manual Upload via BC Admin:
echo --------------------------------------
echo 1. Open: https://businesscentral.dynamics.com/086c4475-d0ef-4d2b-871c-4e078a083db5/Production
echo 2. Search for "Extension Management"
echo 3. Click "Upload Extension"
echo 4. Select the .app file from your project folder
echo 5. Follow the installation wizard
echo.
echo Which option would you like to try? (A/B)
set /p option="Enter A or B: "

if /i "%option%"=="A" (
    echo.
    echo Try AL: Publish in VS Code now...
    pause
) else (
    echo.
    echo Opening Business Central Admin Center...
    start "" "https://businesscentral.dynamics.com/086c4475-d0ef-4d2b-871c-4e078a083db5/Production"
    pause
)

:STEP5
echo.
echo [STEP 5] Verify Installation
echo ========================================
echo.
echo 1. Open Business Central
echo 2. Search for "Extension Management"
echo 3. Look for "Parliament Fuel Coupon System"
echo 4. Verify it shows as "Installed"
echo.
echo 5. Test by searching for "Fuel System Dashboard"
echo.
set /p success="Was the extension successfully installed? (Y/N): "

if /i "%success%"=="Y" (
    goto SUCCESS
) else (
    goto TROUBLESHOOT
)

:SUCCESS
echo.
echo ================================================================
echo                        SUCCESS!
echo ================================================================
echo.
echo Your Parliament Fuel System extension has been deployed!
echo.
echo Next steps:
echo 1. Configure Fuel System Setup
echo 2. Set up your Django integration URLs
echo 3. Test fuel transaction creation
echo.
echo Extension features available:
echo - Fuel System Dashboard (Page 50100)
echo - Fuel Transactions List (Page 50101) 
echo - Fuel Transaction Card (Page 50104)
echo - Fuel System Setup (Page 50112)
echo.
goto END

:TROUBLESHOOT
echo.
echo ================================================================
echo                     TROUBLESHOOTING
echo ================================================================
echo.
echo If deployment failed, try these options:
echo.
echo 1. Check AL extension output in VS Code:
echo    - View ^> Output ^> AL Language Extension
echo.
echo 2. Verify your permissions:
echo    - You need Extension Management rights in BC
echo.
echo 3. Try a different approach:
echo    - Use a Sandbox environment first
echo    - Contact your BC administrator
echo.
echo 4. Alternative: Manual symbol download:
echo    - Download symbols from BC Admin Center
echo    - Place in .alpackages folder
echo    - Retry compilation
echo.

:END
echo.
echo Deployment guide completed.
echo Press any key to exit...
pause >nul
