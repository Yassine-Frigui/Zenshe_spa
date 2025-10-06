@echo off
echo.
echo ====================================
echo   Zenshe Form Standalone Setup
echo ====================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

echo [1/4] Node.js detected: 
node --version
echo.

echo [2/4] Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install dependencies!
    pause
    exit /b 1
)
echo.

echo [3/4] Setup complete!
echo.

echo [4/4] Configuration needed:
echo     1. Open server\server.js
echo     2. Update API_KEY (line 9)
echo     3. Update FORM_ID (line 10)
echo.

echo ====================================
echo   Ready to Start!
echo ====================================
echo.
echo To start the application:
echo   npm start
echo.
echo Frontend will be at: http://localhost:5173
echo Backend will be at:  http://localhost:3001
echo.

pause
