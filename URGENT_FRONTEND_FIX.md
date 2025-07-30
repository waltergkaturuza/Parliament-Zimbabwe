## URGENT: Frontend Deployment Fix Required

### Issue Identified
You have **TWO conflicting GitHub workflow files** for Azure Static Web Apps with:
- Different secret names
- Different backend API URLs (one incorrect)

### Immediate Fix Options

#### Option 1: Quick Fix - Add Both Secrets (Recommended)
1. **Get Azure Static Web Apps Deployment Token**:
   - Azure Portal → Resource Groups → parliament-fuel-tg 
   - Click "parliament-fuel-frontend" (Static Web App)
   - Click "Manage deployment token" → Copy the token

2. **Add BOTH secrets to GitHub**:
   - GitHub repo → Settings → Secrets and variables → Actions
   - Add secret #1:
     - Name: `AZURE_STATIC_WEB_APPS_API_TOKEN_PARLIAMENT_FUEL_FRONTEND`
     - Value: [paste token]
   - Add secret #2:
     - Name: `AZURE_STATIC_WEB_APPS_API_TOKEN_JOLLY_OCEAN_0E0DEE90F` 
     - Value: [same token]

#### Option 2: Clean Up (Better long-term)
1. Delete duplicate workflow file
2. Fix API URL in remaining workflow
3. Add correct secret

### Files to Fix:
- `.github/workflows/azure-static-web-apps.yml` (has WRONG backend URL)
- `.github/workflows/azure-static-web-apps-jolly-ocean-0e0dee90f.yml` (has CORRECT backend URL)

### Commands to Run After Secret is Added:
```bash
# Trigger new deployment
git commit --allow-empty -m "Trigger deployment"
git push origin main
```

### Current Backend URL Status:
❌ WRONG: `https://parliament-fuel-system.azurewebsites.net`  
✅ CORRECT: `https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net`

**ESTIMATED FIX TIME: 3 minutes**
