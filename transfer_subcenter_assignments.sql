-- SQL Script to Transfer Subcenter Assignments from Users to Beneficiary Profiles
-- Run this directly on Supabase PostgreSQL database

-- =====================================================
-- PART 1: Transfer existing subcenter assignments from users to beneficiary profiles
-- =====================================================

UPDATE fuel_beneficiaryprofile 
SET sub_center_id = fuel_user.sub_center_id
FROM fuel_user 
WHERE fuel_beneficiaryprofile.user_id = fuel_user.id 
AND fuel_user.sub_center_id IS NOT NULL 
AND fuel_beneficiaryprofile.sub_center_id IS NULL;

-- =====================================================
-- PART 2: Assign subcenters based on surname alphabetical ranges
-- For beneficiaries that still don't have subcenter assignments
-- =====================================================

-- First, let's see the available subcenters (you may need to adjust IDs based on your database)
-- Subcenter A: surnames A-E (typically subcenter ID 1)
-- Subcenter B: surnames F-L (typically subcenter ID 2) 
-- Subcenter C: surnames M-N (typically subcenter ID 3)
-- Subcenter D: surnames O-Z (typically subcenter ID 4 or 5)

-- Assign surnames A-E to Subcenter ID 1 (adjust ID as needed)
UPDATE fuel_beneficiaryprofile 
SET sub_center_id = 1
FROM fuel_user 
WHERE fuel_beneficiaryprofile.user_id = fuel_user.id 
AND fuel_beneficiaryprofile.sub_center_id IS NULL
AND UPPER(LEFT(fuel_user.last_name, 1)) IN ('A', 'B', 'C', 'D', 'E');

-- Assign surnames F-L to Subcenter ID 2 (adjust ID as needed)
UPDATE fuel_beneficiaryprofile 
SET sub_center_id = 2
FROM fuel_user 
WHERE fuel_beneficiaryprofile.user_id = fuel_user.id 
AND fuel_beneficiaryprofile.sub_center_id IS NULL
AND UPPER(LEFT(fuel_user.last_name, 1)) IN ('F', 'G', 'H', 'I', 'J', 'K', 'L');

-- Assign surnames M-N to Subcenter ID 3 (adjust ID as needed)
UPDATE fuel_beneficiaryprofile 
SET sub_center_id = 3
FROM fuel_user 
WHERE fuel_beneficiaryprofile.user_id = fuel_user.id 
AND fuel_beneficiaryprofile.sub_center_id IS NULL
AND UPPER(LEFT(fuel_user.last_name, 1)) IN ('M', 'N');

-- Assign surnames O-Z to Subcenter ID 4 (adjust ID as needed - use 4 or 5 based on your subcenters)
UPDATE fuel_beneficiaryprofile 
SET sub_center_id = 4
FROM fuel_user 
WHERE fuel_beneficiaryprofile.user_id = fuel_user.id 
AND fuel_beneficiaryprofile.sub_center_id IS NULL
AND UPPER(LEFT(fuel_user.last_name, 1)) IN ('O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z');

-- =====================================================
-- PART 3: Handle any remaining unassigned beneficiaries (fallback to default subcenter)
-- =====================================================

-- Assign any remaining beneficiaries without subcenters to a default subcenter (ID 1)
UPDATE fuel_beneficiaryprofile 
SET sub_center_id = 1
WHERE sub_center_id IS NULL;

-- =====================================================
-- VERIFICATION QUERIES (run these to check the results)
-- =====================================================

-- Check subcenter distribution after assignment
SELECT 
    fs.name as subcenter_name,
    COUNT(fb.id) as beneficiary_count,
    STRING_AGG(fu.last_name, ', ' ORDER BY fu.last_name) as surnames
FROM fuel_subcenter fs
LEFT JOIN fuel_beneficiaryprofile fb ON fs.id = fb.sub_center_id
LEFT JOIN fuel_user fu ON fb.user_id = fu.id
WHERE fs.is_active = true
GROUP BY fs.id, fs.name
ORDER BY fs.name;

-- Check for any remaining unassigned beneficiaries
SELECT 
    fu.first_name,
    fu.last_name,
    fu.email,
    fb.employee_id
FROM fuel_beneficiaryprofile fb
JOIN fuel_user fu ON fb.user_id = fu.id
WHERE fb.sub_center_id IS NULL;

-- Count beneficiaries by subcenter assignment
SELECT 
    CASE 
        WHEN fb.sub_center_id IS NULL THEN 'Unassigned'
        ELSE fs.name 
    END as assignment_status,
    COUNT(*) as count
FROM fuel_beneficiaryprofile fb
LEFT JOIN fuel_subcenter fs ON fb.sub_center_id = fs.id
GROUP BY fb.sub_center_id, fs.name
ORDER BY fs.name;