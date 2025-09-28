-- DEBUG SCRIPT: Check User and Beneficiary Subcenter Alignment in Production
-- Run this on your Supabase database to diagnose the filtering issue

-- =====================================================
-- PART 1: Check all users by role and their subcenter assignments
-- =====================================================

SELECT 
    'ALL USERS BY ROLE' as section,
    u.id,
    u.username,
    u.first_name,
    u.last_name,
    u.role,
    u.sub_center_id as user_subcenter_id,
    sc.name as user_subcenter_name,
    CASE 
        WHEN u.role IN ('ADMIN', 'MAIN_CENTER', 'AUDITOR', 'SUPERUSER') THEN 'Should see ALL beneficiaries'
        WHEN u.role IN ('SUB_CENTER', 'SUB_CENTER_APPROVER') THEN 'Should see only assigned subcenter'
        ELSE 'Other role'
    END as expected_access
FROM fuel_user u
LEFT JOIN fuel_subcenter sc ON u.sub_center_id = sc.id
WHERE u.role IN ('ADMIN', 'MAIN_CENTER', 'AUDITOR', 'SUPERUSER', 'SUB_CENTER', 'SUB_CENTER_APPROVER')
ORDER BY u.role, u.username;

-- =====================================================
-- PART 2: Check beneficiary subcenter assignments  
-- =====================================================

SELECT 
    'BENEFICIARY DISTRIBUTION' as section,
    sc.id as subcenter_id,
    sc.name as subcenter_name,
    COUNT(bp.id) as beneficiary_count,
    STRING_AGG(
        CONCAT(u.first_name, ' ', u.last_name, ' (', LEFT(u.last_name, 1), ')'), 
        ', ' 
        ORDER BY u.last_name
    ) as sample_beneficiaries
FROM fuel_subcenter sc
LEFT JOIN fuel_beneficiaryprofile bp ON sc.id = bp.sub_center_id AND bp.is_active_beneficiary = true
LEFT JOIN fuel_user u ON bp.user_id = u.id
WHERE sc.is_active = true
GROUP BY sc.id, sc.name
ORDER BY sc.name;

-- =====================================================
-- PART 3: Find potential mismatches
-- =====================================================

-- Check if there are subcenter users with no matching beneficiaries
SELECT 
    'USER-BENEFICIARY MISMATCH' as issue,
    u.username as subcenter_user,
    u.sub_center_id as user_subcenter,
    sc.name as user_subcenter_name,
    COUNT(bp.id) as matching_beneficiaries
FROM fuel_user u
JOIN fuel_subcenter sc ON u.sub_center_id = sc.id
LEFT JOIN fuel_beneficiaryprofile bp ON u.sub_center_id = bp.sub_center_id AND bp.is_active_beneficiary = true
WHERE u.role IN ('SUB_CENTER', 'SUB_CENTER_APPROVER')
GROUP BY u.id, u.username, u.sub_center_id, sc.name
HAVING COUNT(bp.id) = 0;

-- =====================================================
-- PART 4: Check specific user (replace 'subcenter' with actual username)
-- =====================================================

-- Replace 'subcenter' with the actual username from your screenshot
WITH user_info AS (
    SELECT 
        u.id,
        u.username,
        u.role,
        u.sub_center_id,
        sc.name as subcenter_name
    FROM fuel_user u
    LEFT JOIN fuel_subcenter sc ON u.sub_center_id = sc.id
    WHERE u.username = 'subcenter' -- CHANGE THIS TO YOUR USERNAME
)
SELECT 
    'SPECIFIC USER DEBUG' as section,
    ui.username,
    ui.role,
    ui.sub_center_id,
    ui.subcenter_name,
    COUNT(bp.id) as beneficiaries_in_same_subcenter,
    STRING_AGG(
        CONCAT(bu.first_name, ' ', bu.last_name), 
        ', ' 
        ORDER BY bu.last_name
    ) as beneficiary_names
FROM user_info ui
LEFT JOIN fuel_beneficiaryprofile bp ON ui.sub_center_id = bp.sub_center_id AND bp.is_active_beneficiary = true
LEFT JOIN fuel_user bu ON bp.user_id = bu.id
GROUP BY ui.username, ui.role, ui.sub_center_id, ui.subcenter_name;

-- =====================================================
-- PART 5: Total counts verification
-- =====================================================

SELECT 
    'TOTAL COUNTS' as section,
    (SELECT COUNT(*) FROM fuel_user WHERE role IN ('SUB_CENTER', 'SUB_CENTER_APPROVER')) as subcenter_users,
    (SELECT COUNT(*) FROM fuel_beneficiaryprofile WHERE is_active_beneficiary = true) as total_beneficiaries,
    (SELECT COUNT(*) FROM fuel_beneficiaryprofile WHERE is_active_beneficiary = true AND sub_center_id IS NOT NULL) as assigned_beneficiaries,
    (SELECT COUNT(*) FROM fuel_beneficiaryprofile WHERE is_active_beneficiary = true AND sub_center_id IS NULL) as unassigned_beneficiaries;