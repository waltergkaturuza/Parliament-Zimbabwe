-- QUICK SETUP INSTRUCTIONS FOR SUPABASE
-- ==========================================

-- STEP 1: First, check your actual subcenter IDs in Supabase
-- Run this query to see your subcenters:
SELECT id, name, code FROM fuel_subcenter WHERE is_active = true ORDER BY name;

-- STEP 2: Update the subcenter IDs in the assignment queries below based on your results
-- Replace the numbers (1, 2, 3, 4) with your actual subcenter IDs

-- STEP 3: Run the transfer and assignment queries

-- Transfer existing user subcenter assignments to beneficiary profiles
UPDATE fuel_beneficiaryprofile 
SET sub_center_id = fuel_user.sub_center_id
FROM fuel_user 
WHERE fuel_beneficiaryprofile.user_id = fuel_user.id 
AND fuel_user.sub_center_id IS NOT NULL 
AND fuel_beneficiaryprofile.sub_center_id IS NULL;

-- Assign based on surname ranges (UPDATE THE SUBCENTER IDs TO MATCH YOUR DATABASE)
-- Surnames A-E → Subcenter A
UPDATE fuel_beneficiaryprofile 
SET sub_center_id = 1  -- ← CHANGE THIS ID TO YOUR SUBCENTER A ID
FROM fuel_user 
WHERE fuel_beneficiaryprofile.user_id = fuel_user.id 
AND fuel_beneficiaryprofile.sub_center_id IS NULL
AND UPPER(LEFT(fuel_user.last_name, 1)) IN ('A', 'B', 'C', 'D', 'E');

-- Surnames F-L → Subcenter B  
UPDATE fuel_beneficiaryprofile 
SET sub_center_id = 2  -- ← CHANGE THIS ID TO YOUR SUBCENTER B ID
FROM fuel_user 
WHERE fuel_beneficiaryprofile.user_id = fuel_user.id 
AND fuel_beneficiaryprofile.sub_center_id IS NULL
AND UPPER(LEFT(fuel_user.last_name, 1)) IN ('F', 'G', 'H', 'I', 'J', 'K', 'L');

-- Surnames M-N → Subcenter C
UPDATE fuel_beneficiaryprofile 
SET sub_center_id = 3  -- ← CHANGE THIS ID TO YOUR SUBCENTER C ID
FROM fuel_user 
WHERE fuel_beneficiaryprofile.user_id = fuel_user.id 
AND fuel_beneficiaryprofile.sub_center_id IS NULL
AND UPPER(LEFT(fuel_user.last_name, 1)) IN ('M', 'N');

-- Surnames O-Z → Subcenter D
UPDATE fuel_beneficiaryprofile 
SET sub_center_id = 4  -- ← CHANGE THIS ID TO YOUR SUBCENTER D ID
FROM fuel_user 
WHERE fuel_beneficiaryprofile.user_id = fuel_user.id 
AND fuel_beneficiaryprofile.sub_center_id IS NULL
AND UPPER(LEFT(fuel_user.last_name, 1)) IN ('O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z');

-- STEP 4: Verify the results
SELECT 
    fs.name as subcenter_name,
    COUNT(fb.id) as beneficiary_count
FROM fuel_subcenter fs
LEFT JOIN fuel_beneficiaryprofile fb ON fs.id = fb.sub_center_id
WHERE fs.is_active = true
GROUP BY fs.id, fs.name
ORDER BY fs.name;