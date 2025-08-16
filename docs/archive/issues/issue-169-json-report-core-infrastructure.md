# Issue 169: JSON Report Core Infrastructure Implementation Plan

**Issue Link**: https://github.com/tmscoach/teamOS-Agents-Demo/issues/169
**Parent Epic**: #168 - JSON Report Viewer with AI-Powered Voice/Text Debrief
**Related Issues**: #170 (Phase 2 - UI), #171 (Phase 3 - Voice), #172 (Phase 4 - Admin/Polish)

## Executive Summary

Implement the core backend infrastructure for retrieving, processing, and storing JSON reports with vector embeddings. This is Phase 1 of a 4-phase epic to create a comprehensive JSON report viewing system with AI-powered debrief capabilities.

## Context from Epic

The full system will enable:
1. **Phase 1 (This Issue)**: Backend infrastructure for JSON reports with vector storage
2. **Phase 2**: Interactive React-based report viewer with chat integration
3. **Phase 3**: Voice capabilities for natural conversation about reports
4. **Phase 4**: Admin testing interface and production polish

## Implementation Plan

### Task 1: Add TMS Tool Definition
**File**: `/src/lib/agents/tools/tms-tool-registry.ts`

Add new tool definition:
```typescript
tms_get_json_report: {
  name: 'tms_get_json_report',
  description: 'Retrieve JSON format assessment report',
  category: 'debrief',
  endpoint: '/api/v2/reports/{subscriptionId}',
  method: 'GET',
  requiresAuth: true,
  parameters: {
    type: 'object',
    properties: {
      subscriptionId: {
        type: 'string',
        description: 'The subscription ID for the completed assessment'
      }
    },
    required: ['subscriptionId']
  }
}
```

Update `getToolsForAgent` to include in DebriefAgent's tools.

### Task 2: Create Mock JSON Reports Endpoint
**New File**: `/src/lib/mock-tms-api/endpoints/json-reports.ts`

```typescript
import { TMSErrorResponse } from '../types';
import * as fs from 'fs/promises';
import * as path from 'path';

export async function getJSONReport(options: {
  endpoint: string;
  jwt?: string;
}): Promise<any> {
  // Extract subscriptionId from endpoint
  // Validate JWT
  // Load template from /docs/tms-api-spec/examples/tmp-report-response-complete.json
  // Customize with subscriptionId
  // Return JSON report data
}
```

### Task 3: Update Mock API Client Routing
**File**: `/src/lib/mock-tms-api/mock-api-client.ts`

Add to handlers object:
```typescript
'GET:/api/v2/reports/*': () => import('./endpoints/json-reports').then(m => m.getJSONReport)
```

### Task 4: Database Schema Update
**File**: `/prisma/schema.prisma`

Add to UserReport model:
```prisma
model UserReport {
  // ... existing fields ...
  jsonData         Json?      // New field for storing JSON report data
  // ... rest of fields ...
}
```

Run migration:
```bash
npx prisma migrate dev --name add-json-data-to-user-report
```

### Task 5: JSON Report Processing Service
**File**: `/src/lib/services/report-storage/report-storage.service.ts`

Add new method:
```typescript
async processJSONReport(reportId: string, jsonData: any): Promise<void> {
  // Extract text content from each section
  const sections = jsonData.data.sections;
  
  for (const section of sections) {
    // Extract meaningful text for embedding
    let content = '';
    if (section.content?.text) {
      content = section.content.text;
    } else if (section.content?.subsections) {
      // Concatenate subsection content
    }
    
    // Generate embedding using existing method
    const embedding = await this.generateEmbedding(content);
    
    // Store in ReportChunk table
    await this.prisma.reportChunk.create({
      data: {
        reportId,
        sectionId: section.id,
        sectionTitle: section.title,
        content,
        chunkIndex: section.order,
        charCount: content.length,
        embedding,
        metadata: {
          sectionType: section.type,
          hasVisualization: !!section.visualization
        }
      }
    });
  }
  
  // Update report with jsonData
  await this.prisma.userReport.update({
    where: { id: reportId },
    data: { 
      jsonData,
      processingStatus: 'COMPLETED',
      processedAt: new Date()
    }
  });
}
```

### Task 6: Integration Points

1. **Update existing tools to check jsonData**:
   - `get_report_context` should check jsonData field first
   - `search_report_chunks_vector` already works with ReportChunk table

2. **Ensure backward compatibility**:
   - Keep HTML report functionality intact
   - Check jsonData before falling back to HTML

### Task 7: Testing

1. **Unit Tests**:
   - Test JSON report endpoint handler
   - Test JSON processing service
   - Test vector embedding generation

2. **Integration Tests**:
   - End-to-end test retrieving JSON report
   - Test vector search on JSON chunks
   - Test DebriefAgent with JSON reports

3. **Manual Testing**:
   - Use admin panel to generate test report
   - Verify chunks are searchable
   - Test with DebriefAgent in chat

## Technical Considerations

1. **JSON Structure**: Based on template, sections contain:
   - `id`: Unique section identifier
   - `type`: visual, content, summary
   - `title`: Section heading
   - `content`: Text content or subsections
   - `visualization`: Chart data if applicable

2. **Vector Chunks**: Extract from:
   - Section content.text
   - Subsection content
   - Key insights
   - Recommendations

3. **Storage Strategy**:
   - Full JSON in jsonData column for future use
   - Extracted text in ReportChunk for search
   - Maintain HTML for backward compatibility

## Success Metrics

- [x] JSON report endpoint accessible via TMS tool
- [x] JSON data stored in database
- [x] Vector chunks generated and searchable
- [x] Existing tools work with JSON reports
- [x] All tests passing
- [x] Foundation ready for Phase 2 UI

## Risk Mitigation

- Test with actual JSON template early
- Ensure vector chunks are meaningful
- Maintain backward compatibility
- Document API changes clearly

## Next Steps After Completion

- Phase 2 (#170): Build interactive UI
- Phase 3 (#171): Add voice capabilities
- Phase 4 (#172): Admin tools and polish