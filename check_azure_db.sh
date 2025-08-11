#!/bin/bash
# AZURE SMART MIGRATION RECOVERY
# This script will check what exists and fake apply migrations accordingly

echo "=== CHECKING EXISTING DATABASE STRUCTURE ==="

# Check fuel_box columns
echo "Checking fuel_box table:"
python manage.py dbshell << EOF
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'fuel_box' 
ORDER BY column_name;
\q
EOF

# Check fuel_user columns  
echo "Checking fuel_user table:"
python manage.py dbshell << EOF
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'fuel_user' 
ORDER BY column_name;
\q
EOF

# Check if fuel_book table exists
echo "Checking if fuel_book table exists:"
python manage.py dbshell << EOF
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_name = 'fuel_book'
);
\q
EOF

echo "=== SMART MIGRATION STRATEGY ==="
echo "Based on the column check above, we'll fake apply some migrations and run others normally"

# Since barcode column exists, fake apply 0002
echo "Fake applying 0002 (barcode already exists)..."
python manage.py migrate fuel 0002 --fake

# Check if other columns exist before proceeding
echo "Checking for USD fields..."
python manage.py dbshell << EOF
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'fuel_box' AND column_name LIKE '%usd%';
\q
EOF
