# Parliament of Zimbabwe - Step-by-Step Setup Instructions
## Based on Your Microsoft Cloud Account

### Account Information Received
- **Tenant ID**: `086c4475-d0ef-4d2b-871c-4e078a083db5`
- **Admin Account**: `admin@parliamentzw.onmicrosoft.com`
- **Business Central Admin**: https://businesscentral.dynamics.com/086c4475-d0ef-4d2b-871c-4e078a083db5/admin
- **Microsoft 365 Admin**: https://admin.microsoft.com/Adminportal/Home

## IMMEDIATE NEXT STEPS

### Step 1: Access Your Business Central Admin Center
1. **Open Business Central Admin Center**
   ```
   URL: https://businesscentral.dynamics.com/086c4475-d0ef-4d2b-871c-4e078a083db5/admin
   Login: admin@parliamentzw.onmicrosoft.com
   Password: [Use the password from your signup email]
   ```

2. **Create Your First Environment**
   - Click "Create environment"
   - Choose "Sandbox" for testing
   - Environment name: `parliament-fuel-sandbox`
   - Country/Region: Zimbabwe (if available) or South Africa
   - Click "Create"

3. **Note Your Environment Details**
   After creation, you'll see:
   ```
   Environment Name: parliament-fuel-sandbox
   Environment Type: Sandbox
   Web Client URL: https://businesscentral.dynamics.com/[tenant-id]/parliament-fuel-sandbox/
   ```

### Step 2: Create Azure AD App Registration
1. **Access Azure Portal**
   ```
   URL: https://portal.azure.com
   Login: admin@parliamentzw.onmicrosoft.com
   ```

2. **Navigate to App Registrations**
   - Go to "Azure Active Directory"
   - Click "App registrations"
   - Click "New registration"

3. **Create the Registration**
   - Name: `Parliament-Fuel-Coupon-BC-Integration`
   - Supported account types: "Accounts in this organizational directory only (Parliament of Zimbabwe)"
   - Redirect URI: Leave blank for now
   - Click "Register"

4. **Copy Important Values**
   After creation, copy these values:
   ```
   Application (client) ID: [Copy this value]
   Directory (tenant) ID: 086c4475-d0ef-4d2b-871c-4e078a083db5 (confirmed)
   ```

5. **Create Client Secret**
   - Go to "Certificates & secrets"
   - Click "New client secret"
   - Description: `Fuel Coupon Integration Secret`
   - Expires: 12 months
   - Click "Add"
   - **IMPORTANT**: Copy the secret value immediately!

6. **Configure API Permissions**
   - Go to "API permissions"
   - Click "Add a permission"
   - Select "Dynamics 365 Business Central"
   - Choose "Application permissions"
   - Select: `API.ReadWrite.All`
   - Click "Add permissions"
   - Click "Grant admin consent for Parliament of Zimbabwe"

### Step 3: Configure Business Central Web Services
1. **Access Your Business Central Environment**
   ```
   URL: https://businesscentral.dynamics.com/086c4475-d0ef-4d2b-871c-4e078a083db5/parliament-fuel-sandbox/
   ```

2. **Set Up Web Services**
   - Search for "Web Services" in Business Central
   - Create these web services:

   | Object Type | Object ID | Service Name | Publish |
   |-------------|-----------|--------------|---------|
   | Page | 21 | Customers | ✓ |
   | Page | 27 | Items | ✓ |
   | Page | 30 | Vendors | ✓ |
   | Page | 5200 | Employees | ✓ |
   | Page | 5600 | FixedAssets | ✓ |
   | Page | 81 | GeneralJournal | ✓ |

3. **Get Company ID**
   - In Business Central, go to "Companies"
   - Note the Company ID (usually a GUID)
   - Or use the OData URL to find it:
   ```
   https://api.businesscentral.dynamics.com/v2.0/086c4475-d0ef-4d2b-871c-4e078a083db5/parliament-fuel-sandbox/ODataV4/Company
   ```

### Step 4: Update Your Integration Configuration

Once you have all the values, update your Django configuration:

```python
# Create this configuration in Django
from dynamics_integration.models import BusinessCentralConfig

config = BusinessCentralConfig.objects.create(
    name='parliamentzw',
    description='Parliament of Zimbabwe BC Integration',
    tenant_id='086c4475-d0ef-4d2b-871c-4e078a083db5',
    environment_name='parliament-fuel-sandbox',
    environment_type='SANDBOX',
    base_url='https://api.businesscentral.dynamics.com/v2.0/086c4475-d0ef-4d2b-871c-4e078a083db5/parliament-fuel-sandbox/ODataV4/',
    client_id='[YOUR_CLIENT_ID_FROM_AZURE]',
    company_id='[YOUR_COMPANY_ID_FROM_BC]',
    auto_sync_enabled=True,
    batch_size=50,
    sync_interval_minutes=15,
    is_active=True
)
```

### Step 5: Environment Variables Setup

Create/update your `.env` file:
```env
# Parliament of Zimbabwe Dynamics 365 Configuration
DYNAMICS_TENANT_ID=086c4475-d0ef-4d2b-871c-4e078a083db5
DYNAMICS_CLIENT_ID=[your-client-id-from-azure]
DYNAMICS_CLIENT_SECRET=[your-client-secret-from-azure]
DYNAMICS_BC_URL=https://api.businesscentral.dynamics.com/v2.0/086c4475-d0ef-4d2b-871c-4e078a083db5/parliament-fuel-sandbox/ODataV4/
DYNAMICS_ENVIRONMENT_NAME=parliament-fuel-sandbox
DYNAMICS_COMPANY_ID=[your-company-id-from-bc]
DYNAMICS_SYNC_ENABLED=True
```

### Step 6: Test the Integration

```powershell
# Test connection
cd "c:\Users\Administrator\Documents\POZ\fuel_coupon_system"
python manage.py test_bc_connection --config parliamentzw --detailed

# Test initial sync (dry run)
python manage.py sync_to_dynamics --sync-type employees --dry-run --config parliamentzw
```

## INFORMATION STILL NEEDED FROM YOU

To complete the setup, I need you to:

1. **Complete Azure AD App Registration** and provide:
   - Client ID (Application ID)
   - Client Secret (copy immediately after creation)

2. **Set up Business Central Environment** and provide:
   - Environment name you choose
   - Company ID from Business Central

3. **Confirm Access** to:
   - Azure Portal (https://portal.azure.com)
   - Business Central Admin Center
   - Business Central Environment

## NEXT STEPS FOR YOU

1. **Today**: 
   - Log into Business Central Admin Center
   - Create your first Sandbox environment
   - Take screenshots of any issues

2. **This Week**:
   - Complete Azure AD App Registration
   - Set up Business Central Web Services
   - Provide the missing configuration values

3. **Once Complete**:
   - Test the integration
   - Set up initial data sync
   - Plan production environment

## SUPPORT

If you encounter any issues:

1. **Azure AD Issues**: Check admin permissions
2. **Business Central Access**: Verify subscription status
3. **API Issues**: Confirm web services are published
4. **Integration Issues**: Check Django logs

Would you like me to guide you through any specific step, or do you have questions about accessing these services?
