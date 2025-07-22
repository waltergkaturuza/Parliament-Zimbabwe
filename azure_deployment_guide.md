# 🏛️ PARLIAMENT FUEL COUPON SYSTEM
## ☁️ AZURE PRODUCTION DEPLOYMENT GUIDE
### Using Azure App Service + PostgreSQL + Business Central Integration

---

## 🎯 **AZURE DEPLOYMENT STRATEGY**

### **Architecture Overview**
```
Parliament Users → Azure Front Door → App Service → PostgreSQL → Business Central
                                  ↓
                            Azure Key Vault (Secrets)
                                  ↓
                            Application Insights (Monitoring)
```

---

## ☁️ **1. AZURE SERVICES REQUIRED**

### **Core Services**
- [ ] **Azure App Service** (Web App hosting)
- [ ] **Azure Database for PostgreSQL** (Managed database)
- [ ] **Azure Key Vault** (Secrets management)
- [ ] **Azure Application Insights** (Monitoring)
- [ ] **Azure Front Door** (CDN + SSL)

### **Optional Services**
- [ ] **Azure Active Directory** (SSO integration)
- [ ] **Azure Storage Account** (File uploads, backups)
- [ ] **Azure Monitor** (Advanced monitoring)
- [ ] **Azure DevOps** (CI/CD pipeline)

---

## 🔧 **2. AZURE RESOURCE CONFIGURATION**

### **Resource Group**
```
Name: rg-parliament-fuel-system-prod
Location: South Africa North (recommended for Zimbabwe)
Tags:
  Environment: Production
  Department: Parliament
  System: FuelCouponSystem
```

### **App Service Plan**
```
Name: asp-parliament-fuel-prod
SKU: P1V3 (Premium - required for SSL + scaling)
OS: Linux
Runtime: Python 3.11
Location: South Africa North
Auto-scaling: Enabled (2-10 instances)
```

### **App Service (Web App)**
```
Name: app-parliament-fuel-prod
Custom Domain: fuel.parliament.gov.zw
SSL: Managed Certificate (Free)
Always On: Enabled
HTTPS Only: Enabled
Minimum TLS: 1.2
```

### **PostgreSQL Database**
```
Name: psql-parliament-fuel-prod
Version: PostgreSQL 14
Compute: General Purpose, 2 vCores
Storage: 100 GB (auto-grow enabled)
Backup Retention: 35 days
High Availability: Zone Redundant (recommended)
Location: South Africa North
```

---

## 🔐 **3. AZURE KEY VAULT CONFIGURATION**

### **Secrets to Store**
```bash
# Database Connection
DB-HOST=psql-parliament-fuel-prod.postgres.database.azure.com
DB-NAME=fuel_coupon_system
DB-USER=parliament_admin
DB-PASSWORD=[Generated Strong Password]

# Business Central (Already Have These)
BC-CLIENT-ID=[Your existing BC Client ID]
BC-CLIENT-SECRET=[Your existing BC Client Secret]
BC-TENANT-ID=[Your existing BC Tenant ID]
BC-ENVIRONMENT=[Production BC Environment]

# Django Settings
DJANGO-SECRET-KEY=[Generated 50-character key]
DJANGO-DEBUG=False
ALLOWED-HOSTS=fuel.parliament.gov.zw,app-parliament-fuel-prod.azurewebsites.net

# Email Configuration
SMTP-HOST=smtp.office365.com
SMTP-USER=fuel-system@parliament.gov.zw
SMTP-PASSWORD=[Email password]
```

---

## 🚀 **4. DEPLOYMENT STEPS**

### **Phase 1: Infrastructure Setup (Week 1)**

#### **Step 1: Create Resource Group**
```bash
az group create \
  --name rg-parliament-fuel-system-prod \
  --location "South Africa North" \
  --tags Environment=Production Department=Parliament
```

#### **Step 2: Create PostgreSQL Database**
```bash
az postgres flexible-server create \
  --resource-group rg-parliament-fuel-system-prod \
  --name psql-parliament-fuel-prod \
  --admin-user parliament_admin \
  --admin-password [SECURE_PASSWORD] \
  --sku-name Standard_B2s \
  --tier Burstable \
  --storage-size 128 \
  --version 14 \
  --location "South Africa North"
```

#### **Step 3: Create App Service**
```bash
az appservice plan create \
  --name asp-parliament-fuel-prod \
  --resource-group rg-parliament-fuel-system-prod \
  --sku P1V3 \
  --is-linux

az webapp create \
  --resource-group rg-parliament-fuel-system-prod \
  --plan asp-parliament-fuel-prod \
  --name app-parliament-fuel-prod \
  --runtime "PYTHON|3.11"
```

#### **Step 4: Create Key Vault**
```bash
az keyvault create \
  --name kv-parliament-fuel-prod \
  --resource-group rg-parliament-fuel-system-prod \
  --location "South Africa North" \
  --enable-soft-delete \
  --enable-purge-protection
```

### **Phase 2: Application Deployment (Week 2)**

#### **Step 5: Configure Database**
```sql
-- Create production database
CREATE DATABASE fuel_coupon_system;
CREATE USER parliament_app WITH PASSWORD '[APP_PASSWORD]';
GRANT ALL PRIVILEGES ON DATABASE fuel_coupon_system TO parliament_app;
```

