-- Migration: Add difficulty levels feature
-- Created: 2025-10-18
-- Description: Adds difficulty column to math_problem_sessions table

-- Add difficulty column
ALTER TABLE math_problem_sessions 
ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'medium';

-- Add constraint to ensure only valid difficulty values
ALTER TABLE math_problem_sessions
ADD CONSTRAINT check_difficulty_values 
CHECK (difficulty IN ('easy', 'medium', 'hard'));

-- Create index for filtering by difficulty
CREATE INDEX IF NOT EXISTS idx_math_problem_sessions_difficulty 
ON math_problem_sessions(difficulty);

-- Verify migration
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'math_problem_sessions' 
        AND column_name = 'difficulty'
    ) INTO column_exists;
    
    IF column_exists THEN
        RAISE NOTICE '✅ Migration successful: difficulty column added';
    ELSE
        RAISE EXCEPTION '❌ Migration failed: difficulty column not found';
    END IF;
END $$;

-- Display current schema
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'math_problem_sessions'
ORDER BY ordinal_position;
```

### Step 3: Execute Migration in Supabase

1. **Open Supabase SQL Editor**
2. **Copy entire `001_add_difficulty_levels.sql` file**
3. **Paste and Run**
4. **Verify success** - Should see "✅ Migration successful" notice

---

## PROJECT STRUCTURE NOW
```
math-problem-generator/
├── database.sql                          # ✅ ORIGINAL (keep unchanged)
├── migrations/                           # ✅ NEW FOLDER
│   └── 001_add_difficulty_levels.sql     # ✅ NEW MIGRATION
├── cleanup-database.sql                  # ✅ EXISTING
├── app/
├── lib/
└── ...