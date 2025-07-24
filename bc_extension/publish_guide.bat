@echo off
echo.
echo =================================================
echo == Business Central Extension Deployment Guide ==
echo =================================================
echo.
echo This guide will walk you through deploying your extension to the cloud.
echo Make sure you have saved all your file changes in VS Code.
echo.

:AUTHENTICATE
echo [STEP 1: AUTHENTICATION]
echo.
echo - Open the Command Palette in VS Code (Ctrl+Shift+P).
echo - Type "Azure: Sign In" and press Enter.
echo - Follow the prompts in your browser to sign in with the account
echo   that has access to your Business Central environment.
echo.
pause
echo.

:BUILD
echo [STEP 2: BUILD THE EXTENSION]
echo.
echo - Open the Command Palette in VS Code (Ctrl+Shift+P).
echo - Type "Tasks: Run Build Task" and press Enter (or just press Ctrl+Shift+B).
echo - Check the terminal output in VS Code for a "Success" message.
echo   If there are errors, they must be fixed before you can publish.
echo.
pause
echo.

:PUBLISH
echo [STEP 3: PUBLISH TO BUSINESS CENTRAL]
echo.
echo - Open the Command Palette in VS Code (Ctrl+Shift+P).
echo - Type "AL: Publish" and press Enter.
echo.
echo - IMPORTANT: This step will likely fail because of the symbol download
echo   issue we've seen ("Internal Server Error").
echo.
echo - If it succeeds, your extension will be deployed!
echo - If it fails, you MUST use a workaround like manually downloading
echo   the symbols from the BC Admin Center and placing them in the
echo   '.alpackages' folder before trying this step again.
echo.
pause
echo.

:VERIFY
echo [STEP 4: VERIFY IN BUSINESS CENTRAL]
echo.
echo - Open your browser and navigate to your Business Central environment.
echo - Search for "Extension Management".
echo - Look for "Parliament Fuel Coupon System" in the list to confirm
echo   it was installed successfully.
echo.

echo Deployment process finished.
pause
