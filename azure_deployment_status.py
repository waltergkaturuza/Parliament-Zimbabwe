"""
Azure Deployment Status Checker
Checks if the latest code has been deployed to Azure App Service
"""
import requests
import json
from datetime import datetime

print(f"🔍 AZURE DEPLOYMENT STATUS CHECK - {datetime.now()}")
print("=" * 60)

# Test the critical endpoints that cause post-login crash
critical_endpoints = [
    "/api/v1/notifications/stats/",
    "/api/v1/dashboard/", 
    "/api/v1/home/activity/",
    "/api/v1/home/insights/",
]

base_url = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"

print("🎯 Testing Critical Post-Login Endpoints:")
print("-" * 40)

for endpoint in critical_endpoints:
    try:
        url = f"{base_url}{endpoint}"
        response = requests.get(url, timeout=10)
        status = response.status_code
        
        if status == 404:
            print(f"❌ {endpoint} -> 404 (NOT DEPLOYED YET)")
        elif status == 401:
            print(f"✅ {endpoint} -> 401 (DEPLOYED - Auth Required)")  
        elif status == 200:
            print(f"✅ {endpoint} -> 200 (DEPLOYED - Working)")
        else:
            print(f"⚠️  {endpoint} -> {status} (DEPLOYED - Other Status)")
            
    except Exception as e:
        print(f"❌ {endpoint} -> ERROR: {str(e)}")

print("\n📋 ANALYSIS:")
print("-" * 40)
print("If all endpoints show 404, Azure hasn't deployed the latest code yet.")
print("If endpoints show 401/200, the deployment is successful.")
print("The post-login crash occurs because the frontend calls these endpoints")
print("immediately after authentication and gets 404 errors.")

print(f"\n⏰ Last Check: {datetime.now()}")
print("🔄 Azure typically takes 3-5 minutes to deploy new commits.")
