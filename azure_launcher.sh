#!/bin/bash

# Azure App Service Startup Script for Oryx Deployment
# This script handles the startup of the Django application on Azure App Service
echo "[$(date)] Azure Launcher starting..."
echo "[$(date)] Environment Variables:"
echo "  APP_PATH=$APP_PATH"
echo "  ORYX_APP_PATH=$ORYX_APP_PATH"
echo "  PWD=$PWD"
echo "  HOME=$HOME"

# Search for azure_entrypoint.sh in Oryx deployment locations
ENTRYPOINT_SCRIPT=""

# Priority order: Oryx paths first, then fallbacks
SEARCH_PATHS=(
    "$APP_PATH"
    "$ORYX_APP_PATH"
    "$(pwd)"
    "/home/site/wwwroot"
    "/opt/startup"
)

echo "[$(date)] Searching for azure_entrypoint.sh..."
for search_path in "${SEARCH_PATHS[@]}"; do
    if [ -n "$search_path" ] && [ -f "$search_path/azure_entrypoint.sh" ]; then
        ENTRYPOINT_SCRIPT="$search_path/azure_entrypoint.sh"
        echo "[$(date)] ✓ Found azure_entrypoint.sh at: $ENTRYPOINT_SCRIPT"
        break
    else
        echo "[$(date)] ✗ Not found in: $search_path"
    fi
done

if [ -n "$ENTRYPOINT_SCRIPT" ]; then
    echo "[$(date)] Making script executable and launching..."
    chmod +x "$ENTRYPOINT_SCRIPT"
    exec bash "$ENTRYPOINT_SCRIPT"
else
    echo "[$(date)] FATAL: azure_entrypoint.sh not found in any location"
    echo "[$(date)] Directory listings:"
    
    for search_path in "${SEARCH_PATHS[@]}"; do
        if [ -n "$search_path" ] && [ -d "$search_path" ]; then
            echo "[$(date)] Contents of $search_path:"
            ls -la "$search_path" 2>/dev/null || echo "  Cannot access directory"
        fi
    done
    
    echo "[$(date)] Environment variables:"
    env | grep -E "(APP_|ORYX_|WEBSITE_)" | sort
    
    echo "[$(date)] Container will sleep for SSH debugging..."
    sleep 3600
fi