#### **Step 6: Deploy Application**
```bash
# Configure App Service settings
az webapp config appsettings set \
  --resource-group rg-parliament-fuel-system-prod \
  --name app-parliament-fuel-prod \
  --settings \
    DJANGO_SETTINGS_MODULE=config.settings.production \
    WEBSITE_HTTPLOGGING_RETENTION_DAYS=7 \
    SCM_DO_BUILD_DURING_DEPLOYMENT=true

# Deploy from GitHub
az webapp deployment source config \
  --resource-group rg-parliament-fuel-system-prod \
  --name app-parliament-fuel-prod \
  --repo-url https://github.com/waltergkaturuza/Parliament-Zimbabwe \
  --branch main \
  --manual-integration
```

---

## 🔒 **5. SECURITY CONFIGURATION**

### **Network Security**
```bash
# Configure firewall for PostgreSQL
az postgres flexible-server firewall-rule create \
  --resource-group rg-parliament-fuel-system-prod \
  --name psql-parliament-fuel-prod \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Configure Web App IP restrictions (optional)
az webapp config access-restriction add \
  --resource-group rg-parliament-fuel-system-prod \
  --name app-parliament-fuel-prod \
  --rule-name "Parliament Office" \
  --action Allow \
  --ip-address "PARLIAMENT_PUBLIC_IP/32" \
  --priority 100
```

### **SSL Certificate**
```bash
# Add custom domain
az webapp config hostname add \
  --webapp-name app-parliament-fuel-prod \
  --resource-group rg-parliament-fuel-system-prod \
  --hostname fuel.parliament.gov.zw

# Enable SSL
az webapp config ssl bind \
  --name app-parliament-fuel-prod \
  --resource-group rg-parliament-fuel-system-prod \
  --certificate-thumbprint [CERT_THUMBPRINT] \
  --ssl-type SNI
```

---

## 💰 **6. COST ESTIMATION**

### **Monthly Azure Costs (USD)**
```
App Service (P1V3):           ~$146/month
PostgreSQL (Standard_B2s):    ~$58/month
Key Vault:                    ~$3/month
Application Insights:         ~$5/month
Storage Account:              ~$2/month
Front Door (if needed):       ~$22/month
--------------------------------
Total Estimated:              ~$236/month
```

### **Cost Optimization**
- [ ] **Dev/Test pricing** (if eligible for government discount)
- [ ] **Reserved instances** (1-3 year commitments for 30-60% savings)
- [ ] **Auto-scaling** (scale down during off-hours)
- [ ] **Monitoring** (set up cost alerts)

---

## 📊 **7. MONITORING SETUP**

### **Application Insights Configuration**
```python
# In settings/production.py
INSTALLED_APPS += ['applicationinsights.django']

APPLICATION_INSIGHTS = {
    'ikey': os.environ.get('APPINSIGHTS_INSTRUMENTATIONKEY'),
}

MIDDLEWARE = [
    'applicationinsights.django.ApplicationInsightsMiddleware',
] + MIDDLEWARE
```

### **Health Checks**
```python
# Create health check endpoint
# /health/ - Database connectivity
# /health/bc/ - Business Central API connectivity
# /health/full/ - Complete system check
```

---

## 🔄 **8. CI/CD PIPELINE (Optional)**

### **GitHub Actions Workflow**
```yaml
name: Deploy to Azure
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - uses: azure/webapps-deploy@v2
      with:
        app-name: app-parliament-fuel-prod
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
```

---

## 📋 **9. PRE-DEPLOYMENT CHECKLIST**

### **Azure Account Requirements**
- [ ] **Azure Subscription** (Parliament/Government account)
- [ ] **Subscription Owner/Contributor access**
- [ ] **Budget approval** (~$300/month)
- [ ] **Compliance approval** (if required)

### **Domain and DNS**
- [ ] **Domain ownership**: fuel.parliament.gov.zw
- [ ] **DNS management access**
- [ ] **SSL certificate approach**: Azure Managed Certificate (recommended)

### **Business Central Integration**
- [ ] **Production BC environment URL**
- [ ] **Production API credentials** (Client ID, Secret, Tenant)
- [ ] **Company database name** in production BC

### **Database Migration**
- [ ] **Data export** from development
- [ ] **Data validation** scripts
- [ ] **Migration testing** plan

---

## 🎯 **10. DEPLOYMENT TIMELINE**

### **Week 1: Infrastructure**
- [ ] **Day 1-2**: Azure resource creation
- [ ] **Day 3-4**: Database setup and configuration
- [ ] **Day 5**: Security and networking configuration

### **Week 2: Application**
- [ ] **Day 1-2**: Application deployment and configuration
- [ ] **Day 3-4**: Data migration and testing
- [ ] **Day 5**: Performance testing and optimization

### **Week 3: Production**
- [ ] **Day 1-2**: SSL and domain configuration
- [ ] **Day 3-4**: User acceptance testing
- [ ] **Day 5**: Go-live preparation

### **Week 4: Support**
- [ ] **Day 1**: Production launch
- [ ] **Day 2-5**: Monitoring and support

---

## 🚀 **NEXT IMMEDIATE STEPS**

### **What You Need to Provide:**
1. **Azure Subscription details** (or create new one)
2. **Domain confirmation**: fuel.parliament.gov.zw
3. **Production Business Central environment details**
4. **Budget approval** for ~$300/month Azure costs

### **What I'll Prepare:**
1. **Azure deployment scripts**
2. **Production Django settings**
3. **Database migration scripts**
4. **Monitoring and health checks**

**Ready to start with Azure resource creation?** 🎯
