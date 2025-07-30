#!/bin/bash
# Azure Remote Migration Script

echo "=== Azure Django Remote Migration ==="
echo ""

# App details
RESOURCE_GROUP="parliament-fuel-tg"
APP_NAME="parliament-fuel-system-d0bvbjfrdbepdrfh"

echo "🔍 Checking Azure CLI login status..."
if ! az account show > /dev/null 2>&1; then
    echo "❌ Not logged into Azure CLI. Please run: az login"
    exit 1
fi

echo "✅ Azure CLI is logged in"
echo ""

echo "🔧 Setting environment variables for Django app..."

# Set environment variables
az webapp config appsettings set \
    --resource-group "$RESOURCE_GROUP" \
    --name "$APP_NAME" \
    --settings \
    DATABASE_NAME="parliament-fuel-db" \
    DATABASE_USER="yalezopkar" \
    DATABASE_PASSWORD="MyNewSecurePass123" \
    DATABASE_HOST="parliament-fuel-postgres.postgres.database.azure.com" \
    DATABASE_PORT="5432" \
    DJANGO_SETTINGS_MODULE="config.settings" \
    DJANGO_DEBUG="False" \
    > /dev/null

echo "✅ Environment variables set"
echo ""

echo "🔄 Restarting the app to apply new settings..."
az webapp restart --resource-group "$RESOURCE_GROUP" --name "$APP_NAME"
echo "✅ App restarted"
echo ""

echo "⏳ Waiting 30 seconds for app to fully restart..."
sleep 30

echo "🔄 Running Django migrations remotely..."
echo ""

# Run migrations via SSH
echo "Executing: python manage.py migrate"
az webapp ssh --resource-group "$RESOURCE_GROUP" --name "$APP_NAME" << 'EOF'
cd /home/site/wwwroot
python manage.py migrate
echo "Migration completed!"
exit
EOF

echo ""
echo "✅ Remote migration completed!"
echo ""

echo "🔍 Checking app logs for any errors..."
az webapp log tail --resource-group "$RESOURCE_GROUP" --name "$APP_NAME" &
LOG_PID=$!

echo "Press Ctrl+C to stop log monitoring"
sleep 10
kill $LOG_PID 2>/dev/null

echo ""
echo "=== Next Steps ==="
echo "1. Check if migrations succeeded in the logs above"
echo "2. Test your app at: https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"
echo "3. Create superuser if needed: az webapp ssh --resource-group $RESOURCE_GROUP --name $APP_NAME"
echo "   Then run: python manage.py createsuperuser"
