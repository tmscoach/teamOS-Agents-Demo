# Voice Agent Search Bug

## Issue Description
The voice agent cannot retrieve specific information from TMP reports due to database query errors in the search-report-chunks API endpoint.

## Error Details
From server logs:
```
[Voice Tool: search-report-chunks] Database error: Error [PrismaClientValidationError]: 
Invalid `prisma.reportChunk.findMany()` invocation
```

## Root Causes

### 1. Prisma Query Mode Issue
- Using `mode: 'insensitive'` in contains filter causes validation error
- Lines 49-50 in `/app/api/voice-tools/search-report-chunks/route.ts`

### 2. Non-existent Field Reference
- Code references `pageNumber` field on line 60
- ReportChunk model doesn't have this field (checked schema.prisma)
- Only has `metadata` field which might contain page information

## Database Schema
```prisma
model ReportChunk {
  id           String    @id @default(dbgenerated("(gen_random_uuid())::text"))
  reportId     String
  sectionId    String
  sectionTitle String
  content      String
  chunkIndex   Int
  charCount    Int
  embedding    Unsupported("vector")?
  metadata     Json?
  createdAt    DateTime  @default(now())
  UserReport   UserReport @relation(fields: [reportId], references: [id], onDelete: Cascade)
}
```

## Fix Implementation

### Changes to `/app/api/voice-tools/search-report-chunks/route.ts`:

1. Remove `mode: 'insensitive'` from query
2. Use lowercase comparison for case-insensitive search
3. Remove `pageNumber` from select statement
4. Extract page info from metadata if needed

### Before:
```typescript
OR: [
  { content: { contains: query, mode: 'insensitive' } },
  { sectionTitle: { contains: query, mode: 'insensitive' } }
]
...
select: {
  content: true,
  sectionTitle: true,
  pageNumber: true,  // <-- This field doesn't exist
  metadata: true
}
```

### After:
```typescript
OR: [
  { content: { contains: query.toLowerCase() } },
  { sectionTitle: { contains: query.toLowerCase() } }
]
...
select: {
  content: true,
  sectionTitle: true,
  metadata: true
}
```

## Testing Plan
1. Test voice agent search with various queries
2. Verify it can find TMP report sections
3. Ensure metadata is properly returned
4. Test case-insensitive search works