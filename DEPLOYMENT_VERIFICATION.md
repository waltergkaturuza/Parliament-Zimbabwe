# Deployment Verification Guide

This guide explains how to use the comprehensive deployment verification tools for the Parliament Fuel Coupon System.

## 📋 Overview

The system includes multiple verification tools to ensure your deployment is working correctly:

1. **Enhanced Startup Script** - Runs migrations and health checks during deployment
2. **Post-Deployment Verification Script** - External testing of all endpoints
3. **Django Management Command** - Internal application verification
4. **GitHub Actions Workflow** - Automated verification after deployment
5. **PowerShell Script** - Windows-friendly verification tool

## 🚀 Enhanced Startup Script

The `startup-enhanced.sh` script is automatically run during Azure App Service deployment and includes:

- ✅ Database migrations
- ✅ Static files collection
- ✅ Admin user creation
- ✅ Health checks before server start
- ✅ Comprehensive error handling

### Features:
- Logs all operations with timestamps
- Creates default admin user (admin/AdminPass2025!)
- Validates database connectivity
- Sets up initial fuel data
- Performs pre-startup health checks

## 🧪 Verification Scripts

### 1. External Verification (Bash)
```bash
./verify-deployment.sh [BACKEND_URL] [FRONTEND_URL]
```

**Default URLs:**
- Backend: `https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net`
- Frontend: `https://jolly-ocean-0e0dee90f.2.azurestaticapps.net`

**Tests performed:**
- 🔌 Basic connectivity
- 🌐 CORS configuration
- 🔐 Authentication endpoints
- 🔒 SSL/TLS security
- ⚡ Performance metrics
- 🔗 Frontend integration

### 2. External Verification (PowerShell)
```powershell
.\verify-deployment.ps1 -BackendUrl "https://your-backend.azurewebsites.net" -FrontendUrl "https://your-frontend.azurestaticapps.net"
```

### 3. Internal Django Verification
```bash
python manage.py verify_deployment [--format json] [--critical-only]
```

**Tests performed:**
- ⚙️ Django settings validation
- 🗄️ Database connectivity
- 📦 Migration status
- 🔐 Authentication system
- 📝 Model integrity
- 🌐 CORS configuration
- 🏢 Business Central setup

## 🤖 Automated Verification

### GitHub Actions
The system includes automated verification that runs after each deployment:

```yaml
# Triggers automatically after deployment
# Or run manually from GitHub Actions tab
```

**Features:**
- Waits for deployment to stabilize
- Tests all critical endpoints
- Generates detailed reports
- Uploads verification artifacts
- Sends notifications on failure

## 📊 Test Categories

### Critical Tests (Must Pass)
- ✅ Database connectivity
- ✅ Django settings validation
- ✅ Migration status
- ✅ CORS configuration
- ✅ Authentication system

### Non-Critical Tests (Warnings Only)
- ⚡ Performance metrics
- 📁 Static files
- 🏢 Business Central configuration
- 📝 Model access

## 🔧 Usage Examples

### Quick Health Check
```bash
# Test if the system is responding
curl https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net/health/simple/
```

### Full External Verification
```bash
# Run complete external tests
chmod +x verify-deployment.sh
./verify-deployment.sh
```

### Internal Application Verification
```bash
# Run Django management command
python manage.py verify_deployment --format json > verification_report.json
```

### Windows PowerShell Verification
```powershell
# Run PowerShell verification
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\verify-deployment.ps1
```

## 📈 Understanding Results

### Exit Codes
- **0**: All tests passed ✅
- **1**: Some non-critical tests failed ⚠️
- **2**: Critical tests failed ❌

### Status Indicators
- **PASS** ✅: Test completed successfully
- **FAIL** ❌: Test failed (needs attention)
- **WARN** ⚠️: Test passed with warnings
- **ERROR** 💥: Test encountered an exception

## 🛠️ Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```
   Check environment variables:
   - DATABASE_NAME
   - DATABASE_USER
   - DATABASE_PASSWORD
   - DATABASE_HOST
   ```

2. **CORS Errors**
   ```
   Verify frontend URL in CORS_ALLOWED_ORIGINS:
   - Check production.py settings
   - Verify frontend deployment URL
   ```

3. **Authentication Issues**
   ```
   Ensure admin user exists:
   - Check startup logs
   - Run: python manage.py createsuperuser
   ```

4. **SSL Certificate Issues**
   ```
   Check Azure App Service configuration:
   - Custom domain settings
   - SSL binding configuration
   ```

### Debug Mode
To enable debug output during verification:

```bash
# For external script
DEBUG=true ./verify-deployment.sh

# For Django command
python manage.py verify_deployment --format json | jq '.tests[] | select(.status != "PASS")'
```

## 📝 Logs and Monitoring

### Azure App Service Logs
- **Location**: Azure Portal → App Service → Logs
- **Startup Logs**: `/home/LogFiles/python.log`
- **Application Logs**: Application Insights

### Local Verification Logs
- **Bash Script**: Console output with timestamps
- **PowerShell**: Colored console output
- **Django Command**: JSON or text format

### GitHub Actions Artifacts
- **Location**: GitHub → Actions → Workflow run → Artifacts
- **Files**: `deployment-verification-results`

## 🔄 Continuous Monitoring

### Setup Automated Monitoring
1. Enable GitHub Actions workflow
2. Configure Azure Application Insights
3. Set up alerting for critical failures
4. Schedule regular verification runs

### Health Endpoints
- **Simple**: `/health/simple/` - Basic OK/FAIL
- **Detailed**: `/health/` - Comprehensive system status
- **API**: `/api/` - API availability

## 🎯 Best Practices

1. **Run verification after every deployment**
2. **Monitor critical tests more frequently**
3. **Keep verification scripts updated**
4. **Review failed tests immediately**
5. **Use JSON output for automated processing**

## 📞 Support

If verification consistently fails:

1. Check Azure App Service status
2. Review application logs
3. Verify environment variables
4. Test database connectivity
5. Check DNS resolution

For urgent issues, check the simplified health endpoint:
```
https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net/health/simple/
```
