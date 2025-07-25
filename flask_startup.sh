#!/bin/bash

# Super simple Flask test
echo "Testing Flask deployment..."

# Install Flask
pip install flask

# Set default port
if [ -z "$PORT" ]; then
    export PORT=8000
    echo "PORT set to 8000"
fi

echo "Starting Flask on port $PORT..."
exec python flask_test.py
