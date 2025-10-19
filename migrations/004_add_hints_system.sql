-- Add hints column to math_problem_sessions
ALTER TABLE math_problem_sessions
ADD COLUMN IF NOT EXISTS hints TEXT[] DEFAULT NULL;

-- Add hints tracking to submissions
ALTER TABLE math_problem_submissions
ADD COLUMN IF NOT EXISTS hints_used INTEGER DEFAULT 0;

-- Verify columns were added
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'math_problem_sessions' 
        AND column_name = 'hints'
    ) THEN
        RAISE NOTICE 'Column hints added to math_problem_sessions';
    END IF;
    
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'math_problem_submissions' 
        AND column_name = 'hints_used'
    ) THEN
        RAISE NOTICE 'Column hints_used added to math_problem_submissions';
    END IF;
END $$;