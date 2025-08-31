-- Supabase Verification Script
-- Run this after applying the schema fix to verify everything is working

-- Check if all required columns exist
SELECT 
    t.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_name IN ('fuel_box', 'fuel_book', 'fuel_coupon')
AND c.column_name IN (
    'first_coupon_serial', 'last_coupon_serial', 'total_books', 'coupons_per_book',
    'is_generated', 'coupon_serial', 'page_number'
)
ORDER BY t.table_name, c.column_name;

-- Check migration status
SELECT 
    app, 
    name, 
    applied,
    CASE 
        WHEN name LIKE '%1001%' THEN '✅ Centralized Generation Migration'
        ELSE 'Other Migration'
    END as migration_type
FROM django_migrations 
WHERE app = 'fuel' 
AND (name LIKE '%1001%' OR name LIKE '%centralized%')
ORDER BY applied DESC;

-- Check constraints
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_name IN ('fuel_box', 'fuel_book', 'fuel_coupon')
AND tc.constraint_name LIKE '%serial%'
ORDER BY tc.table_name;

-- Test data integrity
SELECT 
    'fuel_coupon' as table_name,
    COUNT(*) as total_rows,
    COUNT(coupon_serial) as has_serial,
    COUNT(DISTINCT coupon_serial) as unique_serials
FROM fuel_coupon;

-- Check for any remaining NULL coupon_serial values
SELECT COUNT(*) as null_coupon_serials
FROM fuel_coupon 
WHERE coupon_serial IS NULL;

-- Success message
SELECT '✅ Schema verification complete! Check results above.' as status;
