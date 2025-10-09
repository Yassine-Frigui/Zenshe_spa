# GitHub Actions Workflow - Manual Setup Required

## Why This File Wasn't Pushed

The GitHub Actions workflow file (`.github/workflows/docker-build-push.yml`) requires the `workflow` permission scope on your GitHub Personal Access Token to be created or modified via the API. This is a security measure by GitHub.

## How to Add the Workflow

You have two options:

### Option 1: Add Directly on GitHub (Recommended)

1. Go to your repository on GitHub: https://github.com/Yassine-Frigui/Zenshe_spa

2. Navigate to: **Actions** tab → **New workflow** → **set up a workflow yourself**

3. Name the file: `docker-build-push.yml`

4. Copy the content from: `.github/workflows/docker-build-push.yml` (exists in your local repo)

5. Or use this direct link format:
   ```
   https://github.com/Yassine-Frigui/Zenshe_spa/new/master?filename=.github%2Fworkflows%2Fdocker-build-push.yml
   ```

6. Commit directly to master branch

### Option 2: Push from Local (Requires Token Update)

If you prefer to push from command line:

1. Create a new Personal Access Token on GitHub:
   - Go to: Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Click "Generate new token (classic)"
   - Select scopes:
     - ✓ repo (all)
     - ✓ workflow
   - Generate and copy the token

2. Update your git remote to use the new token:
   ```powershell
   git remote set-url origin https://NEW_TOKEN@github.com/Yassine-Frigui/Zenshe_spa.git
   ```

3. Stage and commit the workflow file:
   ```powershell
   git add .github/workflows/docker-build-push.yml
   git commit -m "ci: Add Docker build and push workflow"
   git push origin master
   ```

## Workflow File Location

The workflow file is already created in your local repository at:
```
c:\Users\yassi\Desktop\dekstop\zenshe_spa\.github\workflows\docker-build-push.yml
```

## What the Workflow Does

Once added, the workflow will automatically:

1. **On Push to master/main/develop:**
   - Run all tests
   - Build Docker images for backend and frontend
   - Scan images with Trivy for security vulnerabilities
   - Push images to GitHub Container Registry (ghcr.io)
   - Generate Software Bill of Materials (SBOM)
   - Deploy to staging (develop branch) or production (master branch)

2. **On Pull Requests:**
   - Run tests
   - Build images (but don't push)

## After Adding the Workflow

1. **Verify it's running:**
   - Go to Actions tab on GitHub
   - You should see the workflow listed
   - Push a commit to trigger it

2. **Configure GitHub Environments:**
   - Go to Settings → Environments
   - Create "staging" environment
   - Create "production" environment
   - Add required reviewers to production (recommended)

3. **Check Container Registry:**
   - Go to your profile → Packages
   - You should see images after first successful workflow run:
     - `zenshe-spa-backend`
     - `zenshe-spa-frontend`

## Workflow File Content (for reference)

The workflow file is approximately 200 lines and includes:
- Test job (runs npm test for backend and frontend)
- Build-and-push job (matrix strategy for both services)
- Trivy security scanning
- SBOM generation
- Deploy-staging job (for develop branch)
- Deploy-production job (for master branch)
- Notification job

Full content is in: `.github/workflows/docker-build-push.yml`

## Alternative: Disable the Workflow

If you don't want to use GitHub Actions CI/CD:

1. Simply don't add the workflow file to GitHub
2. The workflow file remains local for reference
3. You can manually build and push images using:
   ```powershell
   # Build
   docker build -t your-registry/backend:tag ./backend
   docker build -t your-registry/frontend:tag ./frontend
   
   # Push
   docker push your-registry/backend:tag
   docker push your-registry/frontend:tag
   ```

## Need Help?

If you encounter issues:
- Check GitHub Actions documentation: https://docs.github.com/en/actions
- Review workflow syntax: https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions
- Ask in GitHub Community: https://github.community/

---

**Note:** All other Docker implementation files have been successfully pushed to the repository. Only this workflow file needs manual addition due to token permissions.
