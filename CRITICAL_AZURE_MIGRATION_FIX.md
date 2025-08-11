# 🚨 CRITICAL AZURE PRODUCTION MIGRATION FIX 

## IMMEDIATE ACTION REQUIRED

**ERROR**: `django.db.utils.ProgrammingError: column fuel_user.digital_signature does not exist`

**CAUSE**: Migration 0008_enhance_book_coupon_tracking was not applied to Azure production database

**STATUS**: Azure application restarted but migration not executed

## SOLUTION 1: Azure App Service SSH (RECOMMENDED)

1. Go to Azure Portal → parliament-fuel-system App Service
2. Navigate to Development Tools → SSH
3. Click "Go" to open SSH terminal
4. Run these commands:

```bash
cd /home/site/wwwroot
python manage.py migrate fuel
python manage.py migrate
```

## SOLUTION 2: Azure CLI from Local Machine

```bash
# Login to Azure
az login

# Set subscription
az account set --subscription "your-subscription-id"

# Execute migration via SSH
az webapp ssh --resource-group parliament-fuel-rg --name parliament-fuel-system
```

Then in SSH terminal:
```bash
cd /home/site/wwwroot
python manage.py migrate fuel
```

## SOLUTION 3: GitHub Actions Deployment

The migration should run automatically on next deployment. To force:

1. Make any small change to trigger deployment
2. Push to main branch
3. Wait for GitHub Actions to complete

## SOLUTION 4: Manual Database Update (LAST RESORT)

If migrations fail, run this SQL directly on Azure PostgreSQL:

```sql
-- Connect to parliament-fuel-postgres database
ALTER TABLE fuel_user ADD COLUMN digital_signature TEXT;
ALTER TABLE fuel_user ADD COLUMN signature_uploaded_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE fuel_user ADD COLUMN profile_picture VARCHAR(100);
ALTER TABLE fuel_user ADD COLUMN full_address TEXT;
ALTER TABLE fuel_user ADD COLUMN national_id VARCHAR(50);

ALTER TABLE fuel_book ADD COLUMN book_code VARCHAR(20);
ALTER TABLE fuel_book ADD COLUMN generated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE fuel_book ADD COLUMN generated_by_id INTEGER;
ALTER TABLE fuel_book ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE fuel_book ADD COLUMN verified_by_id INTEGER;
ALTER TABLE fuel_book ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE fuel_book ADD COLUMN verification_notes TEXT;

-- Add foreign key constraints
ALTER TABLE fuel_book ADD CONSTRAINT fuel_book_generated_by_id_fk 
  FOREIGN KEY (generated_by_id) REFERENCES fuel_user(id);
ALTER TABLE fuel_book ADD CONSTRAINT fuel_book_verified_by_id_fk 
  FOREIGN KEY (verified_by_id) REFERENCES fuel_user(id);

-- Update django_migrations table
INSERT INTO django_migrations (app, name, applied) 
VALUES ('fuel', '0008_enhance_book_coupon_tracking', NOW());
```

## VERIFICATION

After applying migration, verify with:

```bash
python manage.py showmigrations fuel
```

Should show:
```
fuel
 [X] 0001_initial
 [X] 0002_...
 [X] 0008_enhance_book_coupon_tracking
```

## TEST

1. Try login at: https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net/
2. Should not get 500 error
3. Admin panel should work: /admin/

---

**CRITICAL**: This must be fixed immediately as ALL authentication is broken in production!
