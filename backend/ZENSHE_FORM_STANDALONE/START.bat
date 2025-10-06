@echo off
echo.
echo ====================================
echo   Starting Zenshe Form Application
echo ====================================
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [ERROR] Dependencies not installed!
    echo Please run SETUP.bat first
    echo.
    pause
    exit /b 1
)

echo [INFO] Starting both frontend and backend...
echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:3001
echo.
echo Press Ctrl+C to stop all servers
echo.

npm start
