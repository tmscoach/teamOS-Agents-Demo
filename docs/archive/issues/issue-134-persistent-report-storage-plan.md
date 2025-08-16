# Issue #134: Persistent Report Storage Implementation Plan

GitHub Issue: https://github.com/tmscoach/teamOS-Agents-Demo/issues/134

## Overview
Implement persistent report storage with vector search and role-based access control. This builds upon the existing in-memory report context service from issue #121.

## Current State Analysis
- **Existing**: In-memory report context service (issue #121)
- **Database**: PostgreSQL with pgvector extension
- **ORM**: Prisma
- **Vector Search**: Already implemented for TMS Knowledge documents
- **Auth**: Clerk for user management with organization support

## Implementation Plan - Phase 1: Basic Storage

### 1. Database Schema Updates

#### 1.1 Create Prisma Schema Models
Add to `prisma/schema.prisma`:
- UserReport model
- ReportImage model  
- ReportChunk model
- ReportAccessLog model

#### 1.2 Create Migration
- Generate Prisma migration
- Add indexes for performance
- Add RLS policies for security

### 2. Report Storage Service

#### 2.1 Create Report Storage Service
`src/lib/services/report-storage/report-storage.service.ts`
- Store raw HTML reports
- Extract metadata
- Handle report lifecycle

#### 2.2 Image Download Service
`src/lib/services/report-storage/image-download.service.ts`
- Download images from TMS API
- Store in Supabase storage
- Update HTML with local URLs

#### 2.3 Report Processing Service
`src/lib/services/report-storage/report-processing.service.ts`
- Parse HTML sections
- Extract text content
- Create chunks for vector search
- Generate embeddings

### 3. API Endpoints

#### 3.1 Report Storage API
`app/api/reports/store/route.ts`
- POST endpoint to store reports
- Trigger async processing
- Return report ID

#### 3.2 Report Retrieval API
`app/api/reports/[id]/route.ts`
- GET endpoint for reports
- Check access permissions
- Include processed HTML

#### 3.3 Report Search API
`app/api/reports/search/route.ts`
- Search within user reports
- Vector similarity search
- Return relevant chunks

### 4. Integration Points

#### 4.1 Update Report Loader
Modify `src/lib/services/report-loader.ts`:
- Check for existing stored report
- Store new reports automatically
- Use processed HTML with local images

#### 4.2 Update Debrief Agent
Enhance debrief agent to:
- Query stored reports
- Use vector search for context
- Cite specific sections

### 5. UI Components

#### 5.1 Report Storage Status
Add to report viewer:
- Storage status indicator
- Processing progress
- Retry failed processing

#### 5.2 Report History
Create history view:
- List stored reports
- Filter by type and date
- Access historical snapshots

## Implementation Steps (Phase 1 Only)

### Step 1: Database Setup
1. Update Prisma schema with new models
2. Generate and run migration
3. Create Supabase storage bucket for images

### Step 2: Core Services
1. Implement report storage service
2. Create image download service  
3. Build basic processing pipeline

### Step 3: API Layer
1. Create storage endpoint
2. Implement retrieval endpoint
3. Add basic search capability

### Step 4: Integration
1. Update report loader to use storage
2. Add storage trigger to TMS test page
3. Update debrief chat to show stored reports

### Step 5: Testing
1. Unit tests for services
2. Integration tests for full flow
3. Manual testing via admin interface

## Technical Decisions

### Storage Strategy
- Store raw HTML in database (text field)
- Store images in Supabase storage
- Use CDN URLs for image serving

### Processing Approach
- Async processing with status tracking
- Graceful fallback to in-memory if storage fails
- Retry mechanism for failed processing

### Access Control
- Use Clerk userId for ownership
- Check team membership for managers
- Log all access for audit trail

### Vector Search
- Reuse existing vector search infrastructure
- Same embedding model as knowledge base
- Separate collection for report chunks

## Success Criteria for Phase 1

1. ✅ Reports stored in database
2. ✅ Images downloaded and accessible
3. ✅ Basic search functionality working
4. ✅ Integration with existing report viewer
5. ✅ All tests passing

## Future Phases (Not in Current Scope)

- Phase 2: Advanced processing pipeline
- Phase 3: Full vector search integration
- Phase 4: Agent enhancement
- Phase 5: Complete access control

## Risks and Mitigations

1. **Large HTML Storage**: Use text compression if needed
2. **Image Download Failures**: Implement retry with exponential backoff
3. **Processing Timeouts**: Use background jobs for large reports
4. **Access Control Complexity**: Start simple, enhance later

## Testing Strategy

### Unit Tests
- Report storage service methods
- Image download with mocks
- HTML parsing logic

### Integration Tests  
- Full storage flow
- Report retrieval with permissions
- Search functionality

### E2E Tests
- Store report via UI
- View stored report
- Search within reports

## Development Order

1. Database schema and migration
2. Basic storage service
3. Storage API endpoint
4. Update report loader integration
5. Add UI indicators
6. Write tests
7. Documentation