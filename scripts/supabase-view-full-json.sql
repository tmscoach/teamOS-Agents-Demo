-- ============================================================
-- VIEW FULL JSON DATA FOR REPORT
-- This shows the exact JSON that http://localhost:3001/reports/json/21989 uses
-- ============================================================

-- Option 1: View the raw JSON data (compact)
SELECT 
    id,
    "subscriptionId",
    "jsonData"
FROM "UserReport"
WHERE "subscriptionId" = '21989'
    AND "jsonData" IS NOT NULL
ORDER BY "createdAt" DESC
LIMIT 1;

-- Option 2: View formatted JSON (pretty printed)
SELECT 
    id,
    "subscriptionId",
    jsonb_pretty("jsonData"::jsonb) as formatted_json
FROM "UserReport"
WHERE "subscriptionId" = '21989'
    AND "jsonData" IS NOT NULL
ORDER BY "createdAt" DESC
LIMIT 1;

-- Option 3: View specific sections with details
SELECT 
    id,
    "subscriptionId",
    "jsonData"->>'workflowType' as workflow_type,
    "jsonData"->'metadata' as metadata,
    "jsonData"->'sections' as sections
FROM "UserReport"
WHERE "subscriptionId" = '21989'
    AND "jsonData" IS NOT NULL
ORDER BY "createdAt" DESC
LIMIT 1;

-- Option 4: Expand all sections to see their structure
WITH report AS (
    SELECT 
        id,
        "subscriptionId",
        "jsonData"
    FROM "UserReport"
    WHERE "subscriptionId" = '21989'
        AND "jsonData" IS NOT NULL
    ORDER BY "createdAt" DESC
    LIMIT 1
)
SELECT 
    r.id as report_id,
    section_index,
    section->>'id' as section_id,
    section->>'title' as section_title,
    section->>'type' as section_type,
    CASE 
        WHEN section->'visualization' IS NOT NULL 
        THEN section->'visualization'->>'type'
        ELSE 'No visualization'
    END as visualization_type,
    LENGTH(section->>'vectorChunk') as vector_chunk_length,
    CASE 
        WHEN section->'content' IS NOT NULL 
        THEN LEFT((section->'content'->>'text'), 100) || '...'
        ELSE 'No text content'
    END as content_preview
FROM report r,
    jsonb_array_elements(("jsonData"->'sections')::jsonb) WITH ORDINALITY as t(section, section_index)
ORDER BY section_index;

-- Option 5: Get just the sections array for inspection
SELECT 
    "jsonData"->'sections' as all_sections
FROM "UserReport"
WHERE "subscriptionId" = '21989'
    AND "jsonData" IS NOT NULL
ORDER BY "createdAt" DESC
LIMIT 1;