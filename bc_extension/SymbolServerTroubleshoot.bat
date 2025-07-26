@echo off
echo ========================================
echo  BC Online Symbol Server Troubleshooting
echo ========================================
echo.

echo TENANT: 086c4475-d0ef-4d2b-871c-4e078a083db5
echo ENVIRONMENT: Production
echo VERSION: 26.3.0.0
echo USER: admin@parliamentzw.onmicrosoft.com
echo.

echo ISSUE: Symbol server backend problems blocking extension development
echo.

echo ========================================
echo  STEP 1: Environment Health Check
echo ========================================
echo.

echo Testing BC Online API endpoints...
echo.

echo 1. Testing Base Application endpoint:
curl -s -o nul -w "HTTP Status: %%{http_code}\n" "https://api.businesscentral.dynamics.com/v2.0/Production/dev/packages?publisher=Microsoft&appName=Base%%20Application&versionText=26.3.0.0&appId=437dbf0e-84ff-417a-965d-ed2bb9650972&tenant=086c4475-d0ef-4d2b-871c-4e078a083db5"

echo.
echo 2. Testing System Application endpoint:
curl -s -o nul -w "HTTP Status: %%{http_code}\n" "https://api.businesscentral.dynamics.com/v2.0/Production/dev/packages?publisher=Microsoft&appName=System%%20Application&versionText=26.3.0.0&appId=63ca2fa4-4f03-4f2b-a480-172fef340d3f&tenant=086c4475-d0ef-4d2b-871c-4e078a083db5"

echo.
echo 3. Testing general API availability:
curl -s -o nul -w "HTTP Status: %%{http_code}\n" "https://api.businesscentral.dynamics.com/v2.0/Production/"

echo.
echo ========================================
echo  STEP 2: Alternative Versions to Try
echo ========================================
echo.

echo If 26.3.0.0 fails, try these versions:
echo - 26.0.0.0 (Major release)
echo - 25.5.0.0 (Previous stable)
echo - 25.0.0.0 (Previous major)
echo.

echo ========================================
echo  STEP 3: Workaround Solutions
echo ========================================
echo.

echo SOLUTION A: Use Sandbox Environment
echo - Sandbox environments often have better symbol availability
echo - Change launch.json environmentName to "Sandbox"
echo - Try version 24.0.0.0 or 25.0.0.0 in Sandbox
echo.

echo SOLUTION B: Download Symbols Manually
echo - Get symbols from GitHub: https://github.com/microsoft/ALAppExtensions
echo - Download AL Language Extension symbols
echo - Place in .alpackages folder manually
echo.

echo SOLUTION C: Use Local BC Docker Container
echo - Run BC in Docker for development
echo - Download symbols from local container
echo - Avoids BC Online API issues completely
echo.

echo SOLUTION D: Contact Microsoft Support
echo - BC Online API issues require Microsoft intervention
echo - Provide them with this tenant ID: 086c4475-d0ef-4d2b-871c-4e078a083db5
echo - Reference symbol server backend problems
echo.

echo ========================================
echo  STEP 4: Immediate Workarounds
echo ========================================
echo.

echo Creating backup configurations for testing...
echo.

pause
