-- Emergency Migration Dependency Fix for Render Deployment
-- This fixes the specific error: Migration fuel.10014_add_centralized_generation_fields 
-- is applied before its dependency fuel.10013_add_books_relationship

-- Step 1: Remove the problematic migration records in correct order
DELETE FROM django_migrations 
WHERE app = 'fuel' AND name = '10014_add_centralized_generation_fields';

DELETE FROM django_migrations 
WHERE app = 'fuel' AND name = '10015_remove_book_total_coupons_remove_coupon_fuel_type_and_more';

DELETE FROM django_migrations 
WHERE app = 'fuel' AND name = '10016_remove_book_total_coupons_remove_coupon_fuel_type_and_more';

-- Step 2: Ensure the dependency migration exists first
INSERT INTO django_migrations (app, name, applied) 
SELECT 'fuel', '10013_add_books_relationship', NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM django_migrations 
    WHERE app = 'fuel' AND name = '10013_add_books_relationship'
);

-- Step 3: Now add the dependent migrations in correct order
INSERT INTO django_migrations (app, name, applied) 
SELECT 'fuel', '10014_add_centralized_generation_fields', NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM django_migrations 
    WHERE app = 'fuel' AND name = '10014_add_centralized_generation_fields'
);

INSERT INTO django_migrations (app, name, applied) 
SELECT 'fuel', '10015_remove_book_total_coupons_remove_coupon_fuel_type_and_more', NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM django_migrations 
    WHERE app = 'fuel' AND name = '10015_remove_book_total_coupons_remove_coupon_fuel_type_and_more'
);

INSERT INTO django_migrations (app, name, applied) 
SELECT 'fuel', '10016_remove_book_total_coupons_remove_coupon_fuel_type_and_more', NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM django_migrations 
    WHERE app = 'fuel' AND name = '10016_remove_book_total_coupons_remove_coupon_fuel_type_and_more'
);

-- Verification query
SELECT 'Migration order verification:' as status;
SELECT app, name, applied 
FROM django_migrations 
WHERE app = 'fuel' AND name LIKE '1001%'
ORDER BY applied;
