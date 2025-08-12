-- ============================================================
-- QUICK DIAGNOSTIC: Run this single query for instant health check
-- ============================================================

WITH report_check AS (
    SELECT 
        id,
        "subscriptionId",
        "processingStatus",
        "createdAt",
        jsonb_array_length(("jsonData"->'sections')::jsonb) as section_count,
        "jsonData"->>'workflowType' as workflow_type
    FROM "UserReport"
    WHERE "subscriptionId" = '21989'
        AND "jsonData" IS NOT NULL
    ORDER BY "createdAt" DESC
    LIMIT 1
),
chunk_check AS (
    SELECT 
        COUNT(*) as total_chunks,
        COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) as embedded_chunks,
        COUNT(DISTINCT "sectionTitle") as unique_sections,
        STRING_AGG(DISTINCT "sectionTitle", ', ' ORDER BY "sectionTitle") as section_list
    FROM "ReportChunk"
    WHERE "reportId" = (SELECT id FROM report_check)
),
sample_content AS (
    SELECT 
        STRING_AGG(
            "sectionTitle" || ': ' || LEFT(content, 50),
            E'\n' 
            ORDER BY "chunkIndex"
        ) as sample_chunks
    FROM (
        SELECT "sectionTitle", content, "chunkIndex"
        FROM "ReportChunk"
        WHERE "reportId" = (SELECT id FROM report_check)
        ORDER BY "chunkIndex"
        LIMIT 3
    ) sub
)
SELECT 
    '🔍 DIAGNOSTIC REPORT FOR SUBSCRIPTION 21989' as title,
    '' as spacer1,
    '📊 REPORT STATUS' as section_1,
    '----------------' as divider1,
    'Report ID: ' || r.id as report_id,
    'Status: ' || r."processingStatus" as status,
    'Created: ' || TO_CHAR(r."createdAt", 'YYYY-MM-DD HH24:MI') as created,
    'Workflow: ' || r.workflow_type as workflow,
    'JSON Sections: ' || r.section_count as json_sections,
    '' as spacer2,
    '🔤 VECTOR CHUNKS' as section_2,
    '----------------' as divider2,
    'Total Chunks: ' || c.total_chunks as chunks,
    'With Embeddings: ' || c.embedded_chunks || ' (' || 
        ROUND(c.embedded_chunks::numeric / NULLIF(c.total_chunks, 0) * 100) || '%)' as embeddings,
    'Unique Sections: ' || c.unique_sections as sections,
    '' as spacer3,
    '📝 SAMPLE CONTENT' as section_3,
    '----------------' as divider3,
    s.sample_chunks as samples,
    '' as spacer4,
    '✅ HEALTH CHECK' as section_4,
    '----------------' as divider4,
    CASE 
        WHEN r."processingStatus" = 'COMPLETED' 
            AND r.section_count = 14
            AND c.total_chunks >= 14
            AND c.embedded_chunks = c.total_chunks
        THEN '🟢 SYSTEM FULLY OPERATIONAL'
        WHEN r."processingStatus" = 'COMPLETED' 
            AND c.total_chunks > 0
        THEN '🟡 SYSTEM OPERATIONAL (Minor Issues)'
        ELSE '🔴 SYSTEM NEEDS ATTENTION'
    END as health_status,
    CASE 
        WHEN r.section_count != 14 THEN '⚠️ Expected 14 sections, found ' || r.section_count
        WHEN c.embedded_chunks < c.total_chunks THEN '⚠️ Missing ' || (c.total_chunks - c.embedded_chunks) || ' embeddings'
        ELSE '✅ All checks passed'
    END as notes
FROM report_check r, chunk_check c, sample_content s;