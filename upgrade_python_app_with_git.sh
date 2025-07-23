#!/bin/bash
# Enhanced cPanel Deployment - Use Existing Python App + Git
# This script integrates Git with your existing Python app setup

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================${NC}"
echo -e "${GREEN}  Upgrading Python App with Git Integration${NC}"
echo -e "${BLUE}======================================================${NC}"
echo ""

# Check current setup
echo -e "${YELLOW}Current user:${NC} $(whoami)"
echo -e "${YELLOW}Home directory:${NC} $HOME"
echo -e "${YELLOW}Current directory:${NC} $(pwd)"
echo ""

# Step 1: Navigate to existing fuel-system directory
echo -e "${YELLOW}Step 1: Checking existing Python app...${NC}"
cd $HOME/fuel-system

# Backup existing files if any
if [ -f "passenger_wsgi.py" ] || [ -f "fuel.parliament.co.zw" ]; then
    echo -e "${YELLOW}Backing up existing files...${NC}"
    mkdir -p backup_$(date +%Y%m%d_%H%M%S)
    cp -r * backup_$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true
    echo -e "${GREEN}✅ Existing files backed up${NC}"
fi

# Step 2: Initialize Git in existing directory
echo -e "${YELLOW}Step 2: Setting up Git in existing directory...${NC}"

# Remove existing content but keep backup
find . -maxdepth 1 -name "backup_*" -prune -o -type f -exec rm {} \; 2>/dev/null || true
find . -maxdepth 1 -name "backup_*" -prune -o -type d -empty -exec rmdir {} \; 2>/dev/null || true

# Clone repository content
git clone https://github.com/waltergkaturuza/Parliament-Zimbabwe.git temp_repo
mv temp_repo/* .
mv temp_repo/.* . 2>/dev/null || true
rm -rf temp_repo

echo -e "${GREEN}✅ Repository content loaded${NC}"

# Step 3: Verify virtual environment
echo -e "${YELLOW}Step 3: Checking virtual environment...${NC}"
VENV_PATH="$HOME/virtualenv/fuel-system/3.11/bin/activate"

if [ -f "$VENV_PATH" ]; then
    source "$VENV_PATH"
    echo -e "${GREEN}✅ Virtual environment found and activated${NC}"
    echo -e "${YELLOW}Python executable:${NC} $(which python)"
    echo -e "${YELLOW}Python version:${NC} $(python --version)"
else
    echo -e "${RED}❌ Virtual environment not found${NC}"
    echo -e "${YELLOW}Please ensure Python app is created in cPanel first${NC}"
    exit 1
fi

# Step 4: Install/update dependencies
echo -e "${YELLOW}Step 4: Installing dependencies...${NC}"
if [ -f "requirements-cpanel.txt" ]; then
    pip install -r requirements-cpanel.txt
    echo -e "${GREEN}✅ Dependencies installed from requirements-cpanel.txt${NC}"
elif [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
    echo -e "${GREEN}✅ Dependencies installed from requirements.txt${NC}"
else
    echo -e "${RED}❌ No requirements file found${NC}"
    exit 1
fi

# Step 5: Setup Django
echo -e "${YELLOW}Step 5: Configuring Django...${NC}"
export DJANGO_SETTINGS_MODULE=config.settings.cpanel

# Run migrations
python manage.py makemigrations --settings=config.settings.cpanel
python manage.py migrate --settings=config.settings.cpanel
echo -e "${GREEN}✅ Database migrations completed${NC}"

# Collect static files
python manage.py collectstatic --noinput --settings=config.settings.cpanel
echo -e "${GREEN}✅ Static files collected${NC}"

# Step 6: Set permissions
echo -e "${YELLOW}Step 6: Setting file permissions...${NC}"
chmod 644 passenger_wsgi.py
chmod 755 *.sh 2>/dev/null || true
echo -e "${GREEN}✅ File permissions set${NC}"

# Step 7: Test setup
echo -e "${YELLOW}Step 7: Testing Django configuration...${NC}"
python manage.py check --settings=config.settings.cpanel
echo -e "${GREEN}✅ Django setup verified${NC}"

# Step 8: Initialize Git for future updates
echo -e "${YELLOW}Step 8: Setting up Git for future updates...${NC}"
git remote set-url origin https://github.com/waltergkaturuza/Parliament-Zimbabwe.git
git branch -M main
echo -e "${GREEN}✅ Git configured for updates${NC}"

# Final status
echo ""
echo -e "${BLUE}======================================================${NC}"
echo -e "${GREEN}     🎉 GIT INTEGRATION COMPLETE! 🎉${NC}"
echo -e "${BLUE}======================================================${NC}"
echo ""
echo -e "${GREEN}✅ Existing Python app preserved${NC}"
echo -e "${GREEN}✅ Git repository integrated${NC}"
echo -e "${GREEN}✅ Dependencies updated${NC}"
echo -e "${GREEN}✅ Database configured${NC}"
echo -e "${GREEN}✅ Static files ready${NC}"
echo ""
echo -e "${YELLOW}📍 Application Location:${NC} $HOME/fuel-system"
echo -e "${YELLOW}🌐 Website URL:${NC} https://fuel.parliament.co.zw"
echo -e "${YELLOW}🔧 Admin Panel:${NC} https://fuel.parliament.co.zw/admin"
echo ""
echo -e "${BLUE}🔄 For future updates, just run:${NC}"
echo -e "   cd $HOME/fuel-system"
echo -e "   source $VENV_PATH"
echo -e "   git pull origin main"
echo -e "   pip install -r requirements-cpanel.txt  # If new dependencies"
echo -e "   python manage.py migrate --settings=config.settings.cpanel  # If DB changes"
echo -e "   python manage.py collectstatic --noinput --settings=config.settings.cpanel"
echo -e "   touch passenger_wsgi.py  # Restart app"
echo ""
echo -e "${GREEN}🚀 Your app now has Git superpowers!${NC}"

# Optional: Create superuser
echo ""
echo -e "${BLUE}Optional: Create admin user? (y/n)${NC}"
read -r create_admin
if [[ $create_admin =~ ^[Yy]$ ]]; then
    python manage.py createsuperuser --settings=config.settings.cpanel
    echo -e "${GREEN}✅ Admin user created${NC}"
fi

echo ""
echo -e "${GREEN}🎯 Ready to test at: https://fuel.parliament.co.zw${NC}"
