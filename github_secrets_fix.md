## GitHub Deployment Token Fix Guide

### Issue
Your GitHub Actions is failing with:
```
deployment_token was not provided.
The deployment_token is required for deploying content.
```

### Solution Steps

#### Step 1: Get Azure Static Web Apps Deployment Token
1. Go to **Azure Portal**: https://portal.azure.com
2. Navigate to **Resource Groups** → **parliament-fuel-tg**
3. Click on **parliament-fuel-frontend** (Static Web App)
4. In the left menu, click **"Manage deployment token"**
5. **Copy the deployment token** (it starts with something like `swa-`)

#### Step 2: Add Token to GitHub Secrets
1. Go to your **GitHub repository**: https://github.com/waltergkaturuza/Parliament-Zimbabwe
2. Click **Settings** tab (at the top of repository)
3. In left sidebar, click **Secrets and variables** → **Actions**
4. Click **"New repository secret"**
5. Enter:
   - **Name**: `AZURE_STATIC_WEB_APPS_API_TOKEN_PARLIAMENT_FUEL_FRONTEND`
   - **Value**: [Paste the deployment token from Azure]
6. Click **"Add secret"**

#### Step 3: Trigger New Deployment
1. Make a small change to your frontend code (or just add a space somewhere)
2. Commit and push the change
3. GitHub Actions should now deploy successfully

### Alternative: Fix GitHub Workflow File
If the above doesn't work, check your `.github/workflows/` file and ensure it references the correct secret name.

### Expected Result
After adding the secret:
- GitHub Actions will deploy successfully
- Your frontend will be available at: https://jolly-ocean-0e0dee90f.2.azurestaticapps.net
- Backend-frontend communication should work
