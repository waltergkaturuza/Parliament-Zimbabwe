# React Frontend Deployment Guide (Vite + Vercel)

## 🎯 **Overview**
Deploy your React frontend (`fuel-coupon-frontend`) as a separate Vercel project that connects to your Django backend.

## 📁 **Frontend Structure**
```
fuel-coupon-frontend/
├── src/
├── public/
├── package.json (Vite React app)
├── vite.config.ts
└── index.html
```

## 🚀 **Step-by-Step Deployment**

### Step 1: Create New Vercel Project
1. Go to [vercel.com/new](https://vercel.com/new)
2. **Import Git Repository**: Select `Parliament-Zimbabwe`
3. **Configure Project**:
   - **Project Name**: `parliament-fuel-frontend`
   - **Framework Preset**: **Vite**
   - **Root Directory**: `fuel-coupon-frontend`
4. Click **Deploy**

### Step 2: Correct Build Settings
**Framework**: Vite
**Build Command**: `npm run build`
**Output Directory**: `dist`
**Install Command**: `npm install`
**Development Command**: `npm run dev`

### Step 3: Environment Variables
Add these in Vercel Dashboard > Settings > Environment Variables:

```env
# Backend API Connection
VITE_API_URL=https://parliament-fuel-system.vercel.app
VITE_API_BASE_URL=https://parliament-fuel-system.vercel.app/api

# Supabase (if using direct frontend auth)
VITE_SUPABASE_URL=https://ofwxvaxnqbcergdsyzkj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9md3h2YXhucWJjZXJnZHN5emtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyOTA2OTIsImV4cCI6MjA3MTg2NjY5Mn0.fXE-mD3K4ajawTcrV3IszEkhBkOboxnWG9EK_jajmkA

# App Configuration
VITE_APP_ENV=production
VITE_APP_VERSION=2.0.5
```

### Step 4: Update API Configuration
Update your frontend API configuration to use environment variables.

## 🔗 **Expected URLs**
- **Frontend**: `https://parliament-fuel-frontend.vercel.app`
- **Backend API**: `https://parliament-fuel-system.vercel.app`

## 🔧 **Frontend Build Optimization**

### Vite Config (vite.config.ts)
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          antd: ['antd'],
        }
      }
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})
```

## 🛠 **Troubleshooting**

### Common Issues:
1. **Build Fails**: Check package.json dependencies
2. **API Connection**: Verify CORS settings in Django
3. **Environment Variables**: Must start with `VITE_`
4. **Static Assets**: Use relative paths

### Debug Steps:
1. Check Vercel deployment logs
2. Test API endpoints directly
3. Verify environment variables are loaded
4. Check browser console for errors

## 🔄 **Development Workflow**
1. **Local Development**: `npm run dev` (connects to local Django)
2. **Push to GitHub**: Auto-deploys to Vercel
3. **Production**: Frontend talks to production Django API

## 📋 **Deployment Checklist**
- [ ] Frontend deployed to separate Vercel project
- [ ] Environment variables configured
- [ ] API URLs point to production backend
- [ ] CORS configured in Django for frontend domain
- [ ] Static assets loading correctly
- [ ] Authentication flow working
