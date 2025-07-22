# cPanel Deployment Checklist for Parliament Fuel Coupon System

## Step 1: Upload Application Files ✅ READY
Upload these directories/files to `/home/parliam1/fuel-system/`:

### Core Django Files:
- [ ] `config/` (entire directory with all subdirectories)
- [ ] `fuel/` (entire directory with all subdirectories) 
- [ ] `auth/` (entire directory)
- [ ] `utils/` (entire directory)
- [ ] `manage.py`

### Configuration Files (Already Created):
- [x] `passenger_wsgi.py` ✅ 
- [x] `fuel.parliament.co.zw` ✅
- [ ] `config/settings/cpanel.py` (upload the local version)
- [ ] `requirements-cpanel.txt`

## Step 2: Install Dependencies
After uploading files, run in cPanel Terminal:
```bash
cd /home/parliam1/fuel-system
source /home/parliam1/virtualenv/fuel-system/3.11/bin/activate
pip install -r requirements-cpanel.txt
```

## Step 3: Database Setup
```bash
cd /home/parliam1/fuel-system
source /home/parliam1/virtualenv/fuel-system/3.11/bin/activate
python manage.py makemigrations --settings=config.settings.cpanel
python manage.py migrate --settings=config.settings.cpanel
python manage.py collectstatic --noinput --settings=config.settings.cpanel
python manage.py createsuperuser --settings=config.settings.cpanel
```

## Step 4: Test Application
- [ ] Visit https://fuel.parliament.co.zw
- [ ] Check admin panel: https://fuel.parliament.co.zw/admin
- [ ] Test basic functionality

## Step 5: Business Central Integration Setup (Optional)
- [ ] Configure BC_TENANT_ID in cpanel.py settings
- [ ] Configure BC_CLIENT_ID in cpanel.py settings  
- [ ] Configure BC_CLIENT_SECRET in cpanel.py settings
- [ ] Test BC embedding: https://fuel.parliament.co.zw/bc/dashboard/

## File Upload Instructions:

### Option 1: Using cPanel File Manager (Recommended)
1. Go to cPanel → File Manager
2. Navigate to `/home/parliam1/fuel-system/`
3. Use "Upload" button to upload a ZIP file of your project
4. Extract the ZIP file in the fuel-system directory

### Option 2: Using FTP/SFTP
- Host: parliament.co.zw
- Username: parliam1
- Upload to: `/home/parliam1/fuel-system/`

### Option 3: Create ZIP file locally
Run this command in your local project directory:
```bash
# Windows PowerShell
Compress-Archive -Path "config","fuel","auth","utils","manage.py","requirements-cpanel.txt" -DestinationPath "fuel-system-upload.zip"
```

## Important Notes:
- Make sure virtual environment is activated for all Python commands
- Database file will be created as `db_cpanel.sqlite3`
- Static files will be collected to `/static/` directory
- Check error logs at `/home/parliam1/fuel-system/django_errors.log`

## Troubleshooting:
- If you get import errors, check virtual environment is activated
- If static files don't load, run collectstatic command again
- For permission issues, check file permissions in cPanel File Manager
