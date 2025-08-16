# Manual Testing Guide for JSON Report Processing

## 1. Test JSON Report Retrieval ✅
- Already tested via admin panel - working correctly
- Returns structured JSON with sections and metadata

## 2. Test Vector Storage and Processing

### Option A: Create a test script
```javascript
// test-process-json.js
const { PrismaClient } = require('@/lib/generated/prisma');
const { ReportStorageService } = require('./src/lib/services/report-storage/report-storage.service');

async function testJSONProcessing() {
  const prisma = new PrismaClient();
  const service = new ReportStorageService(prisma);
  
  // Create a test report
  const report = await prisma.userReport.create({
    data: {
      userId: 'test-user-id',
      organizationId: 'test-org',
      teamId: null,
      reportType: 'TMP',
      subscriptionId: '21989',
      templateId: '6',
      rawHtml: '<html>Test</html>',
      processingStatus: 'PENDING'
    }
  });
  
  // Get JSON data
  const jsonData = {
    data: {
      subscriptionId: '21989',
      sections: [
        {
          id: 'test-section',
          title: 'Test Section',
          vectorChunk: 'This is test content for vector embedding'
        }
      ]
    }
  };
  
  // Process it
  await service.processJSONReport(report.id, jsonData);
  
  // Check results
  const chunks = await prisma.reportChunk.findMany({
    where: { reportId: report.id }
  });
  
  console.log('Created chunks:', chunks.length);
  console.log('Has embeddings:', chunks[0].embedding ? 'Yes' : 'No');
}
```

### Option B: Check via Supabase Dashboard
1. Go to Supabase Dashboard
2. Navigate to Table Editor → `UserReport`
3. Check if any records have `jsonData` field populated
4. Navigate to `ReportChunk` table
5. Check if chunks exist with embeddings

## 3. Test DebriefAgent Integration

### Via Chat Interface:
1. Go to `/chat/debrief` 
2. Start a conversation
3. Use the following test prompts:

```
"Can you get the report for subscription 21989?"
"What are the main sections of my report?"
"Search for information about my major role"
```

### Via API:
```bash
curl -X POST http://localhost:3001/api/agents/chat-streaming \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Get report context for subscription 21989",
    "agent": "DebriefAgent",
    "metadata": {
      "subscriptionId": "21989",
      "userId": "test-user"
    }
  }'
```

## 4. Test Vector Search

### Test if search_report_chunks_vector works:
```javascript
// In the debrief chat or via tool testing
{
  "tool": "search_report_chunks_vector",
  "parameters": {
    "query": "major role upholder",
    "reportId": "test-report-id"
  }
}
```

## 5. Test get_report_context Tool

The updated tool should now check jsonData first:
```javascript
{
  "tool": "get_report_context",
  "parameters": {
    "subscriptionId": "21989",
    "userId": "test-user"
  }
}
```

## 6. Database Checks in Supabase

### SQL Queries to Run in Supabase SQL Editor:

```sql
-- Check if jsonData column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'UserReport' 
AND column_name = 'jsonData';

-- Check for any reports with JSON data
SELECT id, "subscriptionId", "jsonData" IS NOT NULL as has_json 
FROM "UserReport" 
WHERE "jsonData" IS NOT NULL;

-- Check for vector chunks
SELECT rc.id, rc."reportId", rc."sectionTitle", 
       rc.embedding IS NOT NULL as has_embedding
FROM "ReportChunk" rc
JOIN "UserReport" ur ON rc."reportId" = ur.id
WHERE ur."subscriptionId" = '21989';

-- Check vector search capability (if chunks exist)
SELECT "sectionTitle", content
FROM "ReportChunk"
WHERE embedding <-> (
  SELECT embedding FROM "ReportChunk" LIMIT 1
) < 0.5
LIMIT 5;
```

## 7. End-to-End Flow Test

1. **Create Report with JSON**:
   - Use admin panel to retrieve JSON report
   - Store it with processJSONReport method
   
2. **Search the Report**:
   - Use DebriefAgent to search for content
   - Verify vector search returns relevant chunks
   
3. **Get Full Context**:
   - Use get_report_context tool
   - Verify it returns formatted JSON sections

## Things to Verify:

- [x] JSON report endpoint returns data
- [ ] jsonData column exists in database (may need migration)
- [ ] Vector embeddings are generated (requires OpenAI API key)
- [ ] Report chunks are searchable
- [ ] DebriefAgent can access JSON reports
- [ ] get_report_context returns JSON data properly

## Notes:
- The jsonData column won't exist in Supabase until migration is run
- Vector embeddings require OPENAI_API_KEY to be set
- Mock data doesn't persist to Supabase - only in-memory