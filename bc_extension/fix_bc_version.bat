@echo off
echo.
echo ==========================================
echo   BC VERSION TROUBLESHOOTING HELPER
echo ==========================================
echo.

echo The AL extension is having trouble downloading symbols because
echo the Business Central platform version in app.json doesn't match
echo your actual BC Online environment version.
echo.

echo Current app.json settings:
echo Platform: 21.0.0.0
echo Application: 21.0.0.0
echo Runtime: 21.0
echo.

echo ==========================================
echo   SOLUTION OPTIONS:
echo ==========================================
echo.

echo OPTION 1: Check your actual BC version
echo 1. Open Business Central in browser
echo 2. Go to Settings gear icon
echo 3. Click "Help & Support"
echo 4. Look for "Version" information
echo 5. Note the version number (e.g., 26.1.12345.0)
echo.

echo OPTION 2: Try alternative versions
echo We can update app.json to try these common BC Online versions:
echo.
echo A) Version 23.0 (2023 Release Wave 2)
echo B) Version 24.0 (2024 Release Wave 1) 
echo C) Version 25.0 (2024 Release Wave 2)
echo D) Version 26.0 (2025 Release Wave 1)
echo.

echo OPTION 3: Use minimal dependencies
echo Create a simpler extension with fewer version requirements
echo.

set /p choice="Which option would you like to try? (1/2A/2B/2C/2D/3): "

if "%choice%"=="1" (
    echo.
    echo Opening Business Central to check version...
    start https://businesscentral.dynamics.com/086c4475-d0ef-4d2b-871c-4e078a083db5/Production
    echo.
    echo After checking the version, run this script again with option 2
    pause
    exit
)

if "%choice%"=="2A" (
    echo Updating to version 23.0...
    powershell -Command "(Get-Content app.json) -replace '\"platform\": \"21.0.0.0\"', '\"platform\": \"23.0.0.0\"' -replace '\"application\": \"21.0.0.0\"', '\"application\": \"23.0.0.0\"' -replace '\"runtime\": \"21.0\"', '\"runtime\": \"23.0\"' | Set-Content app.json"
    echo Updated to version 23.0.0.0
)

if "%choice%"=="2B" (
    echo Updating to version 24.0...
    powershell -Command "(Get-Content app.json) -replace '\"platform\": \"21.0.0.0\"', '\"platform\": \"24.0.0.0\"' -replace '\"application\": \"21.0.0.0\"', '\"application\": \"24.0.0.0\"' -replace '\"runtime\": \"21.0\"', '\"runtime\": \"24.0\"' | Set-Content app.json"
    echo Updated to version 24.0.0.0
)

if "%choice%"=="2C" (
    echo Updating to version 25.0...
    powershell -Command "(Get-Content app.json) -replace '\"platform\": \"21.0.0.0\"', '\"platform\": \"25.0.0.0\"' -replace '\"application\": \"21.0.0.0\"', '\"application\": \"25.0.0.0\"' -replace '\"runtime\": \"21.0\"', '\"runtime\": \"25.0\"' | Set-Content app.json"
    echo Updated to version 25.0.0.0
)

if "%choice%"=="2D" (
    echo Updating to version 26.0...
    powershell -Command "(Get-Content app.json) -replace '\"platform\": \"21.0.0.0\"', '\"platform\": \"26.0.0.0\"' -replace '\"application\": \"21.0.0.0\"', '\"application\": \"26.0.0.0\"' -replace '\"runtime\": \"21.0\"', '\"runtime\": \"26.0\"' | Set-Content app.json"
    echo Updated to version 26.0.0.0
)

if "%choice%"=="3" (
    echo Creating minimal extension configuration...
    powershell -Command "(Get-Content app.json) -replace '\"platform\": \"21.0.0.0\"', '\"platform\": \"20.0.0.0\"' -replace '\"application\": \"21.0.0.0\"', '\"application\": \"20.0.0.0\"' -replace '\"runtime\": \"21.0\"', '\"runtime\": \"20.0\"' | Set-Content app.json"
    echo Updated to minimal version 20.0.0.0
)

echo.
echo ==========================================
echo   NEXT STEPS:
echo ==========================================
echo.
echo 1. Clear AL cache: Delete .alpackages folder content
echo 2. In VS Code: Ctrl + Shift + P
echo 3. Type: AL: Clear credentials cache
echo 4. Type: AL: Download symbols
echo 5. Try authentication again
echo.

pause

echo.
echo Clearing AL cache...
rd /s /q ".alpackages" 2>nul
mkdir ".alpackages"

echo Opening VS Code to try again...
start "" code .

echo.
echo Try downloading symbols again in VS Code!
pause
