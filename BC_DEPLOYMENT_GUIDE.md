# Parliament Fuel System - Business Central Deployment Guide

## 📦 AL Extension Package Compilation

### Prerequisites
1. VS Code with AL Language extension installed
2. Business Central development environment
3. Appropriate permissions to deploy extensions

### Step 1: Compile the Extension

```powershell
# Navigate to the BC extension folder
cd c:\Users\Administrator\Documents\POZ\fuel_coupon_system\bc_extension

# Open in VS Code
code .
```

### Step 2: AL Extension Compilation Process

1. **Open VS Code** in the `bc_extension` folder
2. **Press Ctrl+Shift+P** to open command palette
3. **Run Command**: `AL: Package`
4. **Select Target**: Choose your Business Central environment
5. **Wait for Compilation**: The .app file will be generated

### Step 3: Deploy to Business Central

```powershell
# Using BC Management Shell (Run as Administrator)

# Import the extension module
Import-Module "C:\Program Files\Microsoft Dynamics 365 Business Central\*\Service\NavAdminTool.ps1"

# Set variables
$ServerInstance = "BC"  # Your BC server instance name
$AppPath = ".\Parliament Fuel Coupon System_1.0.0.0.app"

# Install the extension
Install-NAVApp -ServerInstance $ServerInstance -Path $AppPath -Force

# Publish the extension
Publish-NAVApp -ServerInstance $ServerInstance -Path $AppPath -SkipVerification

# Sync the extension with the database
Sync-NAVApp -ServerInstance $ServerInstance -Name "Parliament Fuel Coupon System" -Version "1.0.0.0"

# Start the extension
Start-NAVApp -ServerInstance $ServerInstance -Name "Parliament Fuel Coupon System" -Version "1.0.0.0"
```

### Step 4: Verify Installation

```powershell
# Check extension status
Get-NAVAppInfo -ServerInstance $ServerInstance -Name "Parliament Fuel Coupon System"

# Should show: State = Installed, Publisher = Parliament IT Department
```

## ⚙️ Configuration Setup

### 1. Access Setup Page
1. Open Business Central
2. Use **Search (Alt+Q)**: Type "Parliament Fuel System Setup"
3. Open the setup page

### 2. Configure Integration Settings

```
Django Base URL: https://parliament-fuel-system.azurewebsites.net/
Webhook Secret: webhook-secret-123
Integration Enabled: ✓ Yes
```

### 3. Configure Posting Setup

```
Transaction Nos.: Create new number series (e.g., FUEL-001)
Journal Template: GENERAL
Journal Batch: FUEL
Fuel Expense Account: (Your fuel expense G/L account)
Fuel Payable Account: (Your payable G/L account)
Fuel Rate per Liter: (Current fuel rate)
```

### 4. Test Connection
1. Click **"Test Connection"** action
2. Verify successful connection to Django backend
3. Check sync status updates

## �️ PostgreSQL Database Configuration

### Database Details
The Azure PostgreSQL Flexible Server has been created with the following configuration:

```
Server Name: parliament-fuel-postgres
Database Name: parliament-fuel-db
Username: yekrzopkqr
Password: Un0vT5psBUBTSQdA
Host: parliament-fuel-postgres.postgres.database.azure.com
Port: 5432
SSL Mode: Required
```

### Connection String
```
DATABASE_URL=postgresql://yekrzopkqr:Un0vT5psBUBTSQdA@parliament-fuel-postgres.postgres.database.azure.com:5432/parliament-fuel-db?sslmode=require
```

### Azure App Service Configuration
The following environment variables have been set in Azure App Service:
- `DATABASE_URL`: Full PostgreSQL connection string
- `DATABASE_NAME`: parliament-fuel-db
- `DATABASE_USER`: yekrzopkqr
- `DATABASE_PASSWORD`: Un0vT5psBUBTSQdA
- `DATABASE_HOST`: parliament-fuel-postgres.postgres.database.azure.com
- `DATABASE_PORT`: 5432

### Migration Status
- ✅ PostgreSQL server created and running
- ✅ Database connection configured in Django settings
- ✅ Required dependencies added (psycopg2-binary, dj-database-url)
- 🔄 Django deployment in progress with PostgreSQL
- ⏳ Database migrations pending (will run automatically on deployment)

