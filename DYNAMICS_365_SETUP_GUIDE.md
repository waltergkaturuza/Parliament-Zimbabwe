# Microsoft Dynamics 365 Business Central Integration Setup Guide
## Parliament of Zimbabwe Fuel Coupon Management System

### Prerequisites

Before starting the integration setup, ensure you have:

1. **Microsoft Dynamics 365 Business Central Essentials Subscription**
   - Active subscription with administrative access
   - Environment set up (Sandbox for testing, Production for live use)

2. **Azure Active Directory Access**
   - Global Administrator or Application Administrator role
   - Ability to create app registrations

3. **System Requirements**
   - Django 5.2+ fuel coupon system running
   - Python 3.11+ environment
   - Network access to Microsoft APIs

## Phase 1: Azure AD App Registration

### Step 1: Create App Registration

1. **Navigate to Azure Portal**
   ```
   https://portal.azure.com → Azure Active Directory → App registrations
   ```

2. **Create New Registration**
   - Click "New registration"
   - Name: `Parliament-Fuel-Coupon-BC-Integration`
   - Supported account types: "Accounts in this organizational directory only"
   - Redirect URI: Not required for service-to-service authentication
   - Click "Register"

3. **Note Important IDs**
   ```
   Application (client) ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   Directory (tenant) ID: yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy
   ```

### Step 2: Create Client Secret

1. **Generate Client Secret**
   - Go to "Certificates & secrets"
   - Click "New client secret"
   - Description: `Fuel Coupon System Integration Secret`
   - Expires: Choose appropriate duration (recommended: 12-24 months)
   - Click "Add"

2. **Secure the Secret**
   ```
   Client Secret Value: zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz
   ```
   ⚠️ **IMPORTANT**: Copy this value immediately - it won't be shown again!

### Step 3: Configure API Permissions

1. **Add Business Central Permissions**
   - Go to "API permissions"
   - Click "Add a permission"
   - Select "Dynamics 365 Business Central"
   - Choose "Application permissions"
   - Select required permissions:
     - `API.ReadWrite.All` (for full API access)
     - `Financials.ReadWrite.All` (for financial data)

2. **Grant Admin Consent**
   - Click "Grant admin consent for [Your Organization]"
   - Confirm the consent

## Phase 2: Business Central Configuration

### Step 1: Enable API Services

1. **Access Business Central Admin Center**
   ```
   https://businesscentral.dynamics.com/[tenant-id]/admin
   ```

2. **Configure Environment**
   - Select your environment (Sandbox/Production)
   - Go to "Settings" → "Web Services"
   - Ensure API services are enabled

### Step 2: Set Up Web Services

1. **Navigate to Web Services**
   ```
   Business Central → Administration → Web Services
   ```

2. **Publish Required Services**
   Create web services for these pages:
   
   | Object Type | Object ID | Service Name | Description |
   |-------------|-----------|--------------|-------------|
   | Page | 21 | Customers | Customer management |
   | Page | 27 | Items | Item/inventory management |
   | Page | 30 | Vendors | Vendor management |
   | Page | 5200 | Employees | Employee management |
   | Page | 5600 | Fixed Assets | Vehicle asset management |
   | Page | 81 | General Journal | Financial entries |

3. **Verify Service URLs**
   Each service should have URLs like:
   ```
   https://api.businesscentral.dynamics.com/v2.0/[tenant]/[environment]/ODataV4/Company('[company-id]')/[ServiceName]
   ```

### Step 3: Configure User Permissions

1. **Create Integration User** (if using named user authentication)
   - User ID: `FUEL_INTEGRATION`
   - Permission Sets: `D365 API`, `GENERAL LEDGER`, `INVENTORY`

2. **Or Configure Service Principal** (recommended)
   - Link the Azure AD app to Business Central
   - Assign appropriate permission sets

## Phase 3: Django Application Setup

### Step 1: Install Required Packages

