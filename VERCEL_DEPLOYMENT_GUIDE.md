# Vercel Deployment Guide for Parliament Fuel System

## Prerequisites
1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
3. **GitHub Repository**: Code should be in GitHub for deployment

## Step 1: Supabase Database Setup

### 1.1 Create Supabase Project ✅ COMPLETED
```
Project Name: parliament-fuel-system
Organization: zimbabwe-parliament 
Database Password: 74XTPTBFCaVipMaZ
Region: US East (AWS)
Project Ref: ofwxvaxnqbcergdsyzkj
```

### 1.2 Database Connection Details ✅ READY
Your Supabase database is ready with these credentials:
```
Host: db.ofwxvaxnqbcergdsyzkj.supabase.co
Database name: postgres
Port: 6543 (pooled) / 5432 (direct)
User: postgres
Password: 74XTPTBFCaVipMaZ
```

### 1.3 Connection String ✅ CONFIGURED
```
DATABASE_URL=postgres://postgres.ofwxvaxnqbcergdsyzkj:74XTPTBFCaVipMaZ@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x
```

## Step 2: Vercel Project Setup

### 2.1 Project Naming Options
Choose one of these names for your Vercel project:
- `parliament-fuel-system` (recommended)
- `zw-parliament-fuel-system`
- `zimbabwe-parliament-fuel`

### 2.2 Import from GitHub
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Choose the project name from above
4. Framework Preset: **Other**
5. Root Directory: `./` (keep default)

### 2.3 Build Settings
```
Build Command: pip install -r requirements.txt && python manage.py collectstatic --noinput
Output Directory: (leave empty)
Install Command: pip install -r requirements.txt
```

## Step 3: Environment Variables

### 3.1 Required Environment Variables ✅ READY TO COPY
Add these EXACT values in Vercel Dashboard > Settings > Environment Variables:

```env
# Django Settings
SECRET_KEY=django-insecure-generate-new-secret-key-with-command-below
DJANGO_SETTINGS_MODULE=config.settings.vercel
DEBUG=False

# Supabase Database (YOUR ACTUAL CREDENTIALS)
DATABASE_URL=postgres://postgres.ofwxvaxnqbcergdsyzkj:74XTPTBFCaVipMaZ@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x

# Supabase API Keys
SUPABASE_URL=https://ofwxvaxnqbcergdsyzkj.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9md3h2YXhucWJjZXJnZHN5emtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyOTA2OTIsImV4cCI6MjA3MTg2NjY5Mn0.fXE-mD3K4ajawTcrV3IszEkhBkOboxnWG9EK_jajmkA
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9md3h2YXhucWJjZXJnZHN5emtqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI5MDY5MiwiZXhwIjoyMDcxODY2NjkyfQ.FcXgUIU1uLZxRU_C7ywX8JRuGX7zpOQnqedognVH1o0

# Business Central (if applicable)
BC_TENANT_ID=your-tenant-id
BC_CLIENT_ID=your-client-id
BC_CLIENT_SECRET=your-client-secret
BC_ENVIRONMENT=Production
BC_COMPANY_ID=your-company-id
BC_BASE_URL=your-bc-url

# Optional Settings
PYTHONPATH=/var/task
```

### 3.2 Generate SECRET_KEY
Run this locally to generate a secure key:
```python
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

## Step 4: Deployment

### 4.1 Deploy to Vercel
1. Click **Deploy** in Vercel dashboard
2. Wait for build to complete
3. Your app will be available at: `https://[project-name].vercel.app`

### 4.2 Run Database Migrations
After first deployment, you need to run migrations. Use Vercel CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Login and link project
vercel login
vercel link

# Run migrations via serverless function
vercel env add MIGRATE_ON_DEPLOY true
```

Or create a migration endpoint in your Django app.

## Step 5: Frontend Deployment (Separate)

### 5.1 Frontend on Vercel
For the React frontend in `fuel-coupon-frontend/`:

```bash
cd fuel-coupon-frontend
vercel
```

Project settings:
- Framework: **Vite**
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### 5.2 Environment Variables for Frontend
```env
VITE_API_URL=https://parliament-fuel-system.vercel.app
VITE_APP_ENV=production
VITE_SUPABASE_URL=https://ofwxvaxnqbcergdsyzkj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9md3h2YXhucWJjZXJnZHN5emtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyOTA2OTIsImV4cCI6MjA3MTg2NjY5Mn0.fXE-mD3K4ajawTcrV3IszEkhBkOboxnWG9EK_jajmkA
```

## Step 6: Domain Configuration (Optional)

### 6.1 Custom Domain
1. Go to Vercel project > Settings > Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. Update ALLOWED_HOSTS and CORS settings accordingly

## Step 7: Monitoring and Logs

### 7.1 View Logs
```bash
vercel logs [deployment-url]
```

### 7.2 Function Logs
- Go to Vercel Dashboard > Functions
- Click on specific function for detailed logs

## Common Issues and Solutions

### Issue 1: Static Files Not Loading
**Solution**: Ensure `vercel.json` has correct static file routing

### Issue 2: Database Connection Errors
**Solution**: 
- Check DATABASE_URL format
- Verify Supabase project is active
- Ensure SSL connection settings

### Issue 3: Build Timeouts
**Solution**:
- Optimize requirements.txt
- Use build cache
- Split build steps if needed

### Issue 4: CORS Errors
**Solution**: Update CORS_ALLOWED_ORIGINS in vercel.py settings

## Security Checklist

- [ ] SECRET_KEY is strong and unique
- [ ] DEBUG=False in production
- [ ] Database credentials are secure
- [ ] ALLOWED_HOSTS properly configured
- [ ] CORS settings restrictive
- [ ] SSL enabled for database connections

## Quick Commands

```bash
# Deploy
vercel --prod

# Check deployment status
vercel ls

# View environment variables
vercel env ls

# Pull environment variables locally
vercel env pull .env.local
```

## Support Resources

- [Vercel Django Guide](https://vercel.com/guides/deploying-django-to-vercel)
- [Supabase Docs](https://supabase.com/docs)
- [Django on Vercel Examples](https://github.com/vercel/examples/tree/main/python)
