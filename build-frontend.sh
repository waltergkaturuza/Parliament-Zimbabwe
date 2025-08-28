#!/bin/bash
# Frontend build script for Render

echo "🏗️ Starting frontend build for Parliament Zimbabwe system..."

# Navigate to frontend directory
cd fuel-coupon-frontend

echo "📦 Installing dependencies..."
npm ci

echo "🔧 Building for production..."
npm run build

echo "✅ Frontend build completed successfully!"
echo "📁 Build output location: ./fuel-coupon-frontend/dist"
