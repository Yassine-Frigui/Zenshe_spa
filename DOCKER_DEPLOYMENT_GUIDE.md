# Docker Deployment Guide

## Quick Start - Development

### Prerequisites
- Docker Desktop installed (Windows/Mac) or Docker Engine + Docker Compose (Linux)
- Git (to clone/pull the repo)
- At least 4GB RAM available for Docker

### Step 1: Clone and setup environment

```powershell
# Navigate to project
cd c:\Users\yassi\Desktop\dekstop\zenshe_spa

# Copy example env file
copy backend\.env.example backend\.env

# Edit backend\.env with your local development values
notepad backend\.env
```

### Step 2: Build and run

```powershell
# Build and start all services (MySQL, backend, frontend)
docker compose up --build -d

# View logs
docker compose logs -f

# View specific service logs
docker compose logs -f backend
docker compose logs -f frontend
```

### Step 3: Verify services

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api/test
- Health check: http://localhost:5000/api/health
- MySQL: localhost:3306 (credentials from backend/.env)

### Step 4: Initialize database

```powershell
# Run DB initialization inside backend container
docker compose exec backend node database/init.js
```

### Common development commands

```powershell
# Stop all services
docker compose down

# Stop and remove volumes (clean slate)
docker compose down -v

# Rebuild single service
docker compose build backend
docker compose up -d backend

# View running containers
docker compose ps

# Execute command in container
docker compose exec backend npm run db:test

# View container resource usage
docker stats
```

## Production Deployment

