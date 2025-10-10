# README_DEPLOYEMENT.md

Plain, exact steps for the deployer. Follow these commands in order.

One-line policy: Do not change `backend/.env` in the repo — use `.env.prod` for production.

Prerequisites (on the deploy host)

- Docker installed

- Docker Compose (v2) installed

- Access to the managed MySQL server and the DB dump file (zenshe_dump.sql)


Steps (Windows `cmd` examples)

1. Put the repository on the server (unzip or clone) and cd to repo root:

```cmd
cd C:\path\to\repo
```

1. Create `.env.prod` in the repo root and fill the values below (replace placeholders):

```bash
PORT=5000
NODE_ENV=production

DB_HOST=DB_HOST_HERE
DB_PORT=3306
DB_USER=zenshe_app
DB_PASSWORD=StrongPasswordHere!
DB_NAME=zenshespa_database

JWT_SECRET=PutStrongJWTSecretHere
JWT_EXPIRES_IN=24h

BREVO_API_KEY=...
BREVO_SENDER_EMAIL=...

JOTFORM_API_KEY=...
JOTFORM_FORM_ID=...

FRONTEND_URL=https://yourdomain.example
VITE_API_URL=https://yourdomain.example

NGROK_DOMAIN=
```

1. Create the database and app DB user on the managed MySQL (run on DB server or via admin UI). Replace `StrongPasswordHere!`:

```sql
CREATE DATABASE IF NOT EXISTS zenshespa_database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'zenshe_app'@'%' IDENTIFIED BY 'StrongPasswordHere!';
GRANT ALL PRIVILEGES ON zenshespa_database.* TO 'zenshe_app'@'%';
FLUSH PRIVILEGES;
```

1. Import the DB dump into the managed DB (from a machine that can reach the DB host). Replace DB_HOST/PORT/user as needed:

```bash
mysql -h DB_HOST_HERE -P 3306 -u zenshe_app -p zenshespa_database < C:\path\to\zenshe_dump.sql
```

If the deployer uses a cloud provider UI (Cloud SQL, cPanel, phpMyAdmin) they can upload the `zenshe_dump.sql` there.

1. Ensure `.env.prod` has HTTPS values (if using TLS). Example:

```bash
FRONTEND_URL=https://yourdomain.example
VITE_API_URL=https://api.yourdomain.example
```

1. Build and start the services:

```cmd
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

1. Smoke tests (replace yourdomain.example):

```cmd
curl -i https://yourdomain.example/api/health
curl -i https://yourdomain.example/api/public/services
```

1. If you change `VITE_API_URL` later you must rebuild the frontend and restart it:

```cmd
docker compose -f docker-compose.prod.yml --env-file .env.prod build frontend
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d frontend
```

1. To stop everything:

```cmd
docker compose -f docker-compose.prod.yml --env-file .env.prod down
```


TLS note (assume deployer WILL use TLS):

- Recommended: terminate TLS at a reverse proxy or load balancer (Traefik/nginx or cloud load balancer). No code changes are required. Set `FRONTEND_URL` and `VITE_API_URL` to `https://...` and run the build command above.

- Alternative (not recommended for non-experts): make the `frontend` nginx serve TLS directly. That requires mounting cert files into the `frontend` service and exposing port 443 in `docker-compose.prod.yml` and updating `frontend/nginx.conf` to use the certs.

If you want a single-page printable instruction for the deployer (one file to attach with the DB dump), this file is ready to send. End of file.
