"""
Azure Deployment Monitor - Watch for deployment completion
Monitors endpoints every 30 seconds until deployment is complete
"""
import requests
import time
from datetime import datetime

def check_endpoints():
    critical_endpoints = [
        "/api/v1/notifications/stats/",
        "/api/v1/dashboard/", 
        "/api/v1/home/activity/",
        "/api/v1/home/insights/",
    ]
    
    base_url = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"
    deployed_count = 0
    
    print(f"\n🔍 Deployment Check - {datetime.now().strftime('%H:%M:%S')}")
    print("-" * 50)
    
    for endpoint in critical_endpoints:
        try:
            url = f"{base_url}{endpoint}"
            response = requests.get(url, timeout=10)
            status = response.status_code
            
            if status == 404:
                print(f"❌ {endpoint} -> 404 (Not deployed)")
            elif status in [401, 200, 405]:
                print(f"✅ {endpoint} -> {status} (Deployed!)")
                deployed_count += 1
            else:
                print(f"⚠️  {endpoint} -> {status}")
                deployed_count += 1
                
        except Exception as e:
            print(f"❌ {endpoint} -> ERROR: {str(e)}")
    
    return deployed_count == len(critical_endpoints)

print("🚀 AZURE DEPLOYMENT MONITOR")
print("=" * 60)
print("Monitoring critical endpoints for post-login crash fix...")
print("Will check every 30 seconds until deployment completes.")
print("\nPress Ctrl+C to stop monitoring.")

try:
    check_count = 0
    while True:
        check_count += 1
        print(f"\n📊 Check #{check_count}")
        
        if check_endpoints():
            print("\n🎉 DEPLOYMENT SUCCESSFUL!")
            print("✅ All critical endpoints are now available.")
            print("🔓 Post-login crash should be fixed!")
            break
        else:
            print("⏳ Waiting 30 seconds for next check...")
            time.sleep(30)
            
except KeyboardInterrupt:
    print("\n\n⏹️  Monitoring stopped by user.")
    print("Use 'python azure_deployment_status.py' to check status manually.")
