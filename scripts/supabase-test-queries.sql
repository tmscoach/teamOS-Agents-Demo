-- ============================================================
-- Supabase SQL Test Queries for JSON Report System
-- Run these queries in Supabase SQL Editor to verify the system
-- ============================================================

-- ============================================================
-- 1. CHECK JSON REPORT STORAGE
-- ============================================================

-- Find all reports for subscription 21989
SELECT 
    id,
    "subscriptionId",
    "reportType",
    "processingStatus",
    "createdAt",
    jsonb_array_length(("jsonData"->'sections')::jsonb) as section_count,
    "jsonData"->>'workflowType' as workflow_type,
    "jsonData"->'metadata'->>'userName' as user_name
FROM "UserReport"
WHERE "subscriptionId" = '21989'
ORDER BY "createdAt" DESC
LIMIT 5;

-- Get the most recent report with full JSON structure
SELECT 
    id,
    "subscriptionId",
    "jsonData"->'sections'->0->>'title' as first_section_title,
    "jsonData"->'sections'->0->>'type' as first_section_type,
    "jsonData"->'sections'->0->'visualization'->>'type' as first_visualization,
    jsonb_pretty(("jsonData"->'metadata')::jsonb) as metadata
FROM "UserReport"
WHERE "subscriptionId" = '21989'
    AND "jsonData" IS NOT NULL
    AND "jsonData"->'sections' IS NOT NULL
ORDER BY "createdAt" DESC
LIMIT 1;

-- ============================================================
-- 2. CHECK VECTOR CHUNKS
-- ============================================================

-- Count chunks and check embeddings for the most recent report
WITH latest_report AS (
    SELECT id, "subscriptionId"
    FROM "UserReport"
    WHERE "subscriptionId" = '21989'
    ORDER BY "createdAt" DESC
    LIMIT 1
)
SELECT 
    COUNT(*) as total_chunks,
    COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) as chunks_with_embeddings,
    COUNT(DISTINCT "sectionTitle") as unique_sections,
    ROUND(AVG("charCount")) as avg_chunk_size
FROM "ReportChunk" rc
JOIN latest_report lr ON rc."reportId" = lr.id;

-- List all chunks with their content preview
WITH latest_report AS (
    SELECT id FROM "UserReport"
    WHERE "subscriptionId" = '21989'
    ORDER BY "createdAt" DESC
    LIMIT 1
)
SELECT 
    "chunkIndex",
    "sectionTitle",
    LEFT(content, 100) || '...' as content_preview,
    "charCount",
    CASE WHEN embedding IS NOT NULL THEN '✅ Yes' ELSE '❌ No' END as has_embedding
FROM "ReportChunk"
WHERE "reportId" = (SELECT id FROM latest_report)
ORDER BY "chunkIndex";

-- ============================================================
-- 3. TEST VECTOR SEARCH CAPABILITIES
-- ============================================================

-- Search for specific content (text search)
WITH latest_report AS (
    SELECT id FROM "UserReport"
    WHERE "subscriptionId" = '21989'
    ORDER BY "createdAt" DESC
    LIMIT 1
)
SELECT 
    "sectionTitle",
    LEFT(content, 150) || '...' as content_preview
FROM "ReportChunk"
WHERE "reportId" = (SELECT id FROM latest_report)
    AND content ILIKE '%Upholder Maintainer%'
LIMIT 3;

-- Check embedding dimensions (should be 1536 for OpenAI)
WITH latest_report AS (
    SELECT id FROM "UserReport"
    WHERE "subscriptionId" = '21989'
    ORDER BY "createdAt" DESC
    LIMIT 1
)
SELECT 
    "sectionTitle",
    array_length(embedding::real[], 1) as embedding_dimension
FROM "ReportChunk"
WHERE "reportId" = (SELECT id FROM latest_report)
    AND embedding IS NOT NULL
LIMIT 1;

-- ============================================================
-- 4. VERIFY SECTION COMPLETENESS
-- ============================================================

-- Check if all expected TMP sections are present
WITH latest_report AS (
    SELECT id FROM "UserReport"
    WHERE "subscriptionId" = '21989'
    ORDER BY "createdAt" DESC
    LIMIT 1
),
expected_sections AS (
    SELECT unnest(ARRAY[
        'Team Management Profile',
        'Introduction',
        'Work Preference Measures',
        'Overview',
        'Leadership Strengths',
        'Decision-Making',
        'Interpersonal Skills',
        'Team-Building',
        'Areas for Self-Assessment',
        'Key Points of Note for Upholder Maintainers',
        'Related Roles',
        'Work Preference Distribution',
        'Linking',
        'Individual Summary'
    ]) as section_name
)
SELECT 
    es.section_name,
    CASE 
        WHEN rc."sectionTitle" IS NOT NULL THEN '✅ Present'
        ELSE '❌ Missing'
    END as status
