
# Deployment / Production Handover — Minimal Plan

This document is a short, plain-language plan to move the project from local/dev to production and what to give the person who will deploy it. Keep this file and hand it to the deployer along with the repo.

---

## One-line policy

Do not change `backend/.env` in the repo — use `.env.prod` for production.

---

## Simple explanations (plain language)

1. TLS / HTTPS

  "TLS" is the technology that makes a website use HTTPS (the padlock in the browser). You do NOT need to change app code for TLS; instead the deployer will add a reverse proxy or load balancer (nginx/Traefik or cloud load balancer) that holds the certificate and serves HTTPS to users. The app containers will receive plain HTTP traffic from the reverse proxy.

1. DB dump / migration

  A DB "dump" is a file that contains the database contents (tables + data) exported from a MySQL server (usually a `.sql` file). A "migration" is a repeatable script that creates or updates database tables/columns in a controlled way. For production the deployer will either:

  1. use your managed DB already seeded with data, or
  1. import a provided SQL dump into the managed DB (this is done once, outside the containers), or
  1. run migration scripts if present.

  If you don't manage the DB, tell the deployer to create the `zenshespa_database` database and a non-root DB user for the app (example below).

---

## What to hand to the deployer

- The repository (source code).
- `docker-compose.prod.yml` (already in repo).
- A filled `.env.prod` file (do not commit it). See the example section below.
- Any database backup or migration instructions if the DB must be seeded.
- TLS certificate or instructions to obtain one (Let’s Encrypt) if you manage TLS yourself; otherwise the deployer will handle TLS.

---

## Minimal `.env.prod.example` (no secrets — deployer must fill values)

Create a file on the server named `.env.prod` with these keys (example values shown):

```bash
PORT=5000
NODE_ENV=production

DB_HOST=db.example.com
DB_PORT=3306
DB_USER=zenshe_app
DB_PASSWORD=strong_password_here
DB_NAME=zenshespa_database

JWT_SECRET=super-secret-jwt
JWT_EXPIRES_IN=24h

BREVO_API_KEY=...
BREVO_SENDER_EMAIL=...

JOTFORM_API_KEY=...
JOTFORM_FORM_ID=...

FRONTEND_URL=https://yourdomain.example
VITE_API_URL=https://yourdomain.example

NGROK_DOMAIN=
```

Do NOT put this file in source control. Keep it on the deploy host or in a secrets manager.

---

## Exact minimal commands for the deployer (Windows `cmd` style)

1. On the server, make sure Docker and Docker Compose are installed.

1. From the repo root (where `docker-compose.prod.yml` lives):

```bash
cd C:\path\to\repo
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

1. Check status and logs:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f backend
```

1. If you change `VITE_API_URL` you must rebuild the frontend so the new API URL is baked into the static files:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod build frontend
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d frontend
```

1. To stop everything:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod down
```

---

## Quick DB commands the deployer can run on the managed MySQL (example)

These commands create the database and a non-root user (replace names/passwords):

```sql
CREATE DATABASE IF NOT EXISTS zenshespa_database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'zenshe_app'@'%' IDENTIFIED BY 'StrongPasswordHere!';
GRANT ALL PRIVILEGES ON zenshespa_database.* TO 'zenshe_app'@'%';
FLUSH PRIVILEGES;
```

If a SQL dump is provided, the deployer will import it into the managed DB using the `mysql` client or cloud provider tools before running the app.

---

## Smoke tests (what the deployer runs after start)

1. Health endpoint (should return 200 and DB connected):

```bash
curl -i http://localhost:5000/api/health
```

1. Public services (should return JSON array):

```bash
curl -i http://localhost:5000/api/public/services
```

1. Open `https://yourdomain` in a browser and verify pages load and API calls succeed.

---

## Minimal recommended follow-ups (optional but strongly recommended)

- Terminate TLS at a reverse proxy or load balancer (nginx/Traefik or cloud LB). This is how HTTPS is normally handled.
- Store secrets in a secret manager rather than a flat file. Use Docker secrets, Vault or cloud secrets.
- Move uploads off the single docker volume to S3 or shared storage for multi-host deployments.
- Add backups for the DB and uploads.
- Add basic monitoring / log forwarding.

---

---

## Concrete server installation & deployment steps (Ubuntu 20.04 / 22.04)

Below are exact commands the deployer or operator can paste on a fresh Ubuntu server to prepare the host, install Docker, configure TLS with nginx/certbot, import the DB dump, and start the stack.

NOTE: these assume the deployer has sudo access on the server.

1) Update system and install required packages

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl gnupg lsb-release apt-transport-https software-properties-common
```

1. Install Docker Engine and Docker Compose plugin

```bash
# Add Docker official GPG key and repo
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Enable and start Docker
sudo systemctl enable --now docker

# Optional: allow your deploy user to run docker without sudo
sudo usermod -aG docker $USER
echo "You may need to log out/in for group changes to apply"
```

1. (Optional but recommended) Install `mysql-client` to import DB dumps

```bash
sudo apt install -y default-mysql-client
```

1. Prepare the repository on the server

```bash
# clone or upload your repository to /srv/zenshe_spa
cd /srv
git clone <your-repo-url> zenshe_spa
cd zenshe_spa

