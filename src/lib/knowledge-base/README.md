# TMS Knowledge Base System

The Knowledge Base system enables agents to access and retrieve information from 40+ years of TMS intellectual property using semantic search powered by vector embeddings.

## Features

- **Document Ingestion**: Parses and chunks markdown documents from the `.documentation/` folder
- **Vector Search**: Semantic search using OpenAI embeddings and pgvector
- **Hybrid Search**: Combines vector similarity with keyword matching
- **Agent Tools**: Pre-built tools for agents to query the knowledge base
- **Citation Tracking**: All results include source citations

## Setup

### 1. Database Setup

Enable pgvector extension in your Supabase database:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Run the setup script to create indexes:

```bash
psql $DATABASE_URL < scripts/setup-pgvector.sql
```

### 2. Environment Variables

Ensure these are set in your `.env` file:

```env
DATABASE_URL=your_supabase_url
OPENAI_API_KEY=your_openai_key
```

### 3. Run Database Migration

```bash
npm run db:migrate
```

## Usage

### Ingesting Documents

To process and index all TMS documentation:

```bash
npx tsx scripts/ingest-documents.ts
```

### Using in Agents

```typescript
import { knowledgeBaseTools } from '@/lib/knowledge-base';

// Add tools to your agent
const agent = new MyAgent({
  tools: [...knowledgeBaseTools]
});

// Agent can now use tools like:
// - search_tms_knowledge
// - get_assessment_methodology
// - get_questionnaire_items
// - search_intervention_strategies
// - get_benchmark_data
```

### Direct Search

```typescript
import { KnowledgeBaseSearch } from '@/lib/knowledge-base';

const search = new KnowledgeBaseSearch();

// Semantic search
const results = await search.search('team communication strategies', {
  documentTypes: ['HANDBOOK', 'RESEARCH'],
  limit: 5
});

// Hybrid search with keywords
const hybridResults = await search.hybridSearch(
  'leadership development',
  ['leadership', 'development', 'training'],
  { limit: 10 }
);

// Get specific questionnaire items
const questions = await search.getQuestionnaireItems('TMP', 'Leadership');

await search.close();
```

## Architecture

### Components

1. **Document Parser** (`ingestion/parser.ts`)
   - Extracts metadata and structure from markdown files
   - Identifies document types and assessment types
   - Extracts questionnaire items

2. **Document Chunker** (`ingestion/chunker.ts`)
   - Intelligently chunks documents preserving context
   - Configurable chunk size and overlap
   - Section-aware chunking

3. **Embedding Service** (`ingestion/embeddings.ts`)
   - Generates embeddings using OpenAI text-embedding-3-small
   - Batch processing for efficiency
   - Context-aware embedding preparation

4. **Search Service** (`retrieval/search.ts`)
   - Vector similarity search using pgvector
   - Hybrid search combining vectors and keywords
   - Structured retrieval for questionnaires

5. **Agent Tools** (`tools/agent-tools.ts`)
   - Pre-configured tools for agent integration
   - Consistent interface for knowledge retrieval
   - Built-in error handling

## Performance

- Query response time: < 500ms (p95)
- Chunk size: 500-1000 tokens optimal
- Embedding dimension: 1536 (OpenAI standard)
- Batch processing: 100 documents at a time

## Testing

Run the test suite:

```bash
npm test src/lib/knowledge-base/__tests__/
```

Manual testing:

```bash
npx tsx scripts/test-knowledge-base.ts
```