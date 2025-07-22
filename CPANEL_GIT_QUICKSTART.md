# 🚀 cPanel Git Deployment - Quick Start Guide

## Method 1: cPanel Git Interface (Recommended)

### Step 1: Access Git Version Control
1. Login to cPanel: `https://parliament.co.zw:2083`
2. Find **"Git Version Control"** (usually under Files section)
3. Click **"Create"** or **"Clone Repository"**

### Step 2: Repository Configuration
```
Repository URL: https://github.com/waltergkaturuza/Parliament-Zimbabwe.git
Branch: main
Repository Name: Parliament-Zimbabwe
Repository Path: fuel-system
```

### Step 3: Deploy
- Click **"Create"** or **"Clone"**
- Wait for cloning to complete
- Click **"Manage"** → **"Pull or Deploy"**

---

## Method 2: Terminal Commands (Alternative)

### Step 1: Access Terminal
- cPanel → **Terminal** or **SSH Access**

### Step 2: Run Setup Script
```bash
# Download and run the setup script
curl -O https://raw.githubusercontent.com/waltergkaturuza/Parliament-Zimbabwe/main/setup_cpanel_git.sh
chmod +x setup_cpanel_git.sh
./setup_cpanel_git.sh
```

### Step 3: Manual Setup (if script fails)
```bash
# Navigate to home directory
cd $HOME

# Clone repository
git clone https://github.com/waltergkaturuza/Parliament-Zimbabwe.git fuel-system
cd fuel-system

# Activate virtual environment
source $HOME/virtualenv/fuel-system/3.11/bin/activate

# Install dependencies
pip install -r requirements-cpanel.txt

# Setup Django
python manage.py migrate --settings=config.settings.cpanel
python manage.py collectstatic --noinput --settings=config.settings.cpanel
python manage.py createsuperuser --settings=config.settings.cpanel

# Set permissions
chmod 644 passenger_wsgi.py
```

---

## 🔄 Future Updates Workflow

### When you make changes locally:

1. **Local Development**:
   ```bash
   # Make changes in VS Code
   git add .
   git commit -m "Description of changes"
   git push origin main
   ```

2. **Deploy to cPanel**:
   
   **Option A: Git Interface**
   - Go to cPanel → Git Version Control
   - Click **"Pull or Deploy"**
   
   **Option B: Terminal**
   ```bash
   cd $HOME/fuel-system
   source $HOME/virtualenv/fuel-system/3.11/bin/activate
   git pull origin main
   pip install -r requirements-cpanel.txt  # If new dependencies
   python manage.py migrate --settings=config.settings.cpanel  # If DB changes
   python manage.py collectstatic --noinput --settings=config.settings.cpanel
   touch passenger_wsgi.py  # Restart application
   ```

---

## 🎯 Expected Results

After successful deployment:

- **Website**: https://fuel.parliament.co.zw
- **Admin Panel**: https://fuel.parliament.co.zw/admin
- **BC Integration**: https://fuel.parliament.co.zw/bc/dashboard/

---

## 🛠️ Troubleshooting

### Common Issues:

1. **Import Errors**:
   - Ensure virtual environment is activated
   - Check Python path in passenger_wsgi.py

2. **Database Errors**:
   - Run migrations: `python manage.py migrate --settings=config.settings.cpanel`

3. **Static Files Not Loading**:
   - Run: `python manage.py collectstatic --noinput --settings=config.settings.cpanel`

4. **Application Not Updating**:
   - Touch WSGI file: `touch passenger_wsgi.py`

### Debug Commands:
```bash
# Check Django configuration
python manage.py check --settings=config.settings.cpanel

# View error logs
tail -f $HOME/fuel-system/django_errors.log

# Test Django shell
python manage.py shell --settings=config.settings.cpanel
```

---

## 📞 Support

If you encounter issues:
1. Check the error logs in cPanel
2. Verify virtual environment is active
3. Ensure all files are uploaded correctly
4. Contact hosting support if needed
