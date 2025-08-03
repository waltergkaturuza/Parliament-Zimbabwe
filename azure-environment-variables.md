# Azure App Service Environment Variables Configuration
# These variables should be set in the Azure portal under Configuration > Application settings

# Database Configuration
DATABASE_URL=postgresql://parliament_admin:your_password@parliament-fuel-db.postgres.database.azure.com:5432/fuel_coupon_db?sslmode=require

# Django Configuration
DJANGO_SECRET_KEY=your-secret-key-here-minimum-50-characters-long
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net,parliament-fuel-system.azurewebsites.net

# Azure Specific
WEBSITE_HOSTNAME=parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net
AZURE_HOSTNAME=parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net

# Frontend Configuration
FRONTEND_HOSTNAME=parliament-fuel-system.azurewebsites.net

# CORS Configuration
CORS_ALLOWED_ORIGINS=https://parliament-fuel-system.azurewebsites.net,https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net

# Security Settings
SECURE_SSL_REDIRECT=True
SECURE_PROXY_SSL_HEADER=HTTP_X_FORWARDED_PROTO,https
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True

# File Storage (if using Azure Blob Storage)
# AZURE_STORAGE_ACCOUNT_NAME=your_storage_account
# AZURE_STORAGE_ACCOUNT_KEY=your_storage_key
# AZURE_STORAGE_CONTAINER_NAME=media

# Email Configuration (if using Azure Communication Services)
# EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
# EMAIL_HOST=smtp.office365.com
# EMAIL_PORT=587
# EMAIL_USE_TLS=True
# EMAIL_HOST_USER=your_email@domain.com
# EMAIL_HOST_PASSWORD=your_password

# Application Insights (optional for monitoring)
# APPINSIGHTS_INSTRUMENTATIONKEY=your_application_insights_key

# Business Central Integration (if applicable)
# BC_BASE_URL=https://api.businesscentral.dynamics.com
# BC_TENANT_ID=your_tenant_id
# BC_CLIENT_ID=your_client_id
# BC_CLIENT_SECRET=your_client_secret