### Prerequisites
- Production server with Docker installed
- Managed database (AWS RDS, Google Cloud SQL, Azure Database, etc.)
- Domain name with DNS configured
- SSL/TLS certificate (Let's Encrypt, cloud provider cert)
- Load balancer or reverse proxy (nginx, Traefik, cloud LB)

### Security Checklist (MUST DO BEFORE PRODUCTION)

- [ ] Rotate all leaked API keys immediately
  - [ ] Generate new Brevo API keys at https://app.brevo.com
  - [ ] Generate new JotForm API key at https://www.jotform.com/myaccount/api
  - [ ] Create new Telegram bot or rotate token at https://t.me/BotFather
  - [ ] Generate strong random JWT_SECRET (min 32 chars)
  - [ ] Update all services with new keys

- [ ] Remove secrets from git history
  - [ ] Use BFG Repo Cleaner or git filter-repo
  - [ ] Force push cleaned history
  - [ ] Notify collaborators to re-clone

- [ ] Configure secrets manager
  - [ ] Use GitHub Secrets for CI/CD
  - [ ] Use cloud provider secrets (AWS Secrets Manager, GCP Secret Manager, Azure Key Vault)
  - [ ] Or use HashiCorp Vault for on-prem

- [ ] Database setup
  - [ ] Provision managed database with backups enabled
  - [ ] Enable point-in-time recovery
  - [ ] Configure private networking/VPC
  - [ ] Set up database firewall rules (whitelist only app servers)
  - [ ] Use strong passwords (min 20 chars)

- [ ] Network security
  - [ ] Configure CORS to only allow production domain
  - [ ] Enable TLS 1.3 at load balancer
  - [ ] Set up firewall rules (only ports 80/443 public)
  - [ ] Enable DDoS protection if available

- [ ] Container hardening
  - [ ] Run containers as non-root user (add USER directive to Dockerfiles)
  - [ ] Use minimal base images (alpine)
  - [ ] Pin all dependencies to specific versions
  - [ ] Enable read-only root filesystem where possible

### Step 1: Prepare production environment file

```bash
# On production server
cd /opt/zenshe_spa  # or your deployment directory

# Copy and edit production env template
cp .env.prod.example .env.prod
nano .env.prod  # or vim, edit with real production values

# Ensure file has restricted permissions
chmod 600 .env.prod
```

### Step 2: Pull images from registry

```bash
# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Pull latest production images
docker pull ghcr.io/yassine-frigui/zenshe-spa-backend:master-COMMIT_SHA
docker pull ghcr.io/yassine-frigui/zenshe-spa-frontend:master-COMMIT_SHA

# Or let docker-compose pull for you
docker compose -f docker-compose.prod.yml pull
```

### Step 3: Deploy with production compose

```bash
# Start services with production config
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d

# Monitor startup
docker compose -f docker-compose.prod.yml logs -f

# Check health
curl http://localhost:5000/api/health
```

### Step 4: Configure reverse proxy (nginx example)

```nginx
# /etc/nginx/sites-available/zenshe-spa
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.3 TLSv1.2;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Frontend
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### Step 5: Set up monitoring and logging

```bash
# View logs from all services
docker compose -f docker-compose.prod.yml logs -f

# Export logs to external service (example with CloudWatch)
# Configure Docker logging driver in docker-compose.prod.yml

# Set up health check monitoring
# Use uptime monitoring service (UptimeRobot, Pingdom, etc.)
# Monitor: https://yourdomain.com/api/health

# Enable container auto-restart
# (already configured with restart: always in compose file)
```

## CI/CD with GitHub Actions

The repository includes `.github/workflows/docker-build-push.yml` that:

1. Runs tests on every push/PR
2. Builds Docker images for backend and frontend
3. Scans images with Trivy for security vulnerabilities
4. Pushes images to GitHub Container Registry
5. Generates Software Bill of Materials (SBOM)
6. Deploys to staging (on develop branch)
7. Deploys to production (on master branch)

### Setup GitHub Actions

1. Enable GitHub Actions in repository settings
2. No additional secrets needed (uses GITHUB_TOKEN automatically)
3. Configure environments in Settings > Environments:
   - Create "staging" environment
   - Create "production" environment with required reviewers
4. Images will be available at: `ghcr.io/yassine-frigui/zenshe-spa-backend:TAG`

### Deploy from CI/CD

Images are tagged with:
- Branch name: `master`, `develop`
- Commit SHA: `master-abc1234`
- `latest` (for default branch)

Pull and deploy specific version:

```bash
# Production server
docker pull ghcr.io/yassine-frigui/zenshe-spa-backend:master-abc1234
docker pull ghcr.io/yassine-frigui/zenshe-spa-frontend:master-abc1234

# Update image tags in docker-compose.prod.yml or use environment variable
export BACKEND_IMAGE=ghcr.io/yassine-frigui/zenshe-spa-backend:master-abc1234
export FRONTEND_IMAGE=ghcr.io/yassine-frigui/zenshe-spa-frontend:master-abc1234

docker compose -f docker-compose.prod.yml up -d
```

## Rollback Strategy

### Quick rollback to previous version

```bash
# List available image tags
docker images | grep zenshe-spa

# Stop current containers
docker compose -f docker-compose.prod.yml down

# Update image tags to previous version in compose file
# or set environment variables

# Start with previous version
docker compose -f docker-compose.prod.yml up -d

# Verify rollback
curl http://localhost:5000/api/health
```

### Database rollback

If database migration was applied:
- Restore from backup taken before deployment
- Or run reverse migration scripts (if available)

## Monitoring and Maintenance

### Health checks

```bash
# Backend health
curl http://localhost:5000/api/health

# Check container health status
docker compose -f docker-compose.prod.yml ps

# Docker healthcheck status
docker inspect --format='{{.State.Health.Status}}' CONTAINER_ID
```

### Resource monitoring

```bash
# Container resource usage
docker stats

# Disk usage
docker system df

# Clean up unused images/containers
docker system prune -a
```

### Database backups

```bash
# Backup database (if using docker-compose DB)
docker compose exec db mysqldump -u root -p zenshespa_database > backup.sql

# Restore database
docker compose exec -T db mysql -u root -p zenshespa_database < backup.sql
```

For managed databases, use provider's backup tools (AWS RDS snapshots, etc.)

## Troubleshooting

### Container won't start

```bash
# View detailed logs
docker compose -f docker-compose.prod.yml logs backend

# Check container exit code
docker compose -f docker-compose.prod.yml ps

# Inspect container
docker inspect CONTAINER_ID

# Run shell in container for debugging
docker compose -f docker-compose.prod.yml exec backend sh
```

### Database connection issues

```bash
# Test DB connectivity from backend container
docker compose exec backend node -e "require('./config/database').testConnection()"

# Check DB connection from host
mysql -h DB_HOST -u DB_USER -p -e "SELECT 1"
```

### Permission issues

```bash
# Check file permissions in container
docker compose exec backend ls -la

# Fix ownership (if running as non-root)
docker compose exec backend chown -R node:node /usr/src/app/uploads
```

### High memory/CPU usage

```bash
# View resource usage
docker stats

# Limit container resources in docker-compose.prod.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          memory: 512M
```

## Production Checklist

Before going live:

- [ ] All secrets rotated and stored securely
- [ ] Database backups configured and tested
- [ ] SSL/TLS certificate installed and auto-renewal configured
- [ ] DNS records configured correctly
- [ ] Firewall rules in place
- [ ] Monitoring and alerting set up
- [ ] Health check endpoint working
- [ ] Log aggregation configured
- [ ] Rollback plan tested
- [ ] Load testing performed
- [ ] Security scan passed (Trivy, OWASP ZAP)
- [ ] CORS configured for production domain only
- [ ] Rate limiting configured
- [ ] Backup restoration tested
- [ ] Disaster recovery plan documented
- [ ] Team trained on deployment and rollback procedures

## Support

For issues or questions:
- Check logs: `docker compose logs -f`
- Review health: `curl http://localhost:5000/api/health`
- GitHub Issues: https://github.com/Yassine-Frigui/Zenshe_spa/issues