## 🔧 Database Migration for Azure Backend

The database migration will run automatically when the Azure deployment completes. The following commands will be executed:

```bash
# These run automatically during Azure deployment
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser --noinput --username admin --email admin@parliament.gov.zw
```

If manual migration is needed, you can run:
```bash
# Connect to Azure App Service console and run:
python manage.py migrate --run-syncdb
python manage.py loaddata initial_data.json  # If you have initial data
```

## 🧪 Integration Testing Checklist

### Frontend Testing
- [ ] Dashboard loads successfully
- [ ] User authentication works
- [ ] Fuel transaction forms function
- [ ] API calls to backend succeed
- [ ] Real-time updates display correctly

### Backend API Testing
- [ ] Health check endpoint responds: `/api/bc/health/`
- [ ] Webhook endpoint accepts data: `/api/bc/webhook/`
- [ ] Dashboard data endpoint works: `/api/bc/dashboard-data/`
- [ ] Authentication endpoints function
- [ ] CORS settings allow frontend access

### Business Central Integration
- [ ] Setup page opens and saves configuration
- [ ] Dashboard page loads Django app iframe
- [ ] Test connection succeeds
- [ ] Webhook communication works
- [ ] Transaction sync functions
- [ ] G/L posting completes successfully

### End-to-End Workflow
- [ ] Create transaction in Django frontend
- [ ] Verify transaction appears in BC
- [ ] Approve transaction in BC
- [ ] Confirm G/L entries are posted
- [ ] Check sync status in both systems

## 🚀 Go-Live Checklist

### Pre-Production
- [ ] All testing completed successfully
- [ ] User training conducted
- [ ] Backup procedures established
- [ ] Support documentation provided
- [ ] Performance monitoring configured

### Production Deployment
- [ ] Schedule deployment window
- [ ] Deploy BC extension to production
- [ ] Configure production settings
- [ ] Validate all integrations
- [ ] Monitor system performance

### Post-Deployment
- [ ] User acceptance testing
- [ ] Performance monitoring
- [ ] Issue tracking setup
- [ ] Regular backup verification
- [ ] Support team training

## 📊 Monitoring & Maintenance

### Azure Monitoring
- Application Insights for backend performance
- Static Web App analytics for frontend usage
- GitHub Actions for deployment monitoring

### Business Central Monitoring
- Extension health checks
- Integration status monitoring
- Transaction processing logs

### Regular Maintenance
- Weekly: Check sync status and error logs
- Monthly: Review performance metrics
- Quarterly: Update extension if needed
- Annually: Security and compliance review

## 🔒 Security Considerations

### Production Security
- [ ] HTTPS enforced on all endpoints
- [ ] Webhook secrets properly configured
- [ ] User permissions correctly assigned
- [ ] Database access secured
- [ ] Regular security updates applied

### Access Control
- [ ] BC user roles configured
- [ ] Django user permissions set
- [ ] API rate limiting enabled
- [ ] Audit logging activated

## 📞 Support Information

### Technical Contacts
- **Extension Support**: Parliament IT Department
- **Azure Support**: Use Azure support portal
- **BC Support**: Microsoft Dynamics 365 support

### Documentation
- **User Manual**: Available in Django admin interface
- **Technical Documentation**: This repository
- **API Documentation**: `/api/docs/` endpoint

### Emergency Procedures
1. **System Down**: Check Azure service health
2. **Integration Issues**: Verify webhook connectivity
3. **Data Sync Problems**: Check BC integration logs
4. **Performance Issues**: Monitor Azure Application Insights

---

## 🎯 Success Metrics

The deployment will be considered successful when:

1. ✅ Frontend accessible at https://jolly-ocean-0e0dee90f.2.azurestaticapps.net
2. ✅ Backend API responding at https://parliament-fuel-system.azurewebsites.net
3. ⏳ BC extension installed and configured
4. ⏳ End-to-end transaction workflow tested
5. ⏳ All integrations functioning correctly
6. ⏳ Users trained and system in production use

**Current Status**: 2/6 completed ✅ | Next: BC Extension Deployment 🔄