```powershell
# Install additional required packages
pip install requests python-decouple
```

### Step 2: Environment Configuration

1. **Copy Environment Template**
   ```powershell
   Copy-Item .env.dynamics.template .env.dynamics
   ```

2. **Configure Environment Variables**
   Edit `.env.dynamics` with your actual values:
   ```env
   DYNAMICS_TENANT_ID=your-actual-tenant-id
   DYNAMICS_CLIENT_ID=your-actual-client-id
   DYNAMICS_CLIENT_SECRET=your-actual-client-secret
   DYNAMICS_BC_URL=https://api.businesscentral.dynamics.com/v2.0/your-tenant-id/your-environment/ODataV4/
   DYNAMICS_ENVIRONMENT_NAME=sandbox  # or production
   DYNAMICS_COMPANY_ID=your-company-id
   ```

3. **Load Environment in Django**
   Add to your main `.env` file or settings:
   ```env
   # Load from .env.dynamics
   source .env.dynamics
   ```

### Step 3: Configure Initial Business Central Settings

1. **Create Business Central Configuration**
   ```powershell
   cd "c:\Users\Administrator\Documents\POZ\fuel_coupon_system"
   python manage.py shell
   ```

   ```python
   from dynamics_integration.models import BusinessCentralConfig
   
   config = BusinessCentralConfig.objects.create(
       name='default',
       description='Parliament of Zimbabwe BC Integration',
       tenant_id='your-tenant-id',
       environment_name='sandbox',  # or 'production'
       environment_type='SANDBOX',  # or 'PRODUCTION'
       base_url='your-bc-api-url',
       client_id='your-client-id',
       company_id='your-company-id',
       auto_sync_enabled=True,
       batch_size=50,
       sync_interval_minutes=15,
       fuel_expense_account='6100',
       coupon_inventory_account='1400',
       cash_account='1000',
       is_active=True
   )
   
   print(f"Created configuration: {config.name}")
   ```

## Phase 4: Testing and Validation

### Step 1: Test Connection

```powershell
# Test basic connectivity
python manage.py test_bc_connection --config default --detailed

# Test all configurations
python manage.py test_bc_connection --all
```

### Step 2: Initial Data Sync Test

```powershell
# Test with dry run first
python manage.py sync_to_dynamics --sync-type employees --dry-run --config default

# Sync a small batch
python manage.py sync_to_dynamics --sync-type employees --batch-size 5 --config default
```

### Step 3: Verify in Business Central

1. **Check Customer Records**
   - Go to Business Central → Customers
   - Look for MP-XXXXXX records (Parliament Members)

2. **Check Items**
   - Go to Business Central → Items
   - Look for BOOK-XXXXXX records (Coupon Books)

3. **Check Journal Entries**
   - Go to Business Central → General Ledger → General Journals
   - Look for FC-XXXXXX entries (Fuel Transactions)

## Phase 5: Production Deployment

### Step 1: Production Environment Setup

1. **Create Production BC Configuration**
   ```python
   production_config = BusinessCentralConfig.objects.create(
       name='production',
       description='Parliament BC Production Integration',
       environment_type='PRODUCTION',
       # ... other settings
   )
   ```

2. **Update Environment Variables**
   ```env
   DYNAMICS_ENVIRONMENT_NAME=production
   DYNAMICS_BC_URL=https://api.businesscentral.dynamics.com/v2.0/tenant-id/production/ODataV4/
   ```

### Step 2: Security Hardening

1. **Client Secret Rotation**
   - Set up automated secret rotation
   - Use Azure Key Vault for production

2. **Network Security**
   - Implement IP whitelisting if required
   - Configure VPN for sensitive operations

3. **Monitoring Setup**
   ```python
   # Add to Django settings
   LOGGING['loggers']['dynamics_integration']['level'] = 'INFO'
   ```

### Step 3: Scheduled Sync Setup

