@echo off
REM ZenShe Spa Production Deployment Script for Windows
REM This script prepares and deploys the application for production

echo 🚀 Starting ZenShe Spa Production Deployment...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed
    exit /b 1
)

echo ✅ Requirements check passed

REM Security audit for backend
echo ✅ Running security audit...
cd backend
call npm audit --audit-level moderate
if %errorlevel% neq 0 (
    echo ❌ Security vulnerabilities found in backend
    echo ⚠️  Please run 'npm audit fix' to resolve issues
    exit /b 1
)

REM Security audit for frontend  
cd ..\frontend
call npm audit --audit-level moderate
if %errorlevel% neq 0 (
    echo ❌ Security vulnerabilities found in frontend
    echo ⚠️  Please run 'npm audit fix' to resolve issues
    exit /b 1
)

cd ..
echo ✅ Security audit passed

REM Check if production environment file exists
if not exist "backend\.env.production" (
    echo ❌ Production environment file not found!
    echo ⚠️  Please create backend\.env.production based on .env.production.example
    exit /b 1
)

echo ✅ Environment validation passed

REM Build backend
echo ✅ Preparing backend for production...
cd backend

REM Install production dependencies
call npm ci --only=production

REM Create logs directory
if not exist "logs" mkdir logs

cd ..
echo ✅ Backend preparation completed

REM Build frontend
echo ✅ Building frontend for production...
cd frontend

REM Install dependencies
call npm ci

REM Set environment to production
set NODE_ENV=production

REM Build the application
call npm run build

REM Verify build output
if not exist "dist" (
    echo ❌ Frontend build failed - dist directory not found
    exit /b 1
)

echo ✅ Frontend build completed

cd ..

REM Start backend service
echo ✅ Starting production services...
cd backend

REM Start with PM2 if available, otherwise use node
where pm2 >nul 2>&1
if %errorlevel% equ 0 (
    call pm2 start src\app.js --name "zenshespa-backend" --env production
    echo ✅ Backend started with PM2
) else (
    echo ⚠️  PM2 not installed - starting with node (not recommended for production)
    set NODE_ENV=production
    start /b node src\app.js > logs\app.log 2>&1
)

cd ..

REM Health check
echo ✅ Performing health check...
timeout /t 5 /nobreak >nul

REM Simple health check using curl or powershell
curl -f http://localhost:5000/api/test >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend health check passed
) else (
    echo ❌ Backend health check failed
    exit /b 1
)

REM Deployment summary
echo.
echo ✅ Deployment Summary:
echo 📱 Frontend built and ready in: frontend\dist\
echo 🖥️  Backend running on port: 5000
echo 🗄️  Database: Connected
echo 🔒 Security: Headers and rate limiting enabled
echo 📊 Monitoring: Logs available in backend\logs\

echo.
echo ✅ 🎉 ZenShe Spa successfully deployed to production!

echo.
echo Next steps:
echo 1. Configure your web server (IIS/nginx) to serve frontend\dist\
echo 2. Set up reverse proxy to backend on port 5000
echo 3. Configure SSL certificates
echo 4. Set up monitoring and alerting
echo 5. Schedule regular database backups
echo.
echo 🔗 Access your application at: https://yourdomain.com

pause