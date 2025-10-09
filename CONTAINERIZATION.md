## Containerization & Docker

This repository now includes Dockerfiles for `frontend` and `backend` and a `docker-compose.yml` to run the full stack (frontend + backend + MySQL) for local testing and staging.

Quick summary:
- Backend: Node.js app served by `node src/app.js` (image built from `backend/Dockerfile`).
- Frontend: Built with Vite and served by nginx (multi-stage `frontend/Dockerfile`).
- DB: MySQL 8.0 managed by docker-compose service `db`.

Important security note:
- Do NOT commit secrets into `backend/.env` (the repo already contains references to `.env` in `.gitignore`).
- Rotate any credentials you have committed to the repo (Brevo, JotForm, Telegram, JWT_SECRET). See Security section below.

Local quick start (requires Docker and Docker Compose):

1) Copy the example env file and fill values (backend):

```powershell
copy backend\.env.example backend\.env
# Edit backend\.env using your editor and fill real secrets (do not commit this file)
```

2) Build and start the stack:

```powershell
docker compose up --build -d
```

3) Open the frontend at: http://localhost:3000
   The backend will be available at http://localhost:5000 and MySQL at port 3306.

Stopping and removing containers:

```powershell
docker compose down -v
```

Production notes:
- Use a managed MySQL service or provision a separate database container with proper backups and secure network rules.
- Set `NODE_ENV=production` and pass secrets via your orchestrator (Kubernetes secrets, ECS task definitions, GitHub Actions secrets during deploy, etc.) instead of a committed `.env`.
- Use HTTPS termination (load balancer, reverse proxy) in front of the nginx container.
- Use short-lived credentials and rotate compromised keys immediately.

Security checklist (minimum):
- Rotate exposed API keys (Brevo, JotForm, Telegram) immediately.
- Change JWT secret and invalidate tokens.
- Remove secrets from git history (BFG / git filter-repo) if they were ever committed.
- Add secret-scan to CI and a pre-commit hook (e.g., `git-secrets`).
