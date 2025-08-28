# Frontend Deployment to Render

## 🚀 Deploy Parliament Fuel System Frontend to Render

The backend is successfully deployed at: **https://parliament-zimbabwe.onrender.com**

Now let's deploy the frontend to Render for a unified deployment platform.

## 📋 Prerequisites

- Render account (render.com)
- GitHub repository connected to Render
- Backend deployed and running on Render

## 🔧 Deployment Steps

### 1. Create Frontend Service on Render

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **New Static Site**: Click "New" → "Static Site"
3. **Connect Repository**: Select your GitHub repo `Parliament-Zimbabwe`
4. **Configure Service**:
   - **Name**: `parliament-zimbabwe-frontend`
   - **Branch**: `main`
   - **Root Directory**: `fuel-coupon-frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

### 2. Environment Variables

Add these environment variables in Render dashboard:

```bash
NODE_ENV=production
VITE_API_BASE_URL=https://parliament-zimbabwe.onrender.com
VITE_API_URL=https://parliament-zimbabwe.onrender.com/api
```

### 3. Advanced Settings

In Render dashboard, add these headers for security:

```yaml
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
```

## 🔄 Alternative: Use render.yaml

Place this `render.yaml` in your repository root:

```yaml
services:
  - name: parliament-zimbabwe-frontend
    type: web
    runtime: static
    staticPublishPath: ./dist
    buildCommand: cd fuel-coupon-frontend && npm install && npm run build
    headers:
      - path: /*
        headers:
          - key: X-Frame-Options
            value: DENY
          - key: X-Content-Type-Options
            value: nosniff
          - key: X-XSS-Protection
            value: 1; mode=block
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
    env:
      - key: NODE_ENV
        value: production
      - key: VITE_API_BASE_URL
        value: https://parliament-zimbabwe.onrender.com
      - key: VITE_API_URL
        value: https://parliament-zimbabwe.onrender.com/api
```

## 🔗 Updated API Configuration

The frontend is now configured to use your Render backend:

- **Development**: `http://localhost:8000/api` (via Vite proxy)
- **Production**: `https://parliament-zimbabwe.onrender.com/api`

## ✅ Benefits of Moving to Render

1. **Unified Platform**: Both frontend and backend on Render
2. **Better Performance**: Same network for API calls
3. **Simplified Management**: One dashboard for everything
4. **Cost Efficiency**: Single platform billing
5. **No CORS Issues**: Internal network communication

## 🚀 Deployment URLs

After deployment:
- **Backend**: https://parliament-zimbabwe.onrender.com
- **Frontend**: https://parliament-zimbabwe-frontend.onrender.com (or custom domain)
- **API Health**: https://parliament-zimbabwe.onrender.com/api/health/

## 🔧 Local Development

For local development, the frontend will proxy API calls to `localhost:8000`:

```bash
cd fuel-coupon-frontend
npm install
npm run dev
```

The Vite dev server will run on `http://localhost:5174` and proxy API calls to your local Django backend.

## 📝 Notes

- The frontend automatically detects environment and uses appropriate API URLs
- All API endpoints have been updated from `/api/v1` to `/api` to match backend
- Environment files are set up for both development and production
- CORS is properly configured on the backend for the frontend domain

## 🎯 Ready to Deploy!

The frontend is now ready for Render deployment with:
- ✅ Updated API configuration
- ✅ Environment variables configured
- ✅ Build process optimized
- ✅ Security headers included
