-- Step 1: Check if the Document and DocumentChunk tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('Document', 'DocumentChunk');

-- Step 2: Check the column type for documentType in Document table
SELECT 
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_name = 'Document'
AND column_name = 'documentType';

-- Step 3: Check what values are actually stored
SELECT DISTINCT "documentType", COUNT(*) as count
FROM "Document" 
GROUP BY "documentType"
ORDER BY "documentType";

-- Step 4: FIX - Convert documentType to TEXT if it's using an enum
-- This will make it compatible with the query in the code
ALTER TABLE "Document" 
ALTER COLUMN "documentType" TYPE TEXT;

-- Step 5: Verify the fix
SELECT 
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_name = 'Document'
AND column_name = 'documentType';

-- Step 6: Test that the query works now
SELECT 
    d."documentType",
    COUNT(*) as chunk_count
FROM "DocumentChunk" dc
JOIN "Document" d ON d.id = dc."documentId"
WHERE d."documentType"::text = ANY(ARRAY['HANDBOOK', 'QUESTIONNAIRE', 'REPORT', 'RESEARCH'])
GROUP BY d."documentType";

-- Step 7: Sample search to verify it works with content about scores
SELECT 
    d.title,
    d."documentType",
    LEFT(dc.content, 200) as content_preview
FROM "DocumentChunk" dc
JOIN "Document" d ON d.id = dc."documentId"
WHERE d."documentType"::text = 'HANDBOOK'
AND dc.content ILIKE '%net score%'
LIMIT 3;