FROM expected_sections es
LEFT JOIN "ReportChunk" rc ON es.section_name = rc."sectionTitle"
    AND rc."reportId" = (SELECT id FROM latest_report)
ORDER BY 
    CASE WHEN rc."sectionTitle" IS NOT NULL THEN 0 ELSE 1 END,
    es.section_name;

-- ============================================================
-- 5. CHECK VECTOR CHUNK CONTENT QUALITY
-- ============================================================

-- Analyze vector chunk content from JSON
WITH latest_report AS (
    SELECT id, "jsonData" FROM "UserReport"
    WHERE "subscriptionId" = '21989'
    ORDER BY "createdAt" DESC
    LIMIT 1
)
SELECT 
    (section->>'title') as section_title,
    (section->>'type') as section_type,
    LENGTH(section->>'vectorChunk') as vector_chunk_length,
    CASE 
        WHEN section->>'vectorChunk' IS NOT NULL AND section->>'vectorChunk' != '' 
        THEN LEFT(section->>'vectorChunk', 100) || '...'
        ELSE 'No vectorChunk'
    END as vector_chunk_preview
FROM latest_report,
    jsonb_array_elements(("jsonData"->'sections')::jsonb) as section
ORDER BY (section->>'order')::int;

-- ============================================================
-- 6. SEMANTIC SEARCH TEST (if pgvector is enabled)
-- ============================================================

-- Find similar chunks using vector similarity (requires pgvector)
-- This query will find chunks similar to "Upholder Maintainer" concept
WITH latest_report AS (
    SELECT id FROM "UserReport"
    WHERE "subscriptionId" = '21989'
    ORDER BY "createdAt" DESC
    LIMIT 1
),
target_embedding AS (
    -- Get embedding of a chunk about Upholder Maintainer
    SELECT embedding
    FROM "ReportChunk"
    WHERE "reportId" = (SELECT id FROM latest_report)
        AND content ILIKE '%Upholder Maintainer%'
    LIMIT 1
)
SELECT 
    rc."sectionTitle",
    LEFT(rc.content, 100) || '...' as content_preview,
    -- Calculate cosine similarity (1 - cosine distance)
    1 - (rc.embedding <=> te.embedding) as similarity_score
FROM "ReportChunk" rc, target_embedding te
WHERE rc."reportId" = (SELECT id FROM latest_report)
    AND rc.embedding IS NOT NULL
ORDER BY similarity_score DESC
LIMIT 5;

-- ============================================================
-- 7. SUMMARY STATISTICS
-- ============================================================

-- Overall system health check
WITH latest_report AS (
    SELECT 
        id,
        "jsonData",
        "processingStatus",
        "createdAt"
    FROM "UserReport"
    WHERE "subscriptionId" = '21989'
    ORDER BY "createdAt" DESC
    LIMIT 1
),
chunk_stats AS (
    SELECT 
        COUNT(*) as total_chunks,
        COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) as embedded_chunks,
        SUM("charCount") as total_chars
    FROM "ReportChunk"
    WHERE "reportId" = (SELECT id FROM latest_report)
)
SELECT 
    lr.id as report_id,
    lr."processingStatus",
    DATE(lr."createdAt") as created_date,
    jsonb_array_length((lr."jsonData"->'sections')::jsonb) as json_sections,
    cs.total_chunks,
    cs.embedded_chunks,
    ROUND(cs.embedded_chunks::numeric / NULLIF(cs.total_chunks, 0) * 100) as embedding_coverage_pct,
    cs.total_chars as total_characters,
    CASE 
        WHEN lr."processingStatus" = 'COMPLETED' 
            AND cs.total_chunks > 0 
            AND cs.embedded_chunks = cs.total_chunks
        THEN '✅ Fully Operational'
        WHEN lr."processingStatus" = 'COMPLETED' 
            AND cs.total_chunks > 0
        THEN '⚠️ Partial Embeddings'
        ELSE '❌ Issues Detected'
    END as system_status
FROM latest_report lr, chunk_stats cs;

-- ============================================================
-- END OF TEST QUERIES
-- ============================================================

-- Notes:
-- 1. Run these queries in order to verify the complete system
-- 2. The vector similarity query (section 6) requires pgvector extension
-- 3. All queries are read-only and safe to run in production
-- 4. Expected results for a healthy system:
--    - 14 sections in JSON data
--    - 14 chunks created
--    - 100% embedding coverage
--    - All expected section titles present