#!/bin/bash
# Azure CLI script to deploy and run Django migrations remotely
# Run this script to deploy your Django app and run migrations on Azure

echo "=== Azure Django Deployment and Migration Script ==="
echo ""

# Configuration
RESOURCE_GROUP="parliament-fuel-tg"
APP_NAME="parliament-fuel-system"
FULL_APP_NAME="parliament-fuel-system-d0bvbjfrdbepdrfh"

# Check if Azure CLI is logged in
echo "🔐 Checking Azure CLI authentication..."
az account show > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Not logged in to Azure CLI. Please run: az login"
    exit 1
fi

echo "✅ Azure CLI authenticated"
echo ""

# Step 1: Set environment variables for the Azure App Service
echo "🔧 Setting environment variables..."
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $FULL_APP_NAME \
  --settings \
    DATABASE_NAME="parliament-fuel-db" \
    DATABASE_USER="yalezopkar" \
    DATABASE_PASSWORD="MyNewSecurePass123" \
    DATABASE_HOST="parliament-fuel-postgres.postgres.database.azure.com" \
    DATABASE_PORT="5432" \
    DJANGO_DEBUG="False" \
    DJANGO_SECRET_KEY="your-production-secret-key-here" \
    FRONTEND_HOSTNAME="jolly-ocean-0e0dee90f.2.azurestaticapps.net"

if [ $? -eq 0 ]; then
    echo "✅ Environment variables set successfully"
else
    echo "❌ Failed to set environment variables"
    exit 1
fi

echo ""

# Step 2: Deploy the latest code (trigger redeployment)
echo "🚀 Triggering app redeployment..."
az webapp restart --resource-group $RESOURCE_GROUP --name $FULL_APP_NAME

echo "✅ App restart triggered"
echo ""

# Step 3: Wait for deployment to complete
echo "⏳ Waiting for deployment to complete (30 seconds)..."
sleep 30

# Step 4: Run Django migrations remotely
echo "🗄️ Running Django migrations remotely..."

# Create a temporary script to run migrations
MIGRATION_COMMAND="cd /home/site/wwwroot && python manage.py migrate --noinput"

# Execute migration command via Azure CLI
az webapp ssh --resource-group $RESOURCE_GROUP --name $FULL_APP_NAME --command "$MIGRATION_COMMAND"

if [ $? -eq 0 ]; then
    echo "✅ Migrations completed successfully"
else
    echo "❌ Migration failed. Check the logs for details."
fi

echo ""

# Step 5: Create superuser (optional)
echo "👤 Creating superuser (optional)..."
read -p "Do you want to create a superuser? (y/n): " create_superuser

if [ "$create_superuser" = "y" ] || [ "$create_superuser" = "Y" ]; then
    echo "Creating superuser..."
    SUPERUSER_COMMAND="cd /home/site/wwwroot && echo \"from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser('admin', 'admin@parliament.co.zw', 'admin123') if not User.objects.filter(username='admin').exists() else print('Superuser already exists')\" | python manage.py shell"
    
    az webapp ssh --resource-group $RESOURCE_GROUP --name $FULL_APP_NAME --command "$SUPERUSER_COMMAND"
fi

echo ""

# Step 6: Collect static files
echo "📁 Collecting static files..."
COLLECTSTATIC_COMMAND="cd /home/site/wwwroot && python manage.py collectstatic --noinput"

az webapp ssh --resource-group $RESOURCE_GROUP --name $FULL_APP_NAME --command "$COLLECTSTATIC_COMMAND"

echo ""

# Step 7: Check app status
echo "🔍 Checking app status..."
az webapp show --resource-group $RESOURCE_GROUP --name $FULL_APP_NAME --query state --output tsv

echo ""
echo "🎉 Deployment and migration process completed!"
echo ""
echo "🌐 Your app should be available at:"
echo "   https://$FULL_APP_NAME.azurewebsites.net"
echo ""
echo "📋 To check logs, run:"
echo "   az webapp log tail --resource-group $RESOURCE_GROUP --name $FULL_APP_NAME"
