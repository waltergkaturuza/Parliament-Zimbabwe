#!/bin/bash
# Build script for production deployment

# Install dependencies
npm install

# Build the project
npm run build

# Copy _redirects file to build directory for proper routing
cp public/_redirects dist/

# Copy index.html to handle client-side routing
echo "Build completed successfully!"
echo "Files in dist directory:"
ls -la dist/
