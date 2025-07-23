# Production Deployment Guide: Frontend + Business Central + Backend

## 🚀 Complete Production Integration Setup

### Overview
This guide sets up the complete production environment with:
- **React Frontend** → Azure Static Web Apps
- **Django Backend** → Azure App Service (already deployed)
- **Business Central** → AL Extension with iframe integration
- **Database** → Azure PostgreSQL (already configured)

---

## 📋 Step 1: Deploy Frontend to Azure Static Web Apps

### 1.1 Create Azure Static Web App
```bash
# Login to Azure
az login

# Create Static Web App
az staticwebapp create \
    --name parliament-fuel-frontend \
    --resource-group parliament-fuel-rg \
    --source https://github.com/waltergkaturuza/Parliament-Zimbabwe \
    --location "East US 2" \
    --branch main \
    --app-location "fuel-coupon-frontend" \
    --output-location "dist" \
    --login-with-github
```

### 1.2 Configure Environment Variables
The GitHub Action will automatically use production environment variables from `.env.production`:
- `VITE_API_BASE_URL=https://parliament-fuel-system.azurewebsites.net`

### 1.3 Expected Frontend URL
- **Static Web App**: `https://parliament-fuel-frontend.azurestaticapps.net`

---

## 📋 Step 2: Update Backend for Production BC Integration

### 2.1 Apply Database Migration
```bash
# SSH into Azure App Service or use Azure CLI
az webapp ssh --resource-group parliament-fuel-rg --name parliament-fuel-system

# Run migration
python manage.py migrate
```

### 2.2 Update CORS Settings
The production settings already include:
```python
CORS_ALLOWED_ORIGINS = [
    "https://parliament-fuel-frontend.azurestaticapps.net",
    "https://fuel.parliament.gov.zw",
    "https://parliament.gov.zw",
]
```

### 2.3 Set Environment Variables
```bash
az webapp config appsettings set \
    --resource-group parliament-fuel-rg \
    --name parliament-fuel-system \
    --settings \
    BC_INTEGRATION_ENABLED=True \
    BC_WEBHOOK_SECRET=your-secure-webhook-secret-here \
    DJANGO_SETTINGS_MODULE=config.settings.production
```

---

## 📋 Step 3: Deploy Business Central AL Extension

### 3.1 Package AL Extension
1. Open VS Code with AL extension
2. Open the `bc_extension` folder
3. Press `Ctrl+Shift+P` → "AL: Package"
4. This creates `FuelSystemIntegration.app` file

### 3.2 Deploy to Business Central
1. **Business Central Admin Center**:
   - Go to your BC environment
   - Navigate to "Extension Management"
   - Upload `FuelSystemIntegration.app`

2. **VS Code AL Extension**:
   - Press `Ctrl+Shift+P` → "AL: Publish"
   - Enter your BC environment details

### 3.3 Configure BC Environment
Update the AL extension URLs to point to production:
- **Django Dashboard**: `https://parliament-fuel-system.azurewebsites.net/bc/dashboard/`
- **Webhook URL**: `https://parliament-fuel-system.azurewebsites.net/api/bc/webhook/`

---

## 📋 Step 4: Configure Production URLs and Domains

### 4.1 Current Production URLs
✅ **Backend API**: `https://parliament-fuel-system.azurewebsites.net`
✅ **Frontend**: `https://parliament-fuel-frontend.azurestaticapps.net`
✅ **BC Dashboard**: `https://parliament-fuel-system.azurewebsites.net/bc/dashboard/`

### 4.2 API Endpoints for BC Integration
- **Webhook**: `POST /api/bc/webhook/`
- **Dashboard Data**: `GET /api/bc/dashboard-data/`
- **Health Check**: `GET /api/bc/health/`
- **Transaction Approval**: `POST /api/bc/transaction/{id}/approve/`

### 4.3 Custom Domain Setup (Optional)
If you want to use `fuel.parliament.gov.zw`:

