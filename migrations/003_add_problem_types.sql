-- Migration 003: Add Problem Types/Categories
-- Purpose: Track mathematical topic categories for better analytics and filtering
-- Date: 2025-10-18

-- Display current state
DO $$
DECLARE 
    session_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO session_count FROM math_problem_sessions;
    RAISE NOTICE '====================================';
    RAISE NOTICE 'MIGRATION 003: ADD PROBLEM TYPES';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'Current sessions in database: %', session_count;
END $$;

-- Add problem_type column
ALTER TABLE math_problem_sessions
ADD COLUMN IF NOT EXISTS problem_type TEXT DEFAULT 'Mixed Operations';

-- Add constraint to ensure only valid problem types
ALTER TABLE math_problem_sessions
DROP CONSTRAINT IF EXISTS check_problem_type_values;

ALTER TABLE math_problem_sessions
ADD CONSTRAINT check_problem_type_values
CHECK (problem_type IN (
    'Whole Numbers',
    'Fractions',
    'Decimals',
    'Percentages',
    'Ratios',
    'Rates',
    'Money',
    'Time',
    'Length & Mass',
    'Area & Perimeter',
    'Volume',
    'Geometry',
    'Mixed Operations'
));

-- Create index for filtering by problem type
CREATE INDEX IF NOT EXISTS idx_math_problem_sessions_problem_type
ON math_problem_sessions(problem_type);

-- Add comment for documentation
COMMENT ON COLUMN math_problem_sessions.problem_type IS
'Mathematical topic category based on Singapore Primary 5 Math syllabus. Used for filtering and performance tracking by topic.';

-- Verify migration
DO $$
DECLARE 
    column_exists BOOLEAN;
    index_exists BOOLEAN;
    constraint_exists BOOLEAN;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'MIGRATION VERIFICATION';
    RAISE NOTICE '====================================';
    
    -- Check if column was added
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'math_problem_sessions' 
        AND column_name = 'problem_type'
    ) INTO column_exists;
    
    -- Check if index was created
    SELECT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'math_problem_sessions' 
        AND indexname = 'idx_math_problem_sessions_problem_type'
    ) INTO index_exists;
    
    -- Check if constraint was added
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.constraint_column_usage 
        WHERE table_name = 'math_problem_sessions' 
        AND constraint_name = 'check_problem_type_values'
    ) INTO constraint_exists;
    
    IF column_exists THEN
        RAISE NOTICE '✅ Column "problem_type" added successfully';
    ELSE
        RAISE NOTICE '❌ Column "problem_type" NOT added';
    END IF;
    
    IF index_exists THEN
        RAISE NOTICE '✅ Index "idx_math_problem_sessions_problem_type" created successfully';
    ELSE
        RAISE NOTICE '❌ Index NOT created';
    END IF;
    
    IF constraint_exists THEN
        RAISE NOTICE '✅ Check constraint "check_problem_type_values" added successfully';
    ELSE
        RAISE NOTICE '❌ Check constraint NOT added';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'MIGRATION COMPLETE';
    RAISE NOTICE '====================================';
END $$;

-- Display sample of updated schema
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'math_problem_sessions'
ORDER BY ordinal_position;