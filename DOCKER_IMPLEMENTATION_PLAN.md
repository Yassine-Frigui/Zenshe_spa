# Docker implementation plan (development -> production)

I'll lay out a concrete, actionable plan to containerize the Zenshe_spa project, run it locally for development, and prepare it for secure production deployment. The plan focuses on reproducible builds, secrets management, CI/CD, monitoring, and safe rollout.

## 1) High-level contract

- Inputs: repository with `frontend/` (Vite React app) and `backend/` (Express/Node app), a MySQL-compatible database, environment variables for third-party services (Brevo, JotForm, Telegram), and a Docker host or orchestration platform.
- Outputs: container images for `frontend` and `backend`, a local `docker-compose` that spins up MySQL + backend + frontend for dev, CI pipeline to build/push images, and production deployment instructions (compose or Kubernetes manifests).
- Success criteria: app builds and runs with `docker compose up --build` locally; production deploy uses secrets manager (no plaintext secrets in repo); basic healthchecks pass; load balancer terminates TLS.
- Error modes: missing env variables, DB connectivity failures, third-party API rate limits or revoked keys, improper healthcheck/timeout settings.

## 2) Files & artifacts we added (already present or planned)

- `backend/Dockerfile` — Node production image (install production deps only).
- `frontend/Dockerfile` — multi-stage build (Node build + nginx serve).
- `frontend/nginx.conf` — nginx config with SPA fallback and proxying /api to backend service.
- `docker-compose.yml` — development compose file (db + backend + frontend).
- `backend/.env.example` — example env file (placeholders only).
- `CONTAINERIZATION.md` — quick start and security notes.
- `DOCKER_IMPLEMENTATION_PLAN.md` — this file (detailed plan).

If you want, next I can add a `docker-compose.prod.yml`, a `.dockerignore`, and a GitHub Actions workflow that builds & pushes images to a registry.

## 3) Development flow (fast local iteration)

Goals: make it easy to run the full stack locally and match production as closely as practical.

1. Prepare local env

   - Copy `backend/.env.example` -> `backend/.env` and fill local dev values (MySQL host, user, password, Brevo keys if needed for testing). Never commit `backend/.env`.

   Powershell example:

   ```powershell
   copy backend\.env.example backend\.env
   notepad backend\.env          # edit values locally
   ```

2. Build and run with compose

   ```powershell
   docker compose up --build -d
   docker compose logs -f backend
   ```

3. Validate the stack

   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000
   - MySQL: 3306 -> connect with your client to confirm DB created

4. Run quick smoke tests

   - Check the backend root or health endpoint (if not present add `/api/health` that returns 200).

   ```powershell
   curl http://localhost:5000/api/health
   ```

5. DB initialization

   - Use existing scripts: `npm run db:init` (backend package.json exposes `db:init` which runs `database/init.js`). Run this inside the container or locally targeting the compose DB.

   Example:

   ```powershell
   docker compose exec backend node database/init.js
   ```

Notes:

- Use `volumes` in compose for persistent DB during local dev. For production prefer a managed DB.
- Keep `BYPASS_AUTH=0` in local env unless you intentionally want a dev bypass.

## 4) Production differences and required changes

When moving to production, do the following changes (mandatory):

1. Secrets and config

   - Never deploy with `backend/.env` committed. Use a proper secrets manager (GitHub Secrets, AWS Secrets Manager, HashiCorp Vault, or environment variables injected by your orchestrator).
   - Rotate any secrets leaked in the repo now: BREVO API keys, JOTFORM_API_KEY, TELEGRAM_BOT_TOKEN, JWT_SECRET. Revoke old keys at provider consoles.
   - Set `BYPASS_AUTH=0` in production and ensure dev-only flags are removed.

2. External managed services

   - Use a managed MySQL (RDS, Cloud SQL, Azure Database) with private networking and backups instead of running MySQL container in production.
   - Use a managed SMTP/API provider for mail (Brevo) but with API keys restricted to production origins where possible.

3. Networking and TLS

   - Terminate TLS at the edge (load balancer, CDN, or reverse proxy). Do not rely on app containers for TLS certificates unless you run cert-manager.
   - Use an ingress / load balancer and configure healthchecks on the backend (e.g., `/api/health`) and readiness probes.

4. Hardening containers

   - Run containerized processes as non-root where possible (add a dedicated user in Dockerfile and use `USER` directive).
   - Pin base images to specific known-good versions and update regularly.
   - Enable content security headers in the backend (Helmet is already present); ensure production config is strict.
   - Remove dev-only packages from production images (we used `npm ci --only=production` in backend Dockerfile).

5. Logging, monitoring & backups

   - Forward container logs to a centralized system (CloudWatch, Stackdriver, ELK, etc.) rather than only stdout files.
   - Configure database backups (automated daily backups + point-in-time recovery if available).
   - Add a basic metrics / alerting plan (errors, 5xx, CPU, memory, DB connection failures).

6. CI/CD and image registry

   - Build images in CI and push to a registry (Docker Hub, GitHub Packages, ECR, GCR). Do not build images on the production host.
   - Tag images with semantic tags or commit SHA. Example tags: `zenshe/backend:sha-<short>`, `zenshe/frontend:sha-<short>`.

