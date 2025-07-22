# Git-Based Deployment Guide for cPanel
## Parliament Fuel Coupon System

### 🎯 Why Git Integration is Perfect for Your Use Case:

1. **Easy Updates**: Make changes locally → Push to GitHub → Pull on server
2. **Version Control**: Track all changes, rollback if needed
3. **Team Collaboration**: Multiple developers can contribute
4. **Automated Deployment**: Set up webhooks for automatic updates
5. **Professional Workflow**: Industry standard development practice

---

## 🚀 Setup Methods

### Method 1: cPanel Git Version Control Interface (Recommended)

#### Step 1: Access Git in cPanel
1. Login to cPanel at `https://parliament.co.zw:2083`
2. Look for **"Git Version Control"** in the interface
3. Click **"Create"** or **"Clone Repository"**

#### Step 2: Clone Repository
```
Repository URL: https://github.com/waltergkaturuza/Parliament-Zimbabwe.git
Branch: main
Repository Path: fuel-system
```

#### Step 3: Configure Deployment
- **Repository Name**: `Parliament-Zimbabwe`
- **Deployment Path**: `/home/parliam1/fuel-system/`
- **Auto-deploy**: Enable (if available)

### Method 2: Terminal Git Commands (Alternative)

If Git Version Control isn't available in cPanel interface:

#### Step 1: Access cPanel Terminal
```bash
# Navigate to target directory
cd /home/parliam1/

# Clone the repository
git clone https://github.com/waltergkaturuza/Parliament-Zimbabwe.git fuel-system

# Navigate to project
cd fuel-system/
```

#### Step 2: Set up Python environment
```bash
# Activate virtual environment
source /home/parliam1/virtualenv/fuel-system/3.11/bin/activate

# Install dependencies
pip install -r requirements-cpanel.txt

# Run initial setup
python manage.py migrate --settings=config.settings.cpanel
python manage.py collectstatic --noinput --settings=config.settings.cpanel
python manage.py createsuperuser --settings=config.settings.cpanel
```

---

## 🔄 Development Workflow

### Making Changes and Deploying:

#### 1. Local Development
```bash
# Make your changes locally in VS Code
# Test locally: python manage.py runserver

# Commit changes
git add .
git commit -m "Add new feature: description"
git push origin main
```

#### 2. Deploy to cPanel
Choose one of these options:

**Option A: cPanel Interface**
- Go to Git Version Control
- Click "Pull" or "Deploy" button
- Changes deployed automatically

**Option B: Terminal**
```bash
# SSH to cPanel or use cPanel Terminal
cd /home/parliam1/fuel-system/
source /home/parliam1/virtualenv/fuel-system/3.11/bin/activate
git pull origin main
pip install -r requirements-cpanel.txt  # If new dependencies
python manage.py migrate --settings=config.settings.cpanel  # If database changes
python manage.py collectstatic --noinput --settings=config.settings.cpanel
touch passenger_wsgi.py  # Restart application
```

**Option C: Use Deployment Script**
```bash
chmod +x deploy_cpanel.sh
./deploy_cpanel.sh
```

---

## 🔧 Advanced Git Features

### 1. Environment-Specific Branches
```bash
# Create production branch
git checkout -b production
git push origin production

# Use production branch for stable releases
# Use main branch for development
```

### 2. Git Hooks for Automated Deployment
Create webhook in GitHub Settings:
- URL: `https://your-webhook-url.com/deploy`
- Events: Push to main branch
- Auto-deploy on every push

### 3. Rollback Strategy
```bash
# View commit history
git log --oneline

# Rollback to previous version
git checkout <commit-hash>
git checkout -b rollback-temp
git push origin rollback-temp

# Or reset to specific commit
git reset --hard <commit-hash>
git push --force origin main
```

---

## 📁 Repository Structure for cPanel

Your GitHub repo should have this structure:
```
Parliament-Zimbabwe/
├── config/                 # Django settings
├── fuel/                   # Main application
├── auth/                   # Authentication
├── utils/                  # Utilities
├── manage.py              # Django management
├── requirements.txt       # Main dependencies
├── requirements-cpanel.txt # cPanel-specific dependencies
├── passenger_wsgi.py      # cPanel WSGI entry point
├── deploy_cpanel.sh       # Deployment script
└── README.md             # Documentation
```

---

## ✅ Benefits for Your Development Process

### Immediate Benefits:
1. **No Manual File Uploads**: Everything via Git commands
2. **Easy Collaboration**: Share repository with team members
3. **Version History**: See what changed and when
4. **Quick Rollbacks**: Undo problematic changes instantly

### Long-term Benefits:
1. **Professional Workflow**: Industry standard practices
2. **CI/CD Integration**: Add automated testing later
3. **Multiple Environments**: Easy staging/production setup
4. **Documentation**: Changes tracked with commit messages

---

## 🎯 Next Steps

1. **Choose your preferred method** (cPanel Git interface or terminal)
2. **Clone the repository** to `/home/parliam1/fuel-system/`
3. **Set up the Python environment** and dependencies
4. **Test the deployment** with a small change
5. **Configure automated deployment** (optional)

This approach will make your development process much more efficient and professional!
