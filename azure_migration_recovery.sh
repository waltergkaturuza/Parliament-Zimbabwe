#!/bin/bash
# AZURE MIGRATION RECOVERY SCRIPT
# Run this in your Azure SSH terminal

echo "=== AZURE MIGRATION RECOVERY ==="
echo "Current working directory:"
pwd

echo -e "\n=== CHECKING MIGRATION STATUS ==="
python manage.py showmigrations fuel

echo -e "\n=== CHECKING DATABASE COLUMNS ==="
python manage.py dbshell -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'fuel_box' AND column_name IN ('barcode', 'notes');"

echo -e "\n=== MARKING MIGRATION AS FAKE APPLIED ==="
# Mark the problematic migration as already applied since the columns exist
python manage.py migrate fuel 0002 --fake

echo -e "\n=== RUNNING REMAINING MIGRATIONS ==="
python manage.py migrate fuel --verbosity=2

echo -e "\n=== FINAL MIGRATION STATUS ==="
python manage.py showmigrations fuel

echo -e "\n=== TESTING DATABASE ACCESS ==="
python manage.py shell -c "
from fuel.models import User, Box, Book
print('User model:', User.objects.count(), 'users')
print('Box model:', Box.objects.count(), 'boxes')  
print('Book model:', Book.objects.count(), 'books')
print('SUCCESS: All models accessible')
"

echo "=== RECOVERY COMPLETE ==="
