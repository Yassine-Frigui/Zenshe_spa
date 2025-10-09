# Docker Implementation - TODO Checklist

## ✅ Development Setup (Do First)

### Local Development Environment
- [ ] Install Docker Desktop for Windows
  - Download from: https://www.docker.com/products/docker-desktop
  - Ensure WSL 2 is enabled
  - Allocate at least 4GB RAM to Docker

- [ ] Prepare environment file
  ```powershell
  copy backend\.env.example backend\.env
  notepad backend\.env
  ```
  - [ ] Set MySQL credentials (DB_USER, DB_PASSWORD)
  - [ ] Add Brevo API keys (for email testing, optional)
  - [ ] Set JWT_SECRET to any random string (dev only)

- [ ] Build and start containers
  ```powershell
  docker compose up --build -d
  ```

- [ ] Initialize database
  ```powershell
  docker compose exec backend node database/init.js
  ```

- [ ] Test the application
  - [ ] Frontend: http://localhost:3000
  - [ ] Backend health: http://localhost:5000/api/health
  - [ ] Backend test: http://localhost:5000/api/test

- [ ] Verify services are running
  ```powershell
  docker compose ps
  docker compose logs -f
  ```

## 🔐 Security (Do Before Production)

### Critical - Rotate All Exposed Secrets

#### Brevo (Email Service)
- [ ] Login to https://app.brevo.com
- [ ] Go to Settings > API Keys
- [ ] Create new API key for production
- [ ] Revoke old exposed key: `xkeysib-cd41f7c5928e887769b76b5ad2f0a96e...`
- [ ] Create second key for reservations
- [ ] Update production environment with new keys

#### JotForm
- [ ] Login to https://www.jotform.com
- [ ] Go to Settings > API
- [ ] Generate new API key
- [ ] Revoke old exposed key: `6bf64d24968384e5983fb2090de7e7fc`
- [ ] Update production environment

#### Telegram Bot
- [ ] Message @BotFather on Telegram
- [ ] Either revoke current bot token or create new bot
- [ ] Update production environment with new token

#### JWT Secret
- [ ] Generate strong random secret (32+ characters)
  ```powershell
  # PowerShell command to generate random string
  -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
  ```
- [ ] Update production environment
- [ ] This will invalidate all existing tokens (force re-login)

### Git History Cleanup
- [ ] Install BFG Repo Cleaner or git filter-repo
- [ ] Backup repository first
- [ ] Remove backend/.env from all commits
- [ ] Force push cleaned history
- [ ] Notify all team members to re-clone repository

### Secrets Management Setup
- [ ] Choose secrets manager:
  - [ ] GitHub Secrets (for CI/CD)
  - [ ] AWS Secrets Manager
  - [ ] Google Cloud Secret Manager
  - [ ] Azure Key Vault
  - [ ] HashiCorp Vault
- [ ] Store all production secrets in chosen manager
- [ ] Document access procedures for team

## 🗄️ Database (Production)

### Managed Database Setup
- [ ] Choose provider:
  - [ ] AWS RDS (MySQL)
  - [ ] Google Cloud SQL
  - [ ] Azure Database for MySQL
  - [ ] DigitalOcean Managed Database

- [ ] Provision database instance
  - [ ] Select MySQL 8.0
  - [ ] Choose appropriate instance size
  - [ ] Enable automated backups (daily)
  - [ ] Enable point-in-time recovery
  - [ ] Set backup retention (7-30 days)

- [ ] Configure networking
  - [ ] Create VPC/private network
  - [ ] Set up security groups/firewall
  - [ ] Whitelist only application servers
  - [ ] Block public access

- [ ] Create database and user
  ```sql
  CREATE DATABASE zenshespa_database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  CREATE USER 'zenshe_prod'@'%' IDENTIFIED BY 'STRONG_PASSWORD_HERE';
  GRANT ALL PRIVILEGES ON zenshespa_database.* TO 'zenshe_prod'@'%';
  FLUSH PRIVILEGES;
  ```

- [ ] Test connection from application server
- [ ] Document connection details (in secrets manager)

### Database Migration
- [ ] Export local database
  ```powershell
  docker compose exec db mysqldump -u root -p zenshespa_database > local_backup.sql
  ```
- [ ] Import to production database
- [ ] Verify data integrity
- [ ] Test application with production database

## 🌐 Infrastructure (Production)

### Server Provisioning
- [ ] Choose hosting:
  - [ ] AWS EC2 / ECS / EKS
  - [ ] Google Compute Engine / GKE
  - [ ] Azure VM / AKS
  - [ ] DigitalOcean Droplet / Kubernetes
  - [ ] VPS provider (Linode, Vultr, etc.)

- [ ] Server specifications (minimum):
  - [ ] 2 CPU cores
  - [ ] 4 GB RAM
  - [ ] 50 GB SSD storage
  - [ ] Docker installed
  - [ ] Firewall configured (ports 80, 443 only)

