# Vercel Build Command Fix Guide

## 🎯 **Current Issue**
Your Vercel build command is showing a complex path that's incorrect for Django.

## ✅ **Correct Settings for Vercel Dashboard**

### Go to: Vercel Dashboard > parliament-fuel-system > Settings > Build & Development

**Framework Preset:** Other

**Build Command:**
```
python manage.py collectstatic --noinput
```

**Output Directory:**
```
(leave empty)
```

**Install Command:**
```
pip install -r requirements.txt
```

**Development Command:**
```
python manage.py runserver
```

## 🔄 **How to Apply the Fix**

### Step 1: Update Build Settings
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on **parliament-fuel-system** project
3. Go to **Settings** tab
4. Click **Build & Development Settings**
5. Toggle **Override** for Build Command
6. Enter: `python manage.py collectstatic --noinput`
7. Click **Save**

### Step 2: Force Redeploy
1. Go to **Deployments** tab
2. Find latest deployment
3. Click the **three dots (...)** menu
4. Select **Redeploy**
5. Uncheck **Use existing Build Cache**
6. Click **Redeploy**

### Step 3: Check Environment Variables
Ensure these are set in **Settings > Environment Variables**:
```env
SECRET_KEY=your-generated-secret-key
DJANGO_SETTINGS_MODULE=config.settings.vercel
DATABASE_URL=postgres://postgres.ofwxvaxnqbcergdsyzkj:74XTPTBFCaVipMaZ@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x
DEBUG=False
SUPABASE_URL=https://ofwxvaxnqbcergdsyzkj.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9md3h2YXhucWJjZXJnZHN5emtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyOTA2OTIsImV4cCI6MjA3MTg2NjY5Mn0.fXE-mD3K4ajawTcrV3IszEkhBkOboxnWG9EK_jajmkA
```

## 🎯 **Expected Result**
After fixing, your deployment should:
- ✅ Build successfully
- ✅ Serve at `https://parliament-fuel-system.vercel.app`
- ✅ Load Django admin at `/admin/`
- ✅ Serve API endpoints

## 🚨 **If Build Still Fails**
Check deployment logs for:
- Missing dependencies in requirements.txt
- Database connection issues
- Static file collection errors