# Make sure .env.prod exists (see example below) and is filled
ls -la .env.prod
```

1. Create DB and import dump (run on DB host or from a client machine that can reach DB)

If the managed DB is remote (cloud DB), use the provider's console or a `mysql` client to run these commands.

```sql
-- run on the DB server or via a client that connects as an admin
CREATE DATABASE IF NOT EXISTS zenshespa_database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'zenshe_app'@'%' IDENTIFIED BY 'StrongPasswordHere!';
GRANT ALL PRIVILEGES ON zenshespa_database.* TO 'zenshe_app'@'%';
FLUSH PRIVILEGES;
```

Import the SQL dump (replace host/port/file path):

```bash
mysql -h DB_HOST_HERE -P DB_PORT_HERE -u zenshe_app -p zenshespa_database < /path/to/zenshe_dump.sql
```

If the deployer uses a cloud provider UI (Cloud SQL, phpMyAdmin), they can upload the dump there instead.

1. (Optional) Configure firewall (UFW) — allow HTTP/HTTPS and SSH

```bash
sudo apt install -y ufw
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

1. (Recommended) Create `systemd` unit to bring up compose on boot

Create `/etc/systemd/system/zenshe-compose.service` with root privileges and the following content (adjust WorkingDirectory path):

```ini
[Unit]
Description=Zenshe SPA docker-compose
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
WorkingDirectory=/srv/zenshe_spa
ExecStart=/usr/bin/docker compose -f docker-compose.prod.yml --env-file /srv/zenshe_spa/.env.prod up -d
ExecStop=/usr/bin/docker compose -f docker-compose.prod.yml --env-file /srv/zenshe_spa/.env.prod down
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
```

Then enable and start it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now zenshe-compose.service
sudo systemctl status zenshe-compose.service --no-pager
```

1. Start the stack manually (first run or to rebuild):

```bash
cd /srv/zenshe_spa
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

1. Check status and logs:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f backend
docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f frontend
```

1. Rebuild only the frontend (if `VITE_API_URL` changed)

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod build frontend
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d frontend
```

1. Bring stack down:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod down
```

---

## TLS (HTTPS) using host nginx + certbot (concrete steps)

This approach terminates TLS at the host (recommended). The host's nginx will proxy traffic to the frontend container (port 80) and backend (5000). This avoids putting certs inside containers and keeps renewals easy.

1) Install nginx and certbot

```bash
sudo apt install -y nginx
sudo apt install -y certbot python3-certbot-nginx
```

1. Example nginx site config (`/etc/nginx/sites-available/zenshe.conf`)

```nginx
server {
  listen 80;
  server_name yourdomain.example www.yourdomain.example;

  location / {
    proxy_pass http://127.0.0.1:80; # frontend container exposed to host port 80
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location /api/ {
    proxy_pass http://127.0.0.1:5000; # backend
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Enable it and restart nginx:

```bash
sudo ln -s /etc/nginx/sites-available/zenshe.conf /etc/nginx/sites-enabled/zenshe.conf
sudo nginx -t
sudo systemctl reload nginx
```

1. Obtain TLS certificates via certbot (will add HTTPS virtualhost automatically):

```bash
sudo certbot --nginx -d yourdomain.example -d www.yourdomain.example
```

1. Test HTTPS: open the site in a browser or use curl to check headers (replace `yourdomain.example`):

```bash
curl -I https://yourdomain.example
```

Notes:
- If your frontend container is listening on host port 80 (compose `ports` mapping), the above proxy_pass to `127.0.0.1:80` works. If you map ports differently, adjust proxy_pass accordingly.

- If you prefer Traefik as a reverse proxy with automatic ACME, I can add a `docker-compose.traefik.yml` example.

---

## Pre-build images and push to container registry (recommended CI flow)

If you prefer not to build images on the deploy host, build in CI and push images to a registry (Docker Hub, GHCR, ECR). Example commands to build and push manually:

```bash
# Backend
docker build -t registry.example.com/yourorg/zenshe-backend:latest ./backend
docker push registry.example.com/yourorg/zenshe-backend:latest

# Frontend
docker build -t registry.example.com/yourorg/zenshe-frontend:latest ./frontend
docker push registry.example.com/yourorg/zenshe-frontend:latest
```

Then edit `docker-compose.prod.yml` on the server to replace the `build:` sections with `image: registry.example.com/yourorg/zenshe-backend:latest` and `image:` for frontend. That makes deploys pull images instead of building.

---

## Quick troubleshooting

- Docker daemon errors (pipe/open errors on Windows): Docker Engine is not running. Start Docker Desktop or the Docker service.
- `docker compose up` fails to pull images: check network access on the server and `docker login` for private registries.
- Database connection errors: check `.env.prod` DB_HOST/DB_PORT/DB_USER/DB_PASSWORD and firewall rules on the DB host.
- Frontend showing wrong API URL: ensure `VITE_API_URL` in `.env.prod` is correct and rebuild frontend image.

---

## Minimal `.env.prod.example` (copy and fill)

Create `/srv/zenshe_spa/.env.prod` from the example and fill secrets.

```bash
PORT=5000
NODE_ENV=production

DB_HOST=db.example.com
DB_PORT=3306
DB_USER=zenshe_app
DB_PASSWORD=StrongPasswordHere!
DB_NAME=zenshespa_database

JWT_SECRET=super-secret-jwt
JWT_EXPIRES_IN=24h

BREVO_API_KEY=...
BREVO_SENDER_EMAIL=...

JOTFORM_API_KEY=...
JOTFORM_FORM_ID=...

FRONTEND_URL=https://yourdomain.example
VITE_API_URL=https://yourdomain.example

NGROK_DOMAIN=
```

Do NOT commit this file to source control. Store it on the server or in a secrets manager.

---

If you want, I can add the `deploy/systemd/zenshe-compose.service.example`, a `docker-compose.prod.images.yml` that uses `image:` tags instead of `build:`, or a `docker-compose.traefik.yml` example that sets up Traefik with automatic Let's Encrypt. Tell me which one you want and I'll add it.