1. **Set Up Cron Jobs** (Linux/macOS) or **Task Scheduler** (Windows)
   ```bash
   # Daily full sync at 2 AM
   0 2 * * * cd /path/to/project && python manage.py sync_to_dynamics --sync-type all
   
   # Hourly queue processing
   0 * * * * cd /path/to/project && python manage.py sync_to_dynamics --sync-type queue
   ```

2. **Windows Task Scheduler**
   ```powershell
   # Create scheduled task for daily sync
   $action = New-ScheduledTaskAction -Execute "python.exe" -Argument "manage.py sync_to_dynamics --sync-type all" -WorkingDirectory "C:\path\to\project"
   $trigger = New-ScheduledTaskTrigger -Daily -At "02:00"
   Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "FuelCoupons-BC-DailySync"
   ```

## Phase 6: Monitoring and Maintenance

### Step 1: Monitor Sync Status

1. **Django Admin Dashboard**
   ```
   http://localhost:8000/admin/dynamics_integration/
   ```

2. **Check Sync Logs**
   ```powershell
   python manage.py shell
   ```
   ```python
   from dynamics_integration.models import SyncLog
   
   # Recent sync status
   recent_logs = SyncLog.objects.all()[:10]
   for log in recent_logs:
       print(f"{log.sync_type}: {log.status} - {log.records_processed} records")
   ```

### Step 2: Health Monitoring

1. **API Health Check**
   ```powershell
   # Weekly connection test
   python manage.py test_bc_connection --all
   ```

2. **Queue Monitoring**
   ```python
   from dynamics_integration.models import SyncQueue
   
   # Check failed items
   failed_items = SyncQueue.objects.filter(retry_count__gte=3, is_active=True)
   print(f"Failed sync items: {failed_items.count()}")
   ```

### Step 3: Performance Optimization

1. **Batch Size Tuning**
   - Monitor sync performance
   - Adjust batch sizes based on data volume
   - Consider peak and off-peak hours

2. **API Rate Limiting**
   - Monitor API usage against Microsoft limits
   - Implement backoff strategies if needed

## Troubleshooting Guide

### Common Issues and Solutions

1. **Authentication Failures**
   ```
   Error: Authentication failed
   Solution: 
   - Verify client ID and secret
   - Check Azure AD app permissions
   - Ensure admin consent is granted
   ```

2. **API Permission Errors**
   ```
   Error: Insufficient permissions
   Solution:
   - Add required API permissions in Azure AD
   - Verify Business Central user permissions
   - Check web service configurations
   ```

3. **Connection Timeouts**
   ```
   Error: Request timeout
   Solution:
   - Check network connectivity
   - Increase timeout values in settings
   - Verify Business Central service status
   ```

4. **Data Mapping Issues**
   ```
   Error: Field mapping failed
   Solution:
   - Check field names and types
   - Verify Business Central entity structure
   - Update mapping configurations
   ```

### Support Contacts

- **Technical Issues**: IT Support Team
- **Business Central**: Microsoft Partner/Support
- **Azure AD**: Azure Administrator
- **Integration Logic**: Development Team

## Success Metrics

Track these KPIs to measure integration success:

1. **Sync Success Rate**: Target >95%
2. **Real-time Sync Latency**: Target <30 seconds
3. **Batch Sync Duration**: Target <15 minutes for daily sync
4. **Data Accuracy**: 100% (no discrepancies between systems)
5. **System Availability**: Target >99.5%

## Conclusion

This integration provides:

✅ **Real-time financial tracking** of fuel consumption  
✅ **Automated inventory management** for coupon books  
✅ **Integrated employee records** for parliament members  
✅ **Vehicle asset management** in Business Central  
✅ **Comprehensive audit trails** across both systems  
✅ **Streamlined operations** with reduced manual entry  

The system is now ready for production use with Microsoft Dynamics 365 Business Central Essentials, providing enterprise-level ERP capabilities for the Parliament of Zimbabwe's fuel coupon management operations.
