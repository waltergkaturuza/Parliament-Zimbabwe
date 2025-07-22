#!/bin/bash
# Complete cPanel Git Deployment Setup Script
# Run this in cPanel Terminal to set up the Parliament Fuel Coupon System

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================${NC}"
echo -e "${GREEN}  Parliament Fuel Coupon System - cPanel Setup${NC}"
echo -e "${BLUE}======================================================${NC}"
echo ""

# Check current directory and user
echo -e "${YELLOW}Current user:${NC} $(whoami)"
echo -e "${YELLOW}Home directory:${NC} $HOME"
echo -e "${YELLOW}Current directory:${NC} $(pwd)"
echo ""

# Step 1: Navigate to home directory
echo -e "${YELLOW}Step 1: Navigating to home directory...${NC}"
cd $HOME

# Step 2: Remove existing fuel-system directory if it exists
if [ -d "fuel-system" ]; then
    echo -e "${YELLOW}Removing existing fuel-system directory...${NC}"
    rm -rf fuel-system
fi

# Step 3: Clone the repository
echo -e "${YELLOW}Step 2: Cloning Parliament-Zimbabwe repository...${NC}"
git clone https://github.com/waltergkaturuza/Parliament-Zimbabwe.git fuel-system

# Check if clone was successful
if [ ! -d "fuel-system" ]; then
    echo -e "${RED}❌ Failed to clone repository${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Repository cloned successfully${NC}"

# Step 4: Navigate to project directory
echo -e "${YELLOW}Step 3: Navigating to project directory...${NC}"
cd fuel-system

# Step 5: Check Python version
echo -e "${YELLOW}Step 4: Checking Python environment...${NC}"
echo -e "${YELLOW}Python version:${NC} $(python3 --version 2>/dev/null || echo 'Python3 not found')"

# Step 6: Activate virtual environment
echo -e "${YELLOW}Step 5: Activating virtual environment...${NC}"
VENV_PATH="$HOME/virtualenv/fuel-system/3.11/bin/activate"

if [ -f "$VENV_PATH" ]; then
    source "$VENV_PATH"
    echo -e "${GREEN}✅ Virtual environment activated${NC}"
    echo -e "${YELLOW}Python executable:${NC} $(which python)"
    echo -e "${YELLOW}Pip executable:${NC} $(which pip)"
else
    echo -e "${RED}❌ Virtual environment not found at: $VENV_PATH${NC}"
    echo -e "${YELLOW}Please create the Python app in cPanel first${NC}"
    exit 1
fi

# Step 7: Install dependencies
echo -e "${YELLOW}Step 6: Installing Python dependencies...${NC}"
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
echo -e "${YELLOW}Step 7: Verifying Django installation...${NC}"
python -c "import django; print(f'Django version: {django.get_version()}')" || {
    echo -e "${RED}❌ Django not properly installed${NC}"
    exit 1
}
echo -e "${GREEN}✅ Django verified${NC}"

# Step 9: Set up Django settings
echo -e "${YELLOW}Step 8: Configuring Django settings...${NC}"
export DJANGO_SETTINGS_MODULE=config.settings.cpanel
echo -e "${GREEN}✅ Django settings configured${NC}"

# Step 10: Run Django migrations
echo -e "${YELLOW}Step 9: Running database migrations...${NC}"
python manage.py makemigrations --settings=config.settings.cpanel
python manage.py migrate --settings=config.settings.cpanel
echo -e "${GREEN}✅ Database migrations completed${NC}"

# Step 11: Collect static files
echo -e "${YELLOW}Step 10: Collecting static files...${NC}"
python manage.py collectstatic --noinput --settings=config.settings.cpanel
echo -e "${GREEN}✅ Static files collected${NC}"

# Step 12: Create superuser (optional)
echo -e "${YELLOW}Step 11: Creating superuser (you can skip this)...${NC}"
echo -e "${BLUE}Would you like to create a superuser account? (y/n)${NC}"
read -r create_superuser
if [[ $create_superuser =~ ^[Yy]$ ]]; then
    python manage.py createsuperuser --settings=config.settings.cpanel
    echo -e "${GREEN}✅ Superuser created${NC}"
else
    echo -e "${YELLOW}⚠️  Skipping superuser creation${NC}"
fi

# Step 13: Set correct permissions
echo -e "${YELLOW}Step 12: Setting file permissions...${NC}"
chmod 644 passenger_wsgi.py
chmod 755 deploy_cpanel.sh
echo -e "${GREEN}✅ File permissions set${NC}"

# Step 14: Test the setup
echo -e "${YELLOW}Step 13: Testing Django setup...${NC}"
python manage.py check --settings=config.settings.cpanel
echo -e "${GREEN}✅ Django setup verified${NC}"

# Step 15: Final status
echo ""
echo -e "${BLUE}======================================================${NC}"
echo -e "${GREEN}           🎉 DEPLOYMENT COMPLETE! 🎉${NC}"
echo -e "${BLUE}======================================================${NC}"
echo ""
echo -e "${GREEN}✅ Repository cloned from GitHub${NC}"
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo -e "${GREEN}✅ Database configured${NC}"
echo -e "${GREEN}✅ Static files ready${NC}"
echo -e "${GREEN}✅ Application configured${NC}"
echo ""
echo -e "${YELLOW}📍 Application Location:${NC} $HOME/fuel-system"
echo -e "${YELLOW}🌐 Website URL:${NC} https://fuel.parliament.co.zw"
echo -e "${YELLOW}🔧 Admin Panel:${NC} https://fuel.parliament.co.zw/admin"
echo ""
echo -e "${BLUE}📋 Important Files:${NC}"
echo -e "   • passenger_wsgi.py - WSGI entry point"
echo -e "   • config/settings/cpanel.py - Production settings"
echo -e "   • deploy_cpanel.sh - Future deployment script"
echo ""
echo -e "${BLUE}🔄 For future updates, run:${NC}"
echo -e "   cd $HOME/fuel-system"
echo -e "   git pull origin main"
echo -e "   source $VENV_PATH"
echo -e "   pip install -r requirements-cpanel.txt"
echo -e "   python manage.py migrate --settings=config.settings.cpanel"
echo -e "   python manage.py collectstatic --noinput --settings=config.settings.cpanel"
echo -e "   touch passenger_wsgi.py  # Restart app"
echo ""
echo -e "${GREEN}🚀 Your Parliament Fuel Coupon System is now deployed!${NC}"
