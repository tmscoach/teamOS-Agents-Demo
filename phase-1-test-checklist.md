# Phase 1 Testing Checklist

## Core Infrastructure Tests

### 1. ✅ JSON Report Endpoint
- **Tool**: `tms_get_json_report`
- **Test in**: Admin Panel → DEBRIEF section
- **Parameters**: `subscriptionId: 21989`
- **Expected**: Returns JSON with sections array

### 2. Database Schema
Run in Supabase SQL Editor:
```sql
-- Check if column exists
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'UserReport' 
  AND column_name = 'jsonData'
) as json_column_exists;
```

If false, run migration:
```sql
ALTER TABLE "UserReport" ADD COLUMN "jsonData" JSON;
```

### 3. Test processJSONReport Method
```bash
# Run the test script
npx tsx scripts/test-json-report-processing.ts
```

Expected output:
- Report created ✓
- JSON data stored ✓  
- Chunks created ✓
- Embeddings generated ✓ (if OpenAI key is set)

### 4. Test get_report_context Tool
In Admin Panel:
- **Tool**: `get_report_context` (in DEBRIEF section)
- **Parameters**: 
  ```json
  {
    "subscriptionId": "21989",
    "userId": "test-user"
  }
  ```
- **Expected**: Should check jsonData field first and return formatted report

### 5. Test Vector Search (if embeddings are enabled)
In Admin Panel:
- **Tool**: `search_report_chunks_vector`
- **Parameters**:
  ```json
  {
    "query": "major role",
    "reportId": "test-report-id"
  }
  ```
- **Expected**: Returns relevant chunks if they exist

## What's Working in Phase 1:
- [x] `tms_get_json_report` tool registered and callable
- [x] Mock endpoint returns JSON data
- [x] Tool appears in DebriefAgent's tool list
- [x] Admin interface can test the endpoint
- [x] `processJSONReport` method implemented
- [x] `get_report_context` updated to check jsonData

## What's NOT Part of Phase 1:
- UI to display JSON reports (Phase 2)
- Voice capabilities (Phase 3)
- Actual report viewer interface (Phase 2)

## Quick SQL Checks for Supabase:
```sql
-- 1. Check schema is ready
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'UserReport' 
AND column_name = 'jsonData';

-- 2. Check if any JSON reports exist
SELECT id, "subscriptionId", 
       CASE WHEN "jsonData" IS NOT NULL THEN 'Has JSON' ELSE 'No JSON' END as status
FROM "UserReport" 
LIMIT 10;

-- 3. Check if chunks exist for any reports
SELECT COUNT(*) as chunk_count, 
       COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) as with_embeddings
FROM "ReportChunk";
```

## Success Criteria for Phase 1:
✅ JSON endpoint returns structured data  
✅ Database schema supports jsonData field  
✅ processJSONReport can extract and store chunks  
✅ Tools can access JSON data when present  
✅ Vector embeddings can be generated (if API key set)  
✅ Backward compatibility maintained for HTML reports