@echo off
echo ========================================
echo  BC Online Version Detection Guide
echo ========================================
echo.

echo CURRENT STATUS:
echo - Authentication: SUCCESS ✓
echo - User: admin@parliamentzw.onmicrosoft.com 
echo - Tenant: 086c4475-d0ef-4d2b-871c-4e078a083db5
echo - Environment: Sandbox
echo - Issue: Version 23.0.0.0 NOT FOUND in your BC Online environment
echo.

echo FINDING THE CORRECT VERSION:
echo.
echo METHOD 1 - Check BC Online Web Interface:
echo 1. Open: https://businesscentral.dynamics.com/086c4475-d0ef-4d2b-871c-4e078a083db5/Sandbox
echo 2. Login with: admin@parliamentzw.onmicrosoft.com
echo 3. Go to: Help ^& Support -^> About
echo 4. Look for: Application Version (e.g., 25.3.12345.0)
echo 5. The first two numbers are what we need (e.g., 25.0)
echo.

echo METHOD 2 - Try Common Versions:
echo Current attempt: 25.0.0.0
echo If this fails, we'll try: 24.0.0.0, 22.0.0.0, 21.0.0.0
echo.

echo WHAT TO DO NEXT:
echo 1. Try "AL: Download Symbols" again now
echo 2. If it fails, check the exact version in BC Online web interface
echo 3. Report back the version number you see
echo.

echo VERSION MAPPING REFERENCE:
echo BC Online 2024 Wave 1: Version 24.x
echo BC Online 2024 Wave 2: Version 25.x  
echo BC Online 2025 Wave 1: Version 26.x
echo.

pause
