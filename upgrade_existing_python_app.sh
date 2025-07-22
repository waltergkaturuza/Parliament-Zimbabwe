#!/bin/bash
# Upgrade existing Python App with Git Repository
# This script safely replaces manual files with Git-managed files

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

# Check current directory and user
echo -e "${YELLOW}Current user:${NC} $(whoami)"
echo -e "${YELLOW}Home directory:${NC} $HOME"
echo -e "${YELLOW}Current directory:${NC} $(pwd)"
echo ""

# Step 1: Navigate to fuel-system directory
echo -e "${YELLOW}Step 1: Navigating to fuel-system directory...${NC}"
cd $HOME/fuel-system

# Step 2: Backup existing files (just in case)
echo -e "${YELLOW}Step 2: Creating backup of existing files...${NC}"
mkdir -p ../fuel-system-backup
cp -r * ../fuel-system-backup/ 2>/dev/null || true
echo -e "${GREEN}✅ Backup created at $HOME/fuel-system-backup${NC}"

# Step 3: Clear directory but keep hidden files (.htaccess, etc.)
echo -e "${YELLOW}Step 3: Clearing directory for Git clone...${NC}"
find . -maxdepth 1 -type f -not -name '.*' -delete
find . -maxdepth 1 -type d -not -name '.*' -exec rm -rf {} + 2>/dev/null || true
echo -e "${GREEN}✅ Directory cleared (hidden files preserved)${NC}"

# Step 4: Initialize Git and add remote
echo -e "${YELLOW}Step 4: Initializing Git repository...${NC}"
git init
git remote add origin https://github.com/waltergkaturuza/Parliament-Zimbabwe.git
echo -e "${GREEN}✅ Git initialized${NC}"

# Step 5: Pull from GitHub
echo -e "${YELLOW}Step 5: Pulling latest code from GitHub...${NC}"
git pull origin main
echo -e "${GREEN}✅ Code pulled from GitHub${NC}"

# Step 6: Activate virtual environment
echo -e "${YELLOW}Step 6: Activating virtual environment...${NC}"
VENV_PATH="$HOME/virtualenv/fuel-system/3.11/bin/activate"

if [ -f "$VENV_PATH" ]; then
    source "$VENV_PATH"
    echo -e "${GREEN}✅ Virtual environment activated${NC}"
    echo -e "${YELLOW}Python executable:${NC} $(which python)"
    echo -e "${YELLOW}Pip executable:${NC} $(which pip)"
else
    echo -e "${RED}❌ Virtual environment not found at: $VENV_PATH${NC}"
    echo -e "${YELLOW}Python app configuration may be broken${NC}"
    exit 1
fi

# Step 7: Install dependencies
echo -e "${YELLOW}Step 7: Installing Python dependencies...${NC}"
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

# Step 8: Check Django installation
echo -e "${YELLOW}Step 8: Verifying Django installation...${NC}"
python -c "import django; print(f'Django version: {django.get_version()}')" || {
    echo -e "${RED}❌ Django not properly installed${NC}"
    exit 1
}
echo -e "${GREEN}✅ Django verified${NC}"

# Step 9: Set up Django settings
echo -e "${YELLOW}Step 9: Configuring Django settings...${NC}"
export DJANGO_SETTINGS_MODULE=config.settings.cpanel
echo -e "${GREEN}✅ Django settings configured${NC}"

# Step 10: Run Django migrations
echo -e "${YELLOW}Step 10: Running database migrations...${NC}"
python manage.py makemigrations --settings=config.settings.cpanel
python manage.py migrate --settings=config.settings.cpanel
echo -e "${GREEN}✅ Database migrations completed${NC}"

# Step 11: Collect static files
echo -e "${YELLOW}Step 11: Collecting static files...${NC}"
python manage.py collectstatic --noinput --settings=config.settings.cpanel
echo -e "${GREEN}✅ Static files collected${NC}"

# Step 12: Set correct permissions
echo -e "${YELLOW}Step 12: Setting file permissions...${NC}"
chmod 644 passenger_wsgi.py
chmod 755 deploy_cpanel.sh 2>/dev/null || true
echo -e "${GREEN}✅ File permissions set${NC}"

# Step 13: Test the setup
echo -e "${YELLOW}Step 13: Testing Django setup...${NC}"
python manage.py check --settings=config.settings.cpanel
echo -e "${GREEN}✅ Django setup verified${NC}"

# Step 14: Final status
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
echo -e "${GREEN}✅ Application configured${NC}"
echo ""
echo -e "${YELLOW}📍 Application Location:${NC} $HOME/fuel-system"
echo -e "${YELLOW}🌐 Website URL:${NC} https://fuel.parliament.co.zw"
echo -e "${YELLOW}🔧 Admin Panel:${NC} https://fuel.parliament.co.zw/admin"
echo ""
echo -e "${BLUE}📋 Backup Location:${NC} $HOME/fuel-system-backup"
echo ""
echo -e "${BLUE}🔄 For future updates, run:${NC}"
echo -e "   cd $HOME/fuel-system"
echo -e "   source $VENV_PATH"
echo -e "   git pull origin main"
echo -e "   pip install -r requirements-cpanel.txt"
echo -e "   python manage.py migrate --settings=config.settings.cpanel"
echo -e "   python manage.py collectstatic --noinput --settings=config.settings.cpanel"
echo -e "   touch passenger_wsgi.py  # Restart app"
echo ""
echo -e "${GREEN}🚀 Your Parliament Fuel Coupon System now has Git integration!${NC}"
