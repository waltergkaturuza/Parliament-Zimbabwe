#!/bin/bash
# Azure Deployment & Fix Script
# This script deploys the enhanced backend and fixes database issues

echo "🚀 AZURE DEPLOYMENT & 500 ERROR FIX"
echo "=================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "manage.py" ]; then
    print_error "manage.py not found. Please run this script from the Django project root."
    exit 1
fi

print_status "Starting Azure deployment and fix process..."

# 1. Install any missing dependencies
print_status "Installing dependencies..."
pip install -r requirements.txt
if [ $? -eq 0 ]; then
    print_success "Dependencies installed successfully"
else
    print_warning "Some dependencies may have failed to install"
fi

# 2. Collect static files
print_status "Collecting static files..."
python manage.py collectstatic --noinput
if [ $? -eq 0 ]; then
    print_success "Static files collected"
else
    print_error "Failed to collect static files"
fi

# 3. Run the migration fix
print_status "Running migration fix for Azure..."
python azure_migration_fix.py
if [ $? -eq 0 ]; then
    print_success "Migration fix completed"
else
    print_error "Migration fix failed"
fi

# 4. Apply any remaining migrations
print_status "Applying migrations..."
python manage.py makemigrations
python manage.py migrate
if [ $? -eq 0 ]; then
    print_success "Migrations applied successfully"
else
    print_error "Migration failed"
fi

# 5. Create superuser if needed (optional)
print_status "Checking for admin user..."
python -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(is_superuser=True).exists():
    print('No superuser found. You may want to create one manually.')
else:
    print('Superuser exists.')
"

# 6. Run diagnostic script
print_status "Running Azure diagnostics..."
python azure_500_error_diagnostic.py
if [ $? -eq 0 ]; then
    print_success "Diagnostics completed"
else
    print_warning "Diagnostics had issues"
fi

# 7. Test key endpoints
print_status "Testing critical endpoints..."

# Function to test endpoint
test_endpoint() {
    local endpoint=$1
    local name=$2
    
    print_status "Testing $name endpoint..."
    
    # Get the app URL from environment or use localhost
    APP_URL=${WEBSITE_HOSTNAME:-"localhost:8000"}
    
    if [[ $APP_URL != *"http"* ]]; then
        APP_URL="https://$APP_URL"
    fi
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL$endpoint" || echo "000")
    
    if [ "$response" = "200" ]; then
        print_success "$name endpoint working (200)"
    elif [ "$response" = "401" ] || [ "$response" = "403" ]; then
        print_warning "$name endpoint requires authentication ($response)"
    elif [ "$response" = "000" ]; then
        print_error "$name endpoint unreachable"
    else
        print_error "$name endpoint failed ($response)"
    fi
}

# Test endpoints
test_endpoint "/api/v1/analytics/received-breakdown/" "Analytics Received Breakdown"
test_endpoint "/api/v1/analytics/available-by-center/" "Analytics Available by Center"
test_endpoint "/api/v1/boxes/" "Boxes API"
test_endpoint "/api/v1/health/" "Health Check"

# 8. Show environment status
print_status "Environment Information:"
echo "  DATABASE_URL: ${DATABASE_URL:0:30}..." 
echo "  DEBUG: ${DEBUG:-Not set}"
echo "  ALLOWED_HOSTS: ${ALLOWED_HOSTS:-Not set}"
echo "  WEBSITE_HOSTNAME: ${WEBSITE_HOSTNAME:-Not set}"

# 9. Final recommendations
echo ""
print_status "DEPLOYMENT COMPLETE!"
echo ""
print_status "If you're still seeing 500 errors:"
echo "  1. Check the application logs in Azure Portal"
echo "  2. Verify environment variables are set correctly"
echo "  3. Ensure DATABASE_URL points to your PostgreSQL database"
echo "  4. Check that all migrations have been applied"
echo ""
print_status "To monitor ongoing issues:"
echo "  - Run: python azure_500_error_diagnostic.py"
echo "  - Check logs: az webapp log tail --name YOUR_APP_NAME --resource-group YOUR_RG"
echo ""

# 10. Optional: Restart the web app if on Azure
if [ ! -z "$WEBSITE_HOSTNAME" ]; then
    print_status "Detected Azure environment. Consider restarting the web app:"
    echo "  az webapp restart --name YOUR_APP_NAME --resource-group YOUR_RG"
fi

print_success "Deployment script completed!"
