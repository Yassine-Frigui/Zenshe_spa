@echo off
echo.
echo ================================================
echo   Testing Zenshe Backend Connection
echo ================================================
echo.

echo [1/3] Checking if backend is running on port 3001...
curl -s http://localhost:3001 >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Backend is NOT running!
    echo.
    echo To start the backend:
    echo   1. Open a terminal
    echo   2. Navigate to ZENSHE_FORM_STANDALONE folder
    echo   3. Run: npm run server
    echo.
    goto :end
)
echo ✅ Backend is running!
echo.

echo [2/3] Testing /submit-form endpoint...
curl -s -X POST http://localhost:3001/submit-form -H "Content-Type: application/json" -d "{\"test\":\"data\"}" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ /submit-form endpoint not responding
) else (
    echo ✅ /submit-form endpoint is accessible
)
echo.

echo [3/3] Full backend status:
curl -s http://localhost:3001
echo.
echo.

:end
echo ================================================
echo   Diagnostic Complete
echo ================================================
echo.
pause
