-- CORRECTED QUICK FIX - Check table structure first, then fix
-- Run this directly in Supabase SQL editor

-- =================================================================
-- STEP 1: CHECK BOOK TABLE STRUCTURE
-- =================================================================
-- First, let's see what columns exist in the fuel_book table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'fuel_book'
ORDER BY ordinal_position;

-- Also check fuel_bookdispatch current structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'fuel_bookdispatch'
ORDER BY ordinal_position;