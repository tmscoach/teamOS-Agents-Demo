# Report Storage System

This document describes the persistent report storage system implemented as part of Phase 1 of issue #134.

## Overview

The report storage system provides persistent storage for TMS reports (TMP, QO2, Team Signals) with the following capabilities:

- Automatic storage when reports are loaded
- Asynchronous processing of HTML and images
- Text extraction and chunking for future vector search
- Role-based access control foundation
- Report history and retrieval

## Architecture

### Database Schema

Four new tables have been added:

1. **UserReport** - Stores the main report data
   - Raw HTML from TMS API
   - Processed HTML with local image URLs
   - Metadata (title, user info, scores, etc.)
   - Processing status tracking

2. **ReportImage** - Stores image metadata
   - Original URLs from TMS API
   - Local storage paths
   - Image types (wheel, graph, asset)
   - Alt text for accessibility

3. **ReportChunk** - Stores text chunks for search
   - Section-based chunking
   - Character counts
   - Vector embeddings (placeholder)
   - Metadata for context

4. **ReportAccessLog** - Audit trail
   - Who accessed what report
   - Access type (view, search, share)
   - Timestamps

### Services

1. **ReportStorageService** (`src/lib/services/report-storage/report-storage.service.ts`)
   - Main service for storing and retrieving reports
   - Handles async processing pipeline
   - Manages access control and logging

2. **ReportProcessingService** (`src/lib/services/report-storage/report-processing.service.ts`)
   - Extracts metadata from HTML
   - Parses sections and creates chunks
   - Replaces image URLs with local paths

3. **ImageDownloadService** (`src/lib/services/report-storage/image-download.service.ts`)
   - Downloads images from TMS API (placeholder)
   - Generates storage paths
   - Extracts image metadata

### API Endpoints

1. **POST /api/reports/store** - Store a new report
2. **GET /api/reports/[id]** - Retrieve a stored report
3. **POST /api/reports/search** - Search within reports

### Integration

The `ReportLoader` service has been updated to automatically store reports when they are loaded from the TMS API. This ensures all reports are persisted without requiring user action.

## Usage

### Automatic Storage

When a report is loaded via the debrief interface or TMS API test page, it is automatically stored:

```typescript
// In ReportLoader.loadReport()
const storeResponse = await fetch('/api/reports/store', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    reportType,
    subscriptionId,
    templateId,
    rawHtml: html,
    organizationId: 'default',
    teamId: managerId
  })
});
```

### Retrieving Reports

```typescript
// Get a stored report
const response = await fetch(`/api/reports/${reportId}`);
const { report } = await response.json();
```

### Searching Reports

```typescript
// Search within user's reports
const response = await fetch('/api/reports/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'team performance',
    reportTypes: ['TMP', 'QO2'],
    limit: 10
  })
});
```

## Current Limitations

This is Phase 1 implementation with the following limitations:

1. **Image Storage**: Images are not actually downloaded yet (placeholder implementation)
2. **Vector Search**: Embeddings are not generated yet (text search only)
3. **Access Control**: Basic user-level access only (no team manager access yet)
4. **UI Integration**: Limited UI indicators for storage status

## Future Phases

- Phase 2: Full image download and storage in Supabase
- Phase 3: Vector embeddings and semantic search
- Phase 4: Enhanced agent integration
- Phase 5: Complete role-based access control

## Testing

Unit tests have been created for the core services:
- `report-processing.service.test.ts`
- `report-storage.service.test.ts`

Manual testing can be done via:
1. `/admin/tms-api-test` - Generate and store reports
2. `/chat/debrief` - View stored reports
3. API endpoints - Direct API testing

## Security Considerations

- All report access is logged
- User can only access their own reports
- Clerk authentication required for all endpoints
- SQL injection prevention via Prisma ORM
- Future: Team-based access control