### Domain and DNS
- [ ] Purchase/configure domain name
- [ ] Set up DNS records:
  - [ ] A record: yourdomain.com → server IP
  - [ ] A record: www.yourdomain.com → server IP
  - [ ] Optional: CNAME for staging
- [ ] Wait for DNS propagation (up to 48 hours)

### SSL/TLS Certificate
- [ ] Install Certbot for Let's Encrypt
  ```bash
  apt-get update
  apt-get install certbot python3-certbot-nginx
  ```
- [ ] Generate certificate
  ```bash
  certbot --nginx -d yourdomain.com -d www.yourdomain.com
  ```
- [ ] Verify auto-renewal is configured
- [ ] Test renewal: `certbot renew --dry-run`

### Load Balancer / Reverse Proxy
- [ ] Install nginx (if not using cloud LB)
  ```bash
  apt-get install nginx
  ```
- [ ] Configure nginx (see DOCKER_DEPLOYMENT_GUIDE.md)
- [ ] Enable and start nginx
  ```bash
  systemctl enable nginx
  systemctl start nginx
  ```
- [ ] Configure automatic SSL redirect
- [ ] Set up rate limiting
- [ ] Enable security headers

## 🚀 Deployment

### CI/CD Setup (GitHub Actions)
- [ ] Verify GitHub Actions is enabled in repository
- [ ] Configure GitHub Environments:
  - [ ] Create "staging" environment
  - [ ] Create "production" environment
  - [ ] Add required reviewers to production
- [ ] Add repository secrets (Settings > Secrets):
  - [ ] All production environment variables
  - [ ] Database credentials
  - [ ] API keys
  - [ ] SSL certificates (if needed)
- [ ] Test workflow by pushing to develop branch
- [ ] Verify images are built and pushed to ghcr.io

### Manual Deployment (First Time)
- [ ] SSH to production server
- [ ] Clone repository
  ```bash
  git clone https://github.com/Yassine-Frigui/Zenshe_spa.git
  cd Zenshe_spa
  ```
- [ ] Create .env.prod file
  ```bash
  cp .env.prod.example .env.prod
  nano .env.prod
  ```
- [ ] Fill all production values
- [ ] Set file permissions
  ```bash
  chmod 600 .env.prod
  ```
- [ ] Login to GitHub Container Registry
  ```bash
  echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
  ```
- [ ] Deploy with docker-compose
  ```bash
  docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
  ```
- [ ] Check container status
  ```bash
  docker compose -f docker-compose.prod.yml ps
  docker compose -f docker-compose.prod.yml logs -f
  ```
- [ ] Test health endpoint
  ```bash
  curl http://localhost:5000/api/health
  ```

### Application Configuration
- [ ] Update CORS settings in backend
  - [ ] Set FRONTEND_URL to production domain
  - [ ] Remove development URLs
- [ ] Update API URL in frontend build
  - [ ] Set VITE_API_URL if needed
  - [ ] Or rely on same-domain proxy via nginx
- [ ] Verify all email templates have correct URLs
- [ ] Test email sending in production
- [ ] Test reservation flow end-to-end

## 📊 Monitoring & Observability

### Health Checks
- [ ] Set up external monitoring:
  - [ ] UptimeRobot (free tier available)
  - [ ] Pingdom
  - [ ] StatusCake
  - [ ] Or cloud provider monitoring
- [ ] Monitor endpoints:
  - [ ] https://yourdomain.com
  - [ ] https://yourdomain.com/api/health
- [ ] Set up alerts (email, SMS, Slack)
- [ ] Test alert notifications

### Logging
- [ ] Configure log aggregation:
  - [ ] CloudWatch Logs (AWS)
  - [ ] Google Cloud Logging
  - [ ] Azure Monitor
  - [ ] ELK Stack (self-hosted)
  - [ ] Splunk
- [ ] Forward Docker container logs
- [ ] Set up log retention policy
- [ ] Configure log-based alerts

### Metrics
- [ ] Set up metrics collection:
  - [ ] Prometheus + Grafana
  - [ ] Cloud provider metrics
  - [ ] Datadog
  - [ ] New Relic
- [ ] Monitor:
  - [ ] CPU usage
  - [ ] Memory usage
  - [ ] Disk space
  - [ ] Network traffic
  - [ ] Request latency
  - [ ] Error rates
  - [ ] Database connections

### Alerting Rules
- [ ] High error rate (>5% of requests)
- [ ] Slow response time (>2 seconds p95)
- [ ] High memory usage (>80%)
- [ ] High CPU usage (>80%)
- [ ] Disk space low (<20% free)
- [ ] Database connection failures
- [ ] Health check failures
- [ ] SSL certificate expiring soon (<30 days)

## 🧪 Testing

### Pre-Production Testing
- [ ] Deploy to staging environment first
- [ ] Run smoke tests:
  - [ ] Homepage loads
  - [ ] User registration
  - [ ] User login
  - [ ] Service booking
  - [ ] Payment flow (if applicable)
  - [ ] Email notifications
  - [ ] Admin panel access
  - [ ] All main user journeys
