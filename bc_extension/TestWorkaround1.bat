@echo off
echo ========================================
echo  WORKAROUND 1: Testing Version 26.0.0.0
echo ========================================
echo.

echo ISSUE CONFIRMED: BC Online API Backend Failure
echo - Microsoft symbol server returning HTTP 500 errors
echo - All dependencies failing for version 26.3.0.0
echo - Request IDs logged for Microsoft Support
echo.

echo CURRENT ATTEMPT: Version 26.0.0.0
echo - Updated app.json to use 26.0.0.0 instead of 26.3.0.0
echo - Cleaned symbol cache
echo - Ready for symbol download test
echo.

echo NEXT STEPS:
echo 1. Try: Ctrl+Shift+P -^> "AL: Download Symbols"
echo 2. If this fails, we'll try Sandbox environment
echo 3. If that fails, we'll try version 25.0.0.0
echo.

echo MICROSOFT SUPPORT INFO:
echo Request IDs: a3851d4f-bbb6-43d0-bb46-9b8e843fb4bb, a49f6046-cd7f-4709-8f9f-2354f8697e2a
echo Session ID: 59bb33bc-4d7e-45f4-b046-21c3b7832ebf
echo Tenant: 086c4475-d0ef-4d2b-871c-4e078a083db5
echo.

echo ========================================
echo Press any key to continue...
pause >nul
