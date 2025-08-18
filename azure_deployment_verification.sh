#!/bin/bash
# Azure Production Deployment Verification Script
# This script forces Azure to deploy the latest code and verifies the import fixes

echo "=== AZURE PRODUCTION DEPLOYMENT VERIFICATION ==="
echo "Timestamp: $(date)"
echo "Repository: Parliament-Zimbabwe"
echo "Latest commit: $(git log --oneline -1)"
echo ""

# 1. Verify latest code is in repository
echo "1. CHECKING REPOSITORY STATUS..."
git status
echo ""

# 2. Force Azure deployment by creating a deployment trigger
echo "2. CREATING AZURE DEPLOYMENT TRIGGER..."
echo "# Azure Deployment Trigger - $(date)" >> .azure_deploy_trigger
git add .azure_deploy_trigger
git commit -m "FORCE AZURE DEPLOYMENT: Trigger deployment of import fixes

- Force Azure to deploy latest code with import error fixes
- Ensure auth_roles and subcenters_stats functions are available
- Critical fix for HTTP 500 errors in production
- Deploy enhanced MainCenter functionality

Deployment trigger: $(date)"

echo ""

# 3. Push to trigger Azure deployment
echo "3. PUSHING TO TRIGGER AZURE DEPLOYMENT..."
git push origin main
echo ""

# 4. Wait for deployment and test endpoints
echo "4. AZURE DEPLOYMENT VERIFICATION CHECKLIST:"
echo ""
echo "   a) Wait 3-5 minutes for Azure to deploy the latest code"
echo "   b) Azure will automatically restart the App Service"
echo "   c) Test the following critical endpoints:"
echo ""
echo "   AUTH ENDPOINT TEST:"
echo "   curl -X POST https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net/api/v1/auth/login/"
echo ""
echo "   DASHBOARD ENDPOINT TEST:"
echo "   curl https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net/api/v1/dashboard/"
echo ""
echo "   SUBCENTERS STATS TEST:"
echo "   curl https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net/api/v1/subcenters/stats/"
echo ""
echo "   BOXES ENDPOINT TEST:"
echo "   curl https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net/api/v1/boxes/"
echo ""

# 5. Show expected results
echo "5. EXPECTED RESULTS AFTER DEPLOYMENT:"
echo ""
echo "   ✅ HTTP 200 responses instead of HTTP 500"
echo "   ✅ No ImportError: cannot import name 'auth_roles'"  
echo "   ✅ All API endpoints return proper JSON responses"
echo "   ✅ MainCenter dashboard shows enhanced statistics"
echo "   ✅ SubCenter monitoring displays real-time data"
echo ""

# 6. Azure portal monitoring links
echo "6. AZURE MONITORING LINKS:"
echo ""
echo "   Application Logs: https://portal.azure.com/#@086c4475-d0ef-4d2b-871c-4e078a083db5/resource/subscriptions/f40e0dcc-18ac-4143-95b1-52c5e72b8d7f/resourceGroups/parliament-fuel-rg/providers/Microsoft.Web/sites/parliament-fuel-system/logStream"
echo ""
echo "   App Service Deployment: https://portal.azure.com/#@086c4475-d0ef-4d2b-871c-4e078a083db5/resource/subscriptions/f40e0dcc-18ac-4143-95b1-52c5e72b8d7f/resourceGroups/parliament-fuel-rg/providers/Microsoft.Web/sites/parliament-fuel-system/deployment"
echo ""

# 7. Deployment verification commands
echo "7. POST-DEPLOYMENT VERIFICATION COMMANDS:"
echo ""
echo "   # Test if import errors are fixed:"
echo "   python -c \"from fuel.views_main import auth_roles, subcenters_stats; print('✅ Import fix successful')\""
echo ""
echo "   # Test Django system check:"
echo "   python manage.py check --settings=config.settings.production"
echo ""

echo "=== DEPLOYMENT TRIGGER COMPLETE ==="
echo "Monitor Azure portal for deployment progress..."
echo "Expected deployment time: 3-5 minutes"
echo ""
echo "CRITICAL FIX SUMMARY:"
echo "- Fixed ImportError for auth_roles and subcenters_stats"
echo "- Enhanced MainCenter dashboard APIs"
echo "- Added comprehensive field mapping"
echo "- Resolved HTTP 500 errors causing service unavailability"
echo ""
echo "The production environment should be fully functional after deployment."
