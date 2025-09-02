#!/bin/bash
# Script to handle remaining model changes after successful deployment

echo "🔧 Resolving remaining model changes..."
echo "======================================"

# Check what models have changes
echo "📊 Checking for model changes..."
python manage.py makemigrations --dry-run

# If there are changes, create migrations
echo "🔄 Creating new migrations for any model changes..."
python manage.py makemigrations

# Apply any new migrations
echo "🚀 Applying new migrations..."
python manage.py migrate

# Verify final state
echo "✅ Final migration status:"
python manage.py showmigrations fuel

echo ""
echo "🎉 All migrations resolved!"
echo "========================="
