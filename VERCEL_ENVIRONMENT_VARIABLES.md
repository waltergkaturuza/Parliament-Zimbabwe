# Parliament Fuel System - Vercel Environment Variables

## Core Django Settings

```env
# Django Configuration
SECRET_KEY=django-insecure-your-very-long-secret-key-here-make-it-unique
DJANGO_SETTINGS_MODULE=config.settings.vercel
DEBUG=False
PYTHONPATH=/var/task
```

## Database Configuration (Supabase)

```env
# Supabase PostgreSQL Database
DATABASE_URL=postgresql://postgres:[your-password]@db.[project-ref].supabase.co:5432/postgres
```

### How to get DATABASE_URL:
1. Go to your Supabase project dashboard
2. Navigate to **Settings > Database**
3. Copy the connection string and replace `[YOUR-PASSWORD]` with your actual password

Example format:
```
DATABASE_URL=postgresql://postgres:MySecurePass123@db.abcdefghijklmnop.supabase.co:5432/postgres
```

## Business Central Integration (Optional)

```env
# Microsoft Business Central API
BC_TENANT_ID=your-azure-tenant-id
BC_CLIENT_ID=your-registered-app-client-id
BC_CLIENT_SECRET=your-client-secret-value
BC_ENVIRONMENT=Production
BC_COMPANY_ID=your-company-guid
BC_BASE_URL=https://api.businesscentral.dynamics.com/v2.0/[tenant-id]/[environment]
```

## Frontend Environment Variables

For the React frontend (`fuel-coupon-frontend` project):

```env
# Frontend Configuration
VITE_API_URL=https://parliament-fuel-system.vercel.app
VITE_APP_ENV=production
VITE_APP_VERSION=2.0.5
```

## How to Add Environment Variables in Vercel

### Method 1: Vercel Dashboard
1. Go to your project in [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project name
3. Go to **Settings** tab
4. Click **Environment Variables**
5. Add each variable with key and value
6. Select environments: **Production**, **Preview**, **Development**

### Method 2: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login and link project
vercel login
vercel link

# Add environment variables
vercel env add SECRET_KEY
vercel env add DATABASE_URL
vercel env add DJANGO_SETTINGS_MODULE
```

### Method 3: Bulk Import
Create a `.env.production` file locally:
```env
SECRET_KEY=your-secret-key
DATABASE_URL=your-database-url
DJANGO_SETTINGS_MODULE=config.settings.vercel
DEBUG=False
```

Then import:
```bash
vercel env add < .env.production
```

## Security Notes

- **Never commit** environment variables to Git
- Use strong, unique passwords for database connections
- Regularly rotate SECRET_KEY and database passwords
- Keep Business Central credentials secure
- Use different environment variables for development/staging/production

## Environment Variable Validation

To test your environment variables locally:

```python
# Create test script: test_env.py
import os
from django.core.management.utils import get_random_secret_key

# Test required variables
required_vars = [
    'SECRET_KEY',
    'DATABASE_URL',
    'DJANGO_SETTINGS_MODULE'
]

for var in required_vars:
    value = os.environ.get(var)
    if value:
        print(f"✅ {var}: Set (length: {len(value)})")
    else:
        print(f"❌ {var}: Missing")

# Generate new SECRET_KEY if needed
print(f"\nNew SECRET_KEY: {get_random_secret_key()}")
```

Run with:
```bash
python test_env.py
```

## Common Issues

### Issue: Database Connection Failed
**Solution**: Check DATABASE_URL format and Supabase project status

### Issue: SECRET_KEY Missing
**Solution**: Generate and set a strong SECRET_KEY

### Issue: Build Fails
**Solution**: Ensure DJANGO_SETTINGS_MODULE points to config.settings.vercel

### Issue: Static Files Not Loading
**Solution**: Verify static file configuration in vercel.json
