-- ================================================================
-- OTTODOT ASSESSMENT - DATABASE CLEANUP SCRIPT
-- ================================================================
-- Purpose: Clean all data from math problem tables while preserving structure
-- Safe to run multiple times
-- Run this in Supabase SQL Editor when you want to refresh the database
--
-- Created: October 18, 2025
-- Developer: Daniel Alexis Cruz
-- ================================================================

-- Display current data count BEFORE cleanup
DO $$
DECLARE
    session_count INTEGER;
    submission_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO session_count FROM math_problem_sessions;
    SELECT COUNT(*) INTO submission_count FROM math_problem_submissions;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'BEFORE CLEANUP:';
    RAISE NOTICE 'Sessions: %', session_count;
    RAISE NOTICE 'Submissions: %', submission_count;
    RAISE NOTICE '========================================';
END $$;

-- ================================================================
-- STEP 1: Delete all data from tables
-- ================================================================
-- Note: Due to CASCADE DELETE on foreign key, deleting sessions
-- will automatically delete related submissions

-- Delete all submissions first (explicit, for clarity)
DELETE FROM math_problem_submissions;

-- Delete all sessions (this would delete submissions anyway via CASCADE)
DELETE FROM math_problem_sessions;

-- ================================================================
-- STEP 2: Reset any sequences (if needed)
-- ================================================================
-- Note: We use UUID (gen_random_uuid()), not sequences,
-- so no sequence reset needed. This section is for reference.

-- If you had sequences, you would reset them like this:
-- ALTER SEQUENCE your_sequence_name RESTART WITH 1;

-- ================================================================
-- STEP 3: Verify cleanup
-- ================================================================
DO $$
DECLARE
    session_count INTEGER;
    submission_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO session_count FROM math_problem_sessions;
    SELECT COUNT(*) INTO submission_count FROM math_problem_submissions;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'AFTER CLEANUP:';
    RAISE NOTICE 'Sessions: %', session_count;
    RAISE NOTICE 'Submissions: %', submission_count;
    
    IF session_count = 0 AND submission_count = 0 THEN
        RAISE NOTICE 'STATUS: ✓ Database cleaned successfully';
    ELSE
        RAISE WARNING 'STATUS: ✗ Cleanup incomplete - data still exists';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

-- ================================================================
-- OPTIONAL: Verify table structure still intact
-- ================================================================
-- Uncomment these lines if you want to verify tables, policies, and indexes

-- Check tables exist
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('math_problem_sessions', 'math_problem_submissions');

-- Check policies exist
-- SELECT schemaname, tablename, policyname 
-- FROM pg_policies 
-- WHERE tablename IN ('math_problem_sessions', 'math_problem_submissions');

-- Check indexes exist
-- SELECT indexname, tablename 
-- FROM pg_indexes 
-- WHERE tablename IN ('math_problem_sessions', 'math_problem_submissions');

-- ================================================================
-- NOTES FOR USING THIS SCRIPT:
-- ================================================================
-- 1. This script is SAFE to run multiple times
-- 2. It will NOT drop tables, policies, or indexes
-- 3. It only deletes DATA, preserving all structure
-- 4. Check the NOTICES in the Supabase SQL Editor output to see counts
-- 5. If you need to recreate the entire schema, run database.sql instead
--
-- HOW TO USE IN SUPABASE:
-- 1. Go to Supabase Dashboard
-- 2. Click "SQL Editor" in the left sidebar
-- 3. Click "New query"
-- 4. Paste this entire file
-- 5. Click "Run" or press Ctrl+Enter
-- 6. Check the "Results" panel for NOTICES showing before/after counts
-- ================================================================