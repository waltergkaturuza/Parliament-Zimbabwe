from django.db import connection

def column_exists(table, column):
    cursor = connection.cursor()
    cursor.execute(f"PRAGMA table_info({table})")
    columns = [row[1] for row in cursor.fetchall()]
    return column in columns

cursor = connection.cursor()

print("🔧 Adding missing database fields to Coupon model...")

# Add missing columns to fuel_coupon if they don't exist
if not column_exists('fuel_coupon', 'coupon_serial'):
    cursor.execute('ALTER TABLE fuel_coupon ADD COLUMN coupon_serial VARCHAR(50) NULL')
    print('✅ Added coupon_serial to fuel_coupon')
else:
    print('ℹ️  coupon_serial already exists in fuel_coupon')

if not column_exists('fuel_coupon', 'page_number'):
    cursor.execute('ALTER TABLE fuel_coupon ADD COLUMN page_number INTEGER NULL')
    print('✅ Added page_number to fuel_coupon')
else:
    print('ℹ️  page_number already exists in fuel_coupon')

if not column_exists('fuel_coupon', 'coupon_value'):
    cursor.execute('ALTER TABLE fuel_coupon ADD COLUMN coupon_value INTEGER DEFAULT 20')
    print('✅ Added coupon_value to fuel_coupon')
else:
    print('ℹ️  coupon_value already exists in fuel_coupon')

print('\n🎉 Coupon database schema updated successfully!')
