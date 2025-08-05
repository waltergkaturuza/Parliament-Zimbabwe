# Azure App Service Environment Variables Configuration
# Copy these settings to your Azure App Service -> Configuration -> Application Settings

## Django Configuration
DJANGO_SETTINGS_MODULE=config.settings.production
DJANGO_SECRET_KEY=your-very-long-secret-key-here-change-this-in-production
DJANGO_DEBUG=False
WEBSITES_ENABLE_APP_SERVICE_STORAGE=true

## Database Configuration (Azure PostgreSQL)
DATABASE_NAME=parliament-fuel-db
DATABASE_USER=yalezopkar@parliament-fuel-postgres
DATABASE_PASSWORD=MyNewSecurePass123
DATABASE_HOST=parliament-fuel-postgres.postgres.database.azure.com
DATABASE_PORT=5432

## CORS and Security Configuration
DJANGO_ALLOWED_HOSTS=parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net,parliament-fuel-system.azurewebsites.net
FRONTEND_HOSTNAME=jolly-ocean-0e0dee90f.2.azurestaticapps.net
AZURE_HOSTNAME=parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net

## Business Central Configuration (if needed)
BC_TENANT_ID=your-bc-tenant-id
BC_CLIENT_ID=your-bc-client-id
BC_CLIENT_SECRET=your-bc-client-secret
BC_ENVIRONMENT=Production
BC_COMPANY_ID=your-bc-company-id
BC_BASE_URL=your-bc-base-url

## Azure Storage (optional)
# AZURE_STORAGE_ACCOUNT_NAME=your-storage-account
# AZURE_STORAGE_ACCOUNT_KEY=your-storage-key
# AZURE_STORAGE_CONTAINER=static

## Email Configuration (optional)
# SMTP_HOST=smtp.office365.com
# SMTP_PORT=587
# SMTP_USER=your-email@parliament.gov.zw
# SMTP_PASSWORD=your-email-password

## Application Insights (optional)
APPINSIGHTS_INSTRUMENTATIONKEY=8653e7a8-b8cc-497b-8ad8-ec60ed4bd8ef
APPINSIGHTS_CONNECTION_STRING=InstrumentationKey=8653e7a8-b8cc-497b-8ad8-ec60ed4bd8ef;IngestionEndpoint=https://southafricanorth-1.in.applicationinsights.azure.com/;LiveEndpoint=https://southafricanorth.livediagnostics.monitor.azure.com/;ApplicationId=b2c382b6-39f8-4d2d-a1da-66534477ad50

## Debug Settings (temporary)
DEBUG_PRODUCTION_ISSUES=True
