# Production Deployment Script for Azure
# This script deploys the Parliament Fuel System to Azure with full BC integration

# Azure CLI Commands for Production Deployment

# 1. Login to Azure
az login

# 2. Set subscription (replace with your subscription ID)
az account set --subscription "your-subscription-id"

# 3. Create resource group (if not exists)
az group create --name parliament-fuel-rg --location "East US"

# 4. Deploy Django Backend (already exists, but update)
echo "Updating Django backend configuration..."

# 5. Create Static Web App for React Frontend
az staticwebapp create \
    --name parliament-fuel-frontend \
    --resource-group parliament-fuel-rg \
    --source https://github.com/waltergkaturuza/Parliament-Zimbabwe \
    --location "East US 2" \
    --branch main \
    --app-location "fuel-coupon-frontend" \
    --output-location "dist" \
    --login-with-github

# 6. Configure Custom Domain (optional)
# az staticwebapp hostname set \
#     --name parliament-fuel-frontend \
#     --resource-group parliament-fuel-rg \
#     --hostname fuel.parliament.gov.zw

# 7. Set environment variables for backend
az webapp config appsettings set \
    --resource-group parliament-fuel-rg \
    --name parliament-fuel-system \
    --settings \
    DJANGO_SETTINGS_MODULE=config.settings \
    DJANGO_DEBUG=False \
    DJANGO_ALLOWED_HOSTS=parliament-fuel-system.azurewebsites.net,fuel.parliament.gov.zw \
    CORS_ALLOWED_ORIGINS=https://parliament-fuel-frontend.azurestaticapps.net,https://fuel.parliament.gov.zw \
    BC_INTEGRATION_ENABLED=True \
    BC_WEBHOOK_SECRET=your-webhook-secret

# 8. Enable HTTPS redirect
az webapp config set \
    --resource-group parliament-fuel-rg \
    --name parliament-fuel-system \
    --https-only true

# 9. Scale the app service
az appservice plan update \
    --resource-group parliament-fuel-rg \
    --name parliament-fuel-system-plan \
    --sku P1V2

echo "Production deployment completed!"
echo ""
echo "URLs:"
echo "Backend:  https://parliament-fuel-system.azurewebsites.net"
echo "Frontend: https://parliament-fuel-frontend.azurestaticapps.net"
echo "BC Dashboard: https://parliament-fuel-system.azurewebsites.net/bc/dashboard/"
echo ""
echo "Next steps:"
echo "1. Configure custom domain names"
echo "2. Set up SSL certificates"  
echo "3. Deploy Business Central AL extension"
echo "4. Configure BC environment URLs"
echo "5. Test end-to-end integration"
