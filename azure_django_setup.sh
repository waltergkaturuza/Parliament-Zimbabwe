#!/bin/bash
# Azure Django Management Script

echo "==========================================="
echo "  AZURE DJANGO MANAGEMENT VIA CLI"
echo "==========================================="

# Step 1: Run migrations
echo "Step 1: Running Django migrations..."
az webapp config appsettings set \
  --name parliament-fuel-system \
  --resource-group parliament-fuel-rg \
  --settings "WEBSITE_RUN_FROM_PACKAGE=0"

# Step 2: Set startup command to run migrations
echo "Step 2: Setting startup command..."
az webapp config set \
  --name parliament-fuel-system \
  --resource-group parliament-fuel-rg \
  --startup-file "python manage.py migrate && python manage.py collectstatic --noinput && gunicorn config.wsgi:application"

# Step 3: Restart the app
echo "Step 3: Restarting app service..."
az webapp restart \
  --name parliament-fuel-system \
  --resource-group parliament-fuel-rg

echo "Migration setup complete. Check Azure portal for logs."

# Step 4: Create superuser via Azure CLI extension
echo "Step 4: Creating superuser..."
echo "This requires manual intervention on Azure..."
