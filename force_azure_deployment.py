#!/usr/bin/env python3
"""
Force Azure App Service deployment refresh
"""
import subprocess
import time

def force_azure_deployment():
    """Force Azure to redeploy latest code"""
    
    print("🚀 FORCING AZURE APP SERVICE DEPLOYMENT")
    print("=" * 60)
    
    # Add a dummy file to force deployment
    print("📝 Adding deployment trigger file...")
    with open("DEPLOYMENT_TRIGGER.txt", "w") as f:
        f.write(f"Deployment forced at {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write("This file triggers Azure App Service to restart with latest code.\n")
        f.write("All 9 missing endpoints should be working after this deployment.\n")
    
    # Commit and push the trigger
    print("📤 Committing and pushing trigger...")
    
    commands = [
        ["git", "add", "."],
        ["git", "commit", "-m", "URGENT: Force Azure deployment - trigger restart to load missing endpoints"],
        ["git", "push", "origin", "main"]
    ]
    
    for cmd in commands:
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            print(f"✅ {' '.join(cmd)}: Success")
        except subprocess.CalledProcessError as e:
            print(f"❌ {' '.join(cmd)}: Failed - {e.stderr}")
            return False
    
    print("\n🎯 DEPLOYMENT TRIGGERED!")
    print("-" * 60)
    print("Azure App Service should now:")
    print("1. Detect the new commit")
    print("2. Restart the application")
    print("3. Load all our endpoint implementations")
    print("\n⏳ Wait 2-3 minutes, then test endpoints again.")
    
    return True

if __name__ == "__main__":
    force_azure_deployment()