7. Compose vs Kubernetes

   - For small scale, a `docker-compose.prod.yml` that references a remote DB and uses secrets from environment may be sufficient.
   - For scalability and production-grade workloads, use Kubernetes deployments with HPA, Liveness/Readiness probes, and Ingress with TLS.

## 5) CI pipeline (example outline)

Use GitHub Actions (example) or your CI provider. Pipeline steps:

1. Checkout
2. Run tests (unit and integration) for backend and frontend
3. Build frontend production bundle (npm run build)
4. Build backend image and frontend image (multi-stage) or build frontend artifact and produce nginx image
5. Run a security scan (trivy or snyk) on images
6. Push images to registry with tag `sha-<short>` and `latest` (optional)
7. Deploy to staging environment (via `kubectl`, `ssh`, or registry trigger)

Skeleton job names:

- `test` -> runs `npm test` and `jest` in Lerna-like root scripts
- `build_and_push` -> builds, tags and pushes images
- `deploy` -> triggers deployment to runtime (staging/prod)

## 6) Security & secrets checklist (must do before prod)

- Rotate all leaked keys found in repo (Brevo, JotForm, Telegram, JWT secret). Revoke old keys in each provider.
- Remove `backend/.env` from the repository and replace with `.env.example` (already added). Ensure `.gitignore` contains `.env`.
- Purge secrets from Git history if they were committed using `git filter-repo` or BFG. Coordinate force-push with collaborators.
- Add a secret-scanning job in CI and local pre-commit hooks (`git-secrets`/`detect-secrets`).
- Use least-privilege API keys (IP restrictions, limited scopes) where providers support them.

## 7) Healthchecks & readiness

- Implement `/api/health` route returning 200 OK and optionally a small JSON (status + timestamp + DB connectivity). Example:

```js
// Express example
app.get('/api/health', async (req, res) => {
  // Optionally check DB quickly
  const ok = await db.testConnection();
  if (!ok) return res.status(503).json({ status: 'db_unavailable' });
  res.json({ status: 'ok', ts: Date.now() });
});
```

- Add Dockerfile `HEALTHCHECK` or rely on orchestration health probes in Kubernetes.

## 8) Rollout & rollback strategy

- Use blue/green or canary deployments where possible (Kubernetes or orchestrator supporting traffic routing).
- Tag images with immutable tags (commit SHA). Deploy new image to staging and run smoke tests. Promote to production on success.
- Rollback by deploying previous image tag. Ensure DB migrations are backward compatible or use separate migration step with downtime window.

## 9) Database migrations and stateful changes

- Keep schema migrations scripted and idempotent. Use `database/init.js` only for initial seeding.
- For migrations, consider using a migration tool (Flyway, Liquibase, or a Node migration library) and run migrations as a CI/CD job prior to deploy.

## 10) Small implementation tasks I can do for you now (pick any)

1. Add `docker-compose.prod.yml` that references external DB and reads secrets from `.env.prod` or environment.
2. Create a basic GitHub Actions workflow that builds, scans (Trivy), and pushes images to a registry.
3. Add `.dockerignore` files to backend and frontend to speed builds and keep images small.
4. Implement a simple `/api/health` endpoint and a node `HEALTHCHECK` in `backend/Dockerfile`.

Tell me which to do and I'll implement it in this branch.

## 11) Edge cases & gotchas

- Large `node_modules` in context: use `.dockerignore` to avoid copying development deps into the build context.
- File uploads: ensure `UPLOAD_DIR` is persisted via a volume or better, store uploads in S3-compatible storage in prod.
- Timeouts & concurrency: set proper request timeouts and DB pool sizes for your expected load.
- Local dev ports vs production ports: compose maps container port 80->host 3000 for convenience; in prod keep service ports internal and expose via LB only.

## 12) Quick checklist before pushing to production

- [ ] Rotate leaked secrets and revoke old API keys
- [ ] Ensure `backend/.env` is not in the repo and `.gitignore` contains it
- [ ] Build images in CI and scan them (Trivy)
- [ ] Use managed DB with backups and network restrictions
- [ ] Add TLS termination at edge and configure CORS for your frontend domain only
- [ ] Implement healthchecks and readiness probes
- [ ] Deploy to staging and run smoke tests
- [ ] Deploy to production with monitored rollout

## 13) Commands & examples (copyable)

Build and run locally (dev)

```powershell
docker compose up --build -d
docker compose logs -f backend
```

Rebuild a single service

```powershell
docker compose build backend
docker compose up -d backend
```

Simple health check (once the endpoint is present)

```powershell
curl http://localhost:5000/api/health
```

CI build + push (example, replace placeholders)

```yaml
# Pseudocode outline for GitHub Actions
name: Build & push
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build frontend image
        run: |
          docker build -t registry/zenshe/frontend:${{ github.sha }} -f frontend/Dockerfile frontend
      - name: Build backend image
        run: |
          docker build -t registry/zenshe/backend:${{ github.sha }} -f backend/Dockerfile backend
      - name: Scan images (trivy)
        run: trivy i registry/zenshe/backend:${{ github.sha }}
      - name: Push
        run: |
          docker push registry/zenshe/frontend:${{ github.sha }}
          docker push registry/zenshe/backend:${{ github.sha }}
```

---

If you'd like I can implement any of the tasks in section 10 now (add `.dockerignore`, add health route, add `docker-compose.prod.yml`, or add a GitHub Actions workflow). Which one should I do next?
