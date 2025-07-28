# Report Storage Architecture

## Overview

The report storage system has been redesigned to process and store all report assets (HTML, images, text chunks) immediately when reports are generated, rather than using a complex proxy system at display time.

## Architecture Flow

### 1. Report Generation (Admin Test Page)
When a report is generated via `/admin/tms-api-test`:

1. **TMS API Call**: The system calls the TMS API to generate the HTML report
2. **Immediate Storage**: The HTML is sent to `/api/reports/store` with:
   - `processImmediately: true` flag
   - JWT token for authentication
3. **Synchronous Processing**: The system waits for all processing to complete

### 2. Report Processing Pipeline

The `ReportStorageService` processes reports through these steps:

1. **Extract Metadata**: Parse HTML to extract:
   - Report title and user information
   - Sections and structure
   - Scores and profile data

2. **Download Images**: The `ImageDownloadService`:
   - Extracts all image URLs from HTML
   - Decodes HTML entities (`&amp;` → `&`)
   - Downloads each image using the JWT token
   - Uploads images to Supabase storage bucket `report-images`
   - Returns a map of original URL → storage path

3. **Store Image Records**: Save image metadata in database:
   - Original URL
   - Storage path in Supabase
   - Image type (wheel, graph, asset)
   - Alt text for accessibility

4. **Replace Image URLs**: Update HTML to use local URLs:
   - Replace TMS API URLs with `/api/reports/images/{path}`
   - These URLs serve images directly from Supabase

5. **Extract Text Chunks**: Break report into searchable chunks:
   - Parse HTML sections
   - Create chunks with metadata
   - Store for future vector search

6. **Update Report Status**: Mark as COMPLETED with processed HTML

### 3. Report Display (Debrief Interface)

When displaying reports in `/chat/debrief`:

1. **Load Stored Report**: Fetch from database with processed HTML
2. **Serve Images**: Images load from `/api/reports/images/[...path]`
3. **No Proxy Needed**: All assets are local, no authentication required

## Benefits

1. **Performance**: Images load instantly from Supabase
2. **Reliability**: No complex proxy or authentication at display time
3. **Searchability**: Text chunks ready for vector search
4. **Offline Access**: Reports work even if TMS API is down

## Database Schema

```prisma
model UserReport {
  id               String   @id
  userId           String
  rawHtml          String   // Original HTML from TMS
  processedHtml    String?  // HTML with local image URLs
  processingStatus ProcessingStatus
  // ... other fields
}

model ReportImage {
  id          String @id
  reportId    String
  originalUrl String // TMS API URL
  storagePath String // Supabase path
  imageType   String // wheel, graph, asset
  // ... other fields
}

model ReportChunk {
  id            String @id
  reportId      String
  sectionTitle  String
  content       String
  // ... other fields
}
```

## Supabase Storage

Images are stored in the `report-images` bucket:
- Public access for reading
- Organized by report ID: `reports/{reportId}/{filename}`
- Supports PNG, JPEG, GIF, SVG formats

## Testing

1. Navigate to `/admin/tms-api-test`
2. Generate a JWT token
3. Test "TMP HTML Report" with subscription ID 21989
4. Check console for "Report stored successfully" message
5. View report in `/chat/debrief` - images should load immediately

## Future Enhancements

1. **Vector Embeddings**: Generate embeddings for text chunks
2. **Image Optimization**: Resize and compress images
3. **CDN Integration**: Serve images through CDN
4. **Batch Processing**: Process multiple reports in parallel