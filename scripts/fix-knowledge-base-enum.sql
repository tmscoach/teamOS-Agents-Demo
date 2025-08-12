-- Check if DocumentType enum exists and its values
SELECT 
    typname,
    typtype,
    array_agg(enumlabel ORDER BY enumsortorder) as enum_values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE typname = 'DocumentType'
GROUP BY typname, typtype;

-- If the above returns no results, the enum might not exist
-- Check the actual column type in KnowledgeBaseDocument
SELECT 
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_name = 'KnowledgeBaseDocument'
AND column_name = 'documentType';

-- If documentType is TEXT instead of enum, we can either:
-- Option 1: Create the enum type (if it doesn't exist)
-- DO $$
-- BEGIN
--     IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DocumentType') THEN
--         CREATE TYPE "DocumentType" AS ENUM ('HANDBOOK', 'QUESTIONNAIRE', 'REPORT', 'RESEARCH');
--     END IF;
-- END$$;

-- Option 2: Or just update the search query to use text comparison
-- The application code needs to be updated to cast properly
-- For now, let's check what's actually in the database:
SELECT DISTINCT "documentType", COUNT(*) 
FROM "KnowledgeBaseDocument" 
GROUP BY "documentType";