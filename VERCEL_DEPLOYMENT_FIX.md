# Vercel Deployment Fix Guide

## 🔧 **Build Command Issue**

### In Vercel Dashboard > Settings > Build & Development:
```
Framework Preset: Other
Build Command: python manage.py collectstatic --noinput
Output Directory: (leave empty)
Install Command: pip install -r requirements.txt
Development Command: python manage.py runserver
```

## 🔄 **Vercel Not Refreshing**

### Check These Settings:
1. **Git Integration**: Vercel Dashboard > Settings > Git
   - Ensure branch is set to `main`
   - Auto-deploy should be ON
   
2. **Force Redeploy**:
   - Go to Deployments tab
   - Click "Redeploy" on latest deployment
   - Select "Use existing Build Cache" = OFF

3. **Check Webhook**:
   - GitHub repo > Settings > Webhooks
   - Should see Vercel webhook active

## 🌐 **Frontend/Backend Separation**

### You Need TWO Vercel Projects:

#### 1. Backend Project (Django API)
- **Project**: `parliament-fuel-system`
- **Repository**: `Parliament-Zimbabwe` (root directory)
- **URL**: `https://parliament-fuel-system.vercel.app`
- **Purpose**: Django API, admin, database

#### 2. Frontend Project (Next.js)
- **Project**: `parliament-fuel-frontend` 
- **Repository**: `Parliament-Zimbabwe` (fuel-coupon-frontend directory)
- **URL**: `https://parliament-fuel-frontend.vercel.app`
- **Purpose**: React UI, user interface

### Frontend Environment Variables:
```env
NEXT_PUBLIC_API_URL=https://parliament-fuel-system.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://ofwxvaxnqbcergdsyzkj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🚀 **Deployment Steps**

### Step 1: Fix Backend Build
1. Go to Vercel Dashboard > parliament-fuel-system
2. Settings > Build & Development
3. Update build command to: `python manage.py collectstatic --noinput`
4. Force redeploy

### Step 2: Deploy Frontend Separately
1. Create NEW Vercel project
2. Import same GitHub repo: `Parliament-Zimbabwe`
3. Set **Root Directory**: `fuel-coupon-frontend`
4. Framework: **Next.js**
5. Environment variables for API connection

### Step 3: Update Frontend API URLs
Update your React app to point to: `https://parliament-fuel-system.vercel.app`

## 🔍 **Why Separation is Needed**

1. **Different Runtimes**: Django (Python) vs Next.js (Node.js)
2. **Different Build Processes**: Django static files vs Next.js compilation
3. **Different Scaling**: API vs Static frontend
4. **Independent Deployments**: Frontend changes don't affect backend

## 🎯 **Next Actions**

1. **Fix build command** in Vercel dashboard
2. **Force redeploy** backend
3. **Create separate frontend project**
4. **Update API URLs** in frontend code

Would you like me to help with any of these steps?
