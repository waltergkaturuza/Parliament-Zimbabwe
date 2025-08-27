# Vercel Environment Variables - Parliament Fuel System

## Django Backend Environment Variables

### Copy these into Vercel Dashboard > Settings > Environment Variables:

```env
# Django Configuration
SECRET_KEY=django-insecure-generate-new-secret-key-here-make-it-very-long
DJANGO_SETTINGS_MODULE=config.settings.vercel
DEBUG=False
PYTHONDONTWRITEBYTECODE=1
PYTHONUNBUFFERED=1

# Supabase Database Connection
DATABASE_URL=postgres://postgres.ofwxvaxnqbcergdsyzkj:74XTPTBFCaVipMaZ@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x

# Alternative Database Format (if needed)
DB_NAME=postgres
DB_USER=postgres.ofwxvaxnqbcergdsyzkj
DB_PASSWORD=74XTPTBFCaVipMaZ
DB_HOST=aws-1-us-east-1.pooler.supabase.com
DB_PORT=6543

# Supabase API Keys (for future integrations)
SUPABASE_URL=https://ofwxvaxnqbcergdsyzkj.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9md3h2YXhucWJjZXJnZHN5emtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyOTA2OTIsImV4cCI6MjA3MTg2NjY5Mn0.fXE-mD3K4ajawTcrV3IszEkhBkOboxnWG9EK_jajmkA
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9md3h2YXhucWJjZXJnZHN5emtqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI5MDY5MiwiZXhwIjoyMDcxODY2NjkyfQ.FcXgUIU1uLZxRU_C7ywX8JRuGX7zpOQnqedognVH1o0
```

## React Frontend Environment Variables

### For fuel-coupon-frontend project:

```env
# API Configuration
VITE_API_URL=https://parliament-fuel-system.vercel.app
VITE_APP_ENV=production

# Supabase Frontend Config
VITE_SUPABASE_URL=https://ofwxvaxnqbcergdsyzkj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9md3h2YXhucWJjZXJnZHN5emtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyOTA2OTIsImV4cCI6MjA3MTg2NjY5Mn0.fXE-mD3K4ajawTcrV3IszEkhBkOboxnWG9EK_jajmkA
```

## How to Add to Vercel

### Method 1: Vercel Dashboard (Recommended)
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click your project: **parliament-fuel-system**
3. Go to **Settings** > **Environment Variables**
4. Add each variable above, one by one
5. Select **Production**, **Preview**, and **Development** for each

### Method 2: Vercel CLI
```bash
# Install and login
npm i -g vercel
vercel login
vercel link

# Add environment variables
vercel env add SECRET_KEY
vercel env add DATABASE_URL
vercel env add DJANGO_SETTINGS_MODULE
```

## Generate SECRET_KEY

Run this command to generate a strong SECRET_KEY:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Example output:
```
django-insecure-x8k9@#$mq2n!v*3&amp;h7^p4r@#$%fgh#$%dfgh456789qwertyuiop
```

## Deployment Steps

### 1. Add Environment Variables
Copy all the Django variables above into Vercel

### 2. Deploy Backend
```bash
# Push to GitHub
git add .
git commit -m "Add Vercel configuration"
git push origin main

# Deploy via Vercel (auto-deploys from GitHub)
```

### 3. Run Initial Migration
After first deployment, you'll need to run migrations. Create this endpoint in your Django app or use Vercel CLI.

### 4. Deploy Frontend Separately
Deploy the React frontend as a separate Vercel project with the frontend environment variables.

## Database Connection Test

Your Django app will connect to Supabase using:
- **Host**: aws-1-us-east-1.pooler.supabase.com
- **Port**: 6543 (pooled connection)
- **Database**: postgres
- **User**: postgres.ofwxvaxnqbcergdsyzkj
- **SSL**: Required
- **Connection Pooling**: Enabled

## Security Notes

- ✅ **DATABASE_URL** includes SSL requirement
- ✅ **Service Role Key** included for admin operations
- ✅ **Anon Key** for frontend authentication
- ⚠️ **Never commit** these credentials to Git
- 🔒 **Rotate keys** periodically in Supabase dashboard
