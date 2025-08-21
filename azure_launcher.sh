#!/bin/bash

echo "=== AZURE STARTUP LAUNCHER ==="
echo "Looking for azure_entrypoint.sh in extracted app directory..."

# Find the extracted app directory (usually /tmp/something)
APP_DIR=""
if [ -n "$ORYX_APP_PATH" ] && [ -f "$ORYX_APP_PATH/azure_entrypoint.sh" ]; then
    APP_DIR="$ORYX_APP_PATH"
elif [ -n "$APP_PATH" ] && [ -f "$APP_PATH/azure_entrypoint.sh" ]; then
    APP_DIR="$APP_PATH"
else
    # Search for the extracted directory
    for dir in /tmp/8*; do
        if [ -d "$dir" ] && [ -f "$dir/azure_entrypoint.sh" ]; then
            APP_DIR="$dir"
            break
        fi
    done
fi

if [ -n "$APP_DIR" ] && [ -f "$APP_DIR/azure_entrypoint.sh" ]; then
    echo "✓ Found azure_entrypoint.sh in: $APP_DIR"
    echo "Making executable and launching..."
    chmod +x "$APP_DIR/azure_entrypoint.sh"
    cd "$APP_DIR"
    exec bash "$APP_DIR/azure_entrypoint.sh"
else
    echo "✗ FATAL: azure_entrypoint.sh not found anywhere!"
    echo "Environment variables:"
    echo "  ORYX_APP_PATH=$ORYX_APP_PATH"
    echo "  APP_PATH=$APP_PATH"
    echo "Searching in /tmp directories..."
    ls -la /tmp/8* 2>/dev/null || echo "No /tmp/8* directories found"
    
    echo "Container will sleep for debugging..."
    sleep 3600
fi
