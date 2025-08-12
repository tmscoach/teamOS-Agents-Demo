-- Step 1: Check current state
SELECT 
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_name = 'KnowledgeBaseDocument'
AND column_name = 'documentType';

-- Step 2: Check what values are actually stored
SELECT DISTINCT "documentType", COUNT(*) as count
FROM "KnowledgeBaseDocument" 
GROUP BY "documentType"
ORDER BY "documentType";

-- Step 3: Check if enum type exists
SELECT 
    typname,
    typtype,
    array_agg(enumlabel ORDER BY enumsortorder) as enum_values
FROM pg_type t
LEFT JOIN pg_enum e ON t.oid = e.enumtypid
WHERE typname = 'DocumentType'
GROUP BY typname, typtype;

-- Step 4: FIX - Update the column to use TEXT type
-- This is the safest approach that will work with the application code
ALTER TABLE "KnowledgeBaseDocument" 
ALTER COLUMN "documentType" TYPE TEXT;

-- Step 5: Verify the fix
SELECT 
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_name = 'KnowledgeBaseDocument'
AND column_name = 'documentType';

-- Step 6: Test that queries work now
SELECT "documentType", COUNT(*) 
FROM "KnowledgeBaseDocument"
WHERE "documentType" IN ('HANDBOOK', 'QUESTIONNAIRE', 'REPORT', 'RESEARCH')
GROUP BY "documentType";

-- Step 7: Sample search query to verify it works
SELECT 
    id,
    "documentType",
    source,
    LEFT(content, 100) as content_preview
FROM "KnowledgeBaseDocument"
WHERE "documentType" = 'HANDBOOK'
AND content ILIKE '%net score%'
LIMIT 3;