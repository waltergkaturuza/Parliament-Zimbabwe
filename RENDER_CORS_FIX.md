# Manual CORS Fix for Render

## Problem
The frontend at `https://parliament-zimbabwe-fuel.onrender.com` cannot access the backend at `https://parliament-zimbabwe.onrender.com` due to CORS policy blocking the requests.

## Quick Fix - Add Environment Variable in Render

### Step 1: Go to Render Dashboard
1. Open https://dashboard.render.com
2. Navigate to your backend service: **parliament-zimbabwe**
3. Click on the service name to open service details

### Step 2: Add Environment Variable
1. Go to the **Environment** tab
2. Click **Add Environment Variable**
3. Add the following:
   - **Key**: `ADDITIONAL_CORS_ORIGINS`
   - **Value**: `https://parliament-zimbabwe-fuel.onrender.com`

### Step 3: Deploy
1. Click **Save Changes**
2. This will trigger an automatic redeploy
3. Wait for deployment to complete (usually 2-3 minutes)

## Alternative: Force Redeploy
If the environment variable doesn't work immediately:

1. Go to **Manual Deploy** tab
2. Click **Deploy Latest Commit**
3. This will ensure the latest CORS settings are applied

## Test the Fix
After deployment completes:
1. Go to your frontend: https://parliament-zimbabwe-fuel.onrender.com
2. Try logging in again
3. CORS errors should be resolved

## Debug Information
You can check the CORS configuration by looking at the deployment logs:
- The logs will show: `DEBUG: CORS_ALLOWED_ORIGINS = [...]`
- Your frontend URL should appear in this list

## Multiple Origins (Optional)
If you need to add multiple frontend URLs, use comma separation:
```
https://parliament-zimbabwe-fuel.onrender.com,https://another-frontend.com
```

---

**This fix allows you to manually control CORS origins without code changes!**