- [ ] Performance testing:
  - [ ] Load test with expected traffic
  - [ ] Stress test with 2x expected traffic
  - [ ] Monitor resource usage under load
- [ ] Security testing:
  - [ ] Run OWASP ZAP scan
  - [ ] Review Trivy vulnerability reports
  - [ ] Test authentication/authorization
  - [ ] Verify HTTPS enforcement
  - [ ] Check for exposed secrets

### Production Verification
- [ ] Deploy to production
- [ ] Run smoke tests again
- [ ] Verify health checks passing
- [ ] Check all integrations working
- [ ] Monitor logs for errors
- [ ] Test backup restoration procedure
- [ ] Document any issues found

## 📋 Operational Procedures

### Backup Procedures
- [ ] Automate database backups
  - [ ] Daily full backups
  - [ ] Hourly incremental (optional)
  - [ ] Test restore procedure monthly
- [ ] Backup uploaded files
  - [ ] Configure S3/cloud storage
  - [ ] Or backup /uploads volume
- [ ] Backup configuration files
- [ ] Document restore procedures
- [ ] Store backups off-site

### Rollback Plan
- [ ] Document rollback steps
- [ ] Tag current production version before deploy
- [ ] Keep previous 3 versions available
- [ ] Test rollback in staging
- [ ] Have rollback commands ready
  ```bash
  # Rollback to previous version
  docker compose -f docker-compose.prod.yml down
  docker pull ghcr.io/yassine-frigui/zenshe-spa-backend:PREVIOUS_TAG
  docker pull ghcr.io/yassine-frigui/zenshe-spa-frontend:PREVIOUS_TAG
  docker compose -f docker-compose.prod.yml up -d
  ```

### Maintenance Windows
- [ ] Schedule regular maintenance windows
- [ ] Communicate maintenance to users
- [ ] Plan for zero-downtime deployments (future)
- [ ] Document maintenance procedures

## 📚 Documentation

### Team Documentation
- [ ] Document deployment procedures
- [ ] Document rollback procedures
- [ ] Document monitoring/alerting
- [ ] Document incident response
- [ ] Create runbook for common issues
- [ ] Document database procedures
- [ ] Share access credentials securely

### User Communication
- [ ] Create status page (e.g., status.yourdomain.com)
- [ ] Set up maintenance notification system
- [ ] Document support procedures
- [ ] Create FAQ for common issues

## 🎓 Team Training

### Training Sessions
- [ ] Walk through deployment process
- [ ] Practice rollback procedure
- [ ] Review monitoring dashboards
- [ ] Simulate incident response
- [ ] Document lessons learned

### Access Management
- [ ] Set up team access to:
  - [ ] Production servers
  - [ ] Database
  - [ ] Secrets manager
  - [ ] Monitoring systems
  - [ ] DNS management
  - [ ] Domain registrar
- [ ] Document who has access to what
- [ ] Regular access review (quarterly)

## ✅ Final Pre-Launch Checklist

### Security ✓
- [ ] All secrets rotated
- [ ] Git history cleaned
- [ ] Firewall configured
- [ ] HTTPS enforced
- [ ] Security headers enabled
- [ ] Rate limiting configured
- [ ] CORS properly restricted
- [ ] No dev/debug flags in production

### Infrastructure ✓
- [ ] Managed database provisioned
- [ ] Backups configured and tested
- [ ] Monitoring and alerting active
- [ ] SSL certificate valid
- [ ] DNS configured correctly
- [ ] Load balancer/reverse proxy configured
- [ ] Adequate server resources

### Application ✓
- [ ] All tests passing
- [ ] Health checks working
- [ ] Email notifications working
- [ ] Payment integrations tested (if applicable)
- [ ] All main flows tested
- [ ] Performance acceptable
- [ ] No critical bugs

### Operations ✓
- [ ] Deployment procedure documented
- [ ] Rollback procedure tested
- [ ] Team trained
- [ ] Support procedures in place
- [ ] Status page configured
- [ ] Maintenance windows scheduled

### Compliance ✓
- [ ] Privacy policy updated
- [ ] Terms of service updated
- [ ] GDPR compliance checked (if applicable)
- [ ] Data retention policy defined
- [ ] Cookie consent implemented (if applicable)

## 🎉 Launch

- [ ] Final smoke test in production
- [ ] Monitor closely for first 24 hours
- [ ] Be ready to rollback if needed
- [ ] Celebrate! 🎊

---

## 📞 Emergency Contacts

Document here:
- [ ] Production server access
- [ ] Database admin contact
- [ ] DNS provider support
- [ ] Hosting provider support
- [ ] On-call rotation (if applicable)

## 📝 Notes

Use this section to track progress and issues:

- Date: _______
- Issue: _______
- Resolution: _______
