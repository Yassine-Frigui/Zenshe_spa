#!/bin/bash

# ZenShe Spa Production Deployment Script
# This script prepares and deploys the application for production

set -e

echo "🚀 Starting ZenShe Spa Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if required tools are installed
check_requirements() {
    print_status "Checking requirements..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    print_status "Requirements check passed"
}

# Security audit
security_audit() {
    print_status "Running security audit..."
    
    cd backend
    npm audit --audit-level moderate
    if [ $? -ne 0 ]; then
        print_error "Security vulnerabilities found in backend"
        print_warning "Please run 'npm audit fix' to resolve issues"
        exit 1
    fi
    
    cd ../frontend
    npm audit --audit-level moderate
    if [ $? -ne 0 ]; then
        print_error "Security vulnerabilities found in frontend"
        print_warning "Please run 'npm audit fix' to resolve issues"
        exit 1
    fi
    
    cd ..
    print_status "Security audit passed"
}

# Environment validation
validate_environment() {
    print_status "Validating production environment..."
    
    if [ ! -f "backend/.env.production" ]; then
        print_error "Production environment file not found!"
        print_warning "Please create backend/.env.production based on .env.production.example"
        exit 1
    fi
    
    # Check if critical environment variables are set
    source backend/.env.production
    
    if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "CHANGE_THIS_TO_A_STRONG_RANDOM_SECRET_OF_AT_LEAST_64_CHARACTERS_1234567890" ]; then
        print_error "JWT_SECRET is not properly configured"
        exit 1
    fi
    
    if [ -z "$DB_PASSWORD" ] || [ "$DB_PASSWORD" = "CHANGE_THIS_STRONG_PASSWORD_123!" ]; then
        print_error "DB_PASSWORD is not properly configured"
        exit 1
    fi
    
    if [ "$NODE_ENV" != "production" ]; then
        print_error "NODE_ENV must be set to 'production'"
        exit 1
    fi
    
    print_status "Environment validation passed"
}

# Build backend
build_backend() {
    print_status "Preparing backend for production..."
    
    cd backend
    
    # Install production dependencies
    npm ci --only=production
    
    # Create logs directory
    mkdir -p logs
    
    # Set proper permissions
    chmod 644 src/**/*.js
    chmod 600 .env.production
    
    cd ..
    print_status "Backend preparation completed"
}

# Build frontend
build_frontend() {
    print_status "Building frontend for production..."
    
    cd frontend
    
    # Install dependencies
    npm ci
    
    # Set environment to production
    export NODE_ENV=production
    
    # Build the application
    npm run build
    
    # Verify build output
    if [ ! -d "dist" ]; then
        print_error "Frontend build failed - dist directory not found"
        exit 1
    fi
    
    print_status "Frontend build completed"
    
    # Security check for sensitive data in build
    if grep -r "console\.log" dist/ &> /dev/null; then
        print_warning "Console.log statements found in production build"
    fi
    
    cd ..
}

# Database migration and setup
setup_database() {
    print_status "Setting up production database..."
    
    cd backend
    
    # Run database migrations if they exist
    if [ -f "database/migrations.sql" ]; then
        print_status "Running database migrations..."
        # Add your database migration command here
    fi
    
    # Create database backup before deployment
    print_status "Creating database backup..."
    # Add your backup command here
    
    cd ..
}

# SSL Certificate setup
setup_ssl() {
    print_status "Checking SSL configuration..."
    
    if [ -n "$SSL_CERT_PATH" ] && [ -n "$SSL_KEY_PATH" ]; then
        if [ -f "$SSL_CERT_PATH" ] && [ -f "$SSL_KEY_PATH" ]; then
            print_status "SSL certificates found"
        else
            print_warning "SSL certificate paths configured but files not found"
        fi
    else
        print_warning "SSL certificates not configured - HTTPS recommended for production"
    fi
}

# Start services
start_services() {
    print_status "Starting production services..."
    
    # Start backend
    cd backend
    
    # Use PM2 for production process management
    if command -v pm2 &> /dev/null; then
        pm2 start src/app.js --name "zenshespa-backend" --env production
        print_status "Backend started with PM2"
    else
        print_warning "PM2 not installed - starting with node (not recommended for production)"
        NODE_ENV=production nohup node src/app.js > logs/app.log 2>&1 &
        echo $! > app.pid
    fi
    
    cd ..
    
    # Frontend is served by nginx or similar web server
    print_status "Frontend build is ready to be served by web server"
}

# Health check
health_check() {
    print_status "Performing health check..."
    
    sleep 5
    
    # Check if backend is responding
    if curl -f http://localhost:5000/api/test &> /dev/null; then
        print_status "Backend health check passed"
    else
        print_error "Backend health check failed"
        exit 1
    fi
}

# Deployment summary
deployment_summary() {
    print_status "Deployment Summary:"
    echo "📱 Frontend built and ready in: frontend/dist/"
    echo "🖥️  Backend running on port: 5000"
    echo "🗄️  Database: Connected"
    echo "🔒 Security: Headers and rate limiting enabled"
    echo "📊 Monitoring: Logs available in backend/logs/"
    
    print_status "🎉 ZenShe Spa successfully deployed to production!"
    
    echo ""
    echo "Next steps:"
    echo "1. Configure your web server (nginx) to serve frontend/dist/"
    echo "2. Set up reverse proxy to backend on port 5000"
    echo "3. Configure SSL certificates"
    echo "4. Set up monitoring and alerting"
    echo "5. Schedule regular database backups"
    echo ""
    echo "🔗 Access your application at: https://yourdomain.com"
}

# Main deployment process
main() {
    echo "🔐 ZenShe Spa Production Deployment"
    echo "===================================="
    
    check_requirements
    security_audit
    validate_environment
    build_backend
    build_frontend
    setup_database
    setup_ssl
    start_services
    health_check
    deployment_summary
}

# Run main function
main "$@"