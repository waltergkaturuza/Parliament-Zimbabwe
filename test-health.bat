@echo off
echo Testing Parliament Fuel System Backend Health...
echo.

REM Test basic connectivity
echo Testing basic connectivity to Azure backend...
curl -s -o NUL -w "Status: %%{http_code} - Time: %%{time_total}s" https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net/
echo.

REM Test health endpoint
echo Testing health endpoint...
curl -s -o NUL -w "Status: %%{http_code} - Time: %%{time_total}s" https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net/api/health/
echo.

REM Test CORS endpoint
echo Testing CORS endpoint...
curl -s -o NUL -w "Status: %%{http_code} - Time: %%{time_total}s" https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net/api/cors-test/
echo.

REM Test auth endpoint
echo Testing auth endpoint...
curl -s -o NUL -w "Status: %%{http_code} - Time: %%{time_total}s" https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net/auth/login/
echo.

echo.
echo Health check completed. Check the status codes above:
echo - 200: OK
echo - 404: Not Found
echo - 500: Server Error
echo - 000: Connection Failed

pause
