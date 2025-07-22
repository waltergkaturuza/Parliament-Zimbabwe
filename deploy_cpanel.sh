#!/bin/bash
# cPanel Git Deployment Script for Parliament Fuel Coupon System
# This script handles deployment from GitHub to cPanel hosting

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Parliament Fuel Coupon System - cPanel Deployment ===${NC}"
echo "Repository: https://github.com/waltergkaturuza/Parliament-Zimbabwe.git"
echo "Target: fuel.parliament.co.zw"
echo ""

# Step 1: Navigate to application directory
echo -e "${YELLOW}Step 1: Navigating to application directory...${NC}"
cd /home/parliam1/fuel-system/

# Step 2: Activate virtual environment
echo -e "${YELLOW}Step 2: Activating Python virtual environment...${NC}"
source /home/parliam1/virtualenv/fuel-system/3.11/bin/activate

# Step 3: Pull latest changes from GitHub
echo -e "${YELLOW}Step 3: Pulling latest changes from GitHub...${NC}"
git pull origin main

# Step 4: Install/update dependencies
echo -e "${YELLOW}Step 4: Installing Python dependencies...${NC}"
pip install -r requirements-cpanel.txt

# Step 5: Run Django migrations
echo -e "${YELLOW}Step 5: Running database migrations...${NC}"
python manage.py makemigrations --settings=config.settings.cpanel
python manage.py migrate --settings=config.settings.cpanel

# Step 6: Collect static files
echo -e "${YELLOW}Step 6: Collecting static files...${NC}"
python manage.py collectstatic --noinput --settings=config.settings.cpanel

# Step 7: Restart application (if needed)
echo -e "${YELLOW}Step 7: Restarting application...${NC}"
# Most cPanel hosting auto-restarts, but you can add restart commands here if needed
touch passenger_wsgi.py  # This forces a restart in Passenger

echo ""
echo -e "${GREEN}=== Deployment Complete! ===${NC}"
echo -e "Visit: ${GREEN}https://fuel.parliament.co.zw${NC}"
echo -e "Admin: ${GREEN}https://fuel.parliament.co.zw/admin${NC}"
echo ""

# Step 8: Check application status
echo -e "${YELLOW}Checking application status...${NC}"
curl -I https://fuel.parliament.co.zw/ || echo -e "${RED}Application may need time to start${NC}"