```bash
# For Static Web App
az staticwebapp hostname set \
    --name parliament-fuel-frontend \
    --resource-group parliament-fuel-rg \
    --hostname fuel.parliament.gov.zw

# For App Service  
az webapp config hostname add \
    --resource-group parliament-fuel-rg \
    --webapp-name parliament-fuel-system \
    --hostname api.fuel.parliament.gov.zw
```

---

## 📋 Step 5: Test Production Integration

### 5.1 Test Frontend
1. Visit: `https://parliament-fuel-frontend.azurestaticapps.net`
2. Verify homepage loads with live backend data
3. Check login/register functionality
4. Verify all navigation works

### 5.2 Test Backend APIs
```bash
# Test home API
curl https://parliament-fuel-system.azurewebsites.net/api/home/stats/

# Test BC webhook
curl -X POST https://parliament-fuel-system.azurewebsites.net/api/bc/webhook/ \
  -H "Content-Type: application/json" \
  -d '{"eventType": "sync_request", "entityData": {"sync_type": "incremental"}}'

# Test BC dashboard data
curl https://parliament-fuel-system.azurewebsites.net/api/bc/dashboard-data/
```

### 5.3 Test Business Central Integration
1. **Open BC Dashboard Page**:
   - In Business Central, search for "Fuel System Dashboard"
   - Open the page - should load Django iframe

2. **Test Data Sync**:
   - Create a test transaction in BC
   - Verify it appears in Django backend
   - Check webhook communication

3. **Test Status Updates**:
   - Approve/reject transaction in Django
   - Verify status updates in BC

---

## 📋 Step 6: Security and Performance

### 6.1 Security Checklist
- ✅ HTTPS enforced on all endpoints
- ✅ CORS properly configured
- ✅ CSRF protection enabled
- ✅ XSS protection headers
- ✅ Secure session cookies
- ✅ BC webhook authentication

### 6.2 Performance Optimization
- ✅ Static files served via CDN
- ✅ Database connection pooling
- ✅ Gzip compression enabled
- ✅ Browser caching headers
- ✅ API response caching

### 6.3 Monitoring Setup
```bash
# Enable Application Insights
az monitor app-insights component create \
    --app parliament-fuel-insights \
    --resource-group parliament-fuel-rg \
    --location "East US"

# Link to App Service
az webapp config appsettings set \
    --resource-group parliament-fuel-rg \
    --name parliament-fuel-system \
    --settings APPINSIGHTS_INSTRUMENTATIONKEY=your-insights-key
```

---

## 🎯 Final Production Architecture

```
User Browser
    ↓
Azure CDN + Static Web App (React Frontend)
    ↓ API Calls
Azure App Service (Django Backend)
    ↓ Database
Azure PostgreSQL
    ↑ ↓ Webhooks/API
Business Central Cloud
    ↓ Iframe Embed
Django BC Dashboard
```

### Production URLs Summary:
- **Main App**: `https://parliament-fuel-frontend.azurestaticapps.net`
- **API**: `https://parliament-fuel-system.azurewebsites.net/api/`
- **BC Dashboard**: `https://parliament-fuel-system.azurewebsites.net/bc/dashboard/`
- **Admin**: `https://parliament-fuel-system.azurewebsites.net/admin/`

---

## 🚀 Deployment Commands Summary

```bash
# 1. Deploy the latest changes
git add .
git commit -m "feat: Production BC integration ready"
git push origin main

# 2. Run database migration
az webapp ssh --resource-group parliament-fuel-rg --name parliament-fuel-system
python manage.py migrate

# 3. Create Static Web App (one-time)
az staticwebapp create \
    --name parliament-fuel-frontend \
    --resource-group parliament-fuel-rg \
    --source https://github.com/waltergkaturuza/Parliament-Zimbabwe \
    --location "East US 2" \
    --branch main \
    --app-location "fuel-coupon-frontend" \
    --output-location "dist"

# 4. Deploy BC AL Extension
# Use VS Code AL extension to package and deploy to BC environment
```

The production environment is now ready for full frontend + Business Central + backend integration!
