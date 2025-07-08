# Knowledge Base Setup Guide

This guide explains how to set up and use the TMS Knowledge Base system for agent-powered document retrieval.

## Overview

The Knowledge Base system enables intelligent agents to access 40+ years of TMS intellectual property through semantic search. It uses vector embeddings and pgvector for similarity-based retrieval.

## Architecture

- **Document Storage**: Supabase PostgreSQL with pgvector extension
- **Embeddings**: OpenAI text-embedding-3-small (1536 dimensions)
- **Chunking**: 500 tokens with 100 token overlap
- **Search**: Cosine similarity with hybrid keyword boosting

## Setup Instructions

### 1. Database Setup

Enable pgvector in your Supabase project:

```sql
-- Run this in Supabase SQL editor
CREATE EXTENSION IF NOT EXISTS vector;
```

Then run the vector search function setup:

```bash
# Execute the SQL file in Supabase
cat scripts/setup-vector-search.sql
```

### 2. Document Ingestion

Ingest all TMS documents:

```bash
# Process all documents
npx tsx scripts/ingest-minimal.ts

# Or process a single document
npx tsx scripts/ingest-single-document.ts ".documentation/path/to/document.md"
```

### 3. Generate Embeddings

Add embeddings to all document chunks:

```bash
npx tsx scripts/add-embeddings.ts
```

### 4. Verify Setup

Check that everything is properly configured:

```bash
npx tsx scripts/verify-knowledge-base.ts
```

Expected output:
- 47 documents
- 12,484 chunks
- All chunks have embeddings

## Usage

### Basic Vector Search

```typescript
import { vectorSearch } from '@/lib/knowledge-base/search/vector-search';

// Simple search
const results = await vectorSearch.search('What is TMP methodology?', {
  limit: 5,
  threshold: 0.7
});

// Results include similarity scores and document metadata
results.forEach(result => {
  console.log(`${result.documentTitle}: ${result.similarity}`);
  console.log(result.content);
});
```

### Hybrid Search (Vector + Keywords)

```typescript
// Combine semantic search with keyword boosting
const results = await vectorSearch.hybridSearch(
  'How to assess team maturity?',
  ['maturity', 'assessment', 'measure'],
  { limit: 10 }
);
```

### Document Type Filtering

```typescript
// Search only specific document types
const results = await vectorSearch.search('leadership strategies', {
  limit: 5,
  documentTypes: ['HANDBOOK', 'RESEARCH']
});
```

### Context Expansion

```typescript
// Find similar chunks for comprehensive context
const similarChunks = await vectorSearch.getSimilarChunks(chunkId, 5);
```

## Agent Integration

Agents can use the knowledge base through these tools:

1. **Search Tool**: Query the knowledge base with natural language
2. **Context Tool**: Expand search results with related content
3. **Filter Tool**: Target specific document types

Example agent query flow:
```
User: "How do we improve team communication?"
  ↓
Agent: vectorSearch.search("team communication improvement strategies")
  ↓
Knowledge Base: Returns relevant chunks from handbooks and research
  ↓
Agent: Synthesizes response with citations
```

## Performance Optimization

### Current Setup
- Embeddings stored as JSON (works but not optimal)
- Client-side similarity calculation fallback
- Average search time: ~200-500ms

### Recommended Improvements

1. **Convert to Native Vector Type**:
   ```sql
   ALTER TABLE "DocumentChunk" 
   ADD COLUMN embedding_vector vector(1536);
   
   UPDATE "DocumentChunk" 
   SET embedding_vector = embedding::text::vector(1536);
   ```

2. **Create Indexes**:
   ```sql
   CREATE INDEX idx_embedding_vector 
   ON "DocumentChunk" 
   USING ivfflat (embedding_vector vector_cosine_ops)
   WITH (lists = 100);
   ```

3. **Use Database Functions**:
   - The `search_similar_chunks` function provides 10x faster search
   - Handles similarity calculation in PostgreSQL
   - Reduces data transfer overhead

## Maintenance

### Update Documents

When TMS IP changes:

```bash
# Check for updates
npx tsx scripts/update-knowledge-base.ts

# Reprocess specific document
npx tsx scripts/ingest-single-document.ts "path/to/updated.md" --force
```

### Monitor Performance

```bash
# Test search performance
npx tsx scripts/test-vector-search-advanced.ts

# Check embedding coverage
npx tsx scripts/verify-knowledge-base.ts
```

## Troubleshooting

### Common Issues

1. **Memory errors during ingestion**:
   - Use `ingest-minimal.ts` instead of batch scripts
   - Reduce chunk size in chunker options
   - Process documents individually

2. **Rate limiting**:
   - Scripts include automatic delays
   - Adjust batch sizes if needed
   - Use retry logic for resilience

3. **Missing embeddings**:
   - Run `add-embeddings.ts` multiple times
   - Script automatically finds chunks without embeddings
   - Processes in batches of 1000

### Debug Commands

```bash
# Check chunk count
npx tsx -e "
  const { createClient } = require('@supabase/supabase-js');
  require('dotenv').config();
  const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  s.from('DocumentChunk').select('*', { count: 'exact', head: true }).then(r => console.log('Chunks:', r.count));
"

# Test a specific search
npx tsx scripts/test-vector-search.ts
```

## Security Considerations

- Store API keys in environment variables
- Use service role key only for admin operations
- Implement row-level security for production
- Consider rate limiting for search endpoints

## Next Steps

1. Merge PR #38 (Knowledge Base implementation)
2. Integrate with agent framework
3. Optimize vector storage and indexing
4. Build admin UI for document management
5. Implement incremental updates