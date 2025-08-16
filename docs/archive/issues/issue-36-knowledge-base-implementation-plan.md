# Issue #36: Knowledge Base System - Implementation Plan

**Issue URL**: https://github.com/teamOS-Agents-Demo/issues/36

## Executive Summary

The Knowledge Base System is a critical component that enables agents to access and retrieve information from 40+ years of TMS intellectual property. Without this system, agents cannot provide meaningful, IP-traceable guidance to managers. This implementation plan outlines a comprehensive approach to building a vector-based knowledge retrieval system integrated with the existing agent framework.

## Current State Analysis

### What We Have
- ✅ Agent framework (Issue #26) with tool execution capability
- ✅ OpenAI integration for embeddings generation
- ✅ Supabase database configured and ready
- ✅ TMS documentation organized in `/.documentation/` folder
- ✅ Clear understanding of TMS methodology from analysis phase

### What We Need
- 🔴 Document ingestion pipeline
- 🔴 Vector storage for semantic search
- 🔴 Structured metadata extraction
- 🔴 Agent-accessible retrieval tools
- 🔴 Citation tracking system

## Technical Architecture

### 1. Storage Design

```typescript
// Supabase Tables (using pgvector extension)

// Main documents table
create table documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source_path text unique not null,
  document_type text not null, -- 'handbook', 'questionnaire', 'report', 'research'
  content text not null,
  metadata jsonb,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

// Document chunks for vector search
create table document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  embedding vector(1536), -- OpenAI embedding dimension
  metadata jsonb, -- section, headers, context
  created_at timestamp default now()
);

// Create vector similarity search function
create index on document_chunks 
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

// Questionnaires special handling
create table questionnaire_items (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id),
  question_id text not null,
  question_text text not null,
  response_options jsonb,
  scoring_formula text,
  category text,
  metadata jsonb
);
```

### 2. Document Processing Pipeline

```typescript
// src/lib/knowledge-base/ingestion/pipeline.ts

interface DocumentProcessor {
  // Main pipeline stages
  async ingestDocuments(folderPath: string): Promise<void> {
    // 1. Scan documentation folders
    const documents = await this.scanDocumentFolder(folderPath);
    
    // 2. Parse each document
    for (const doc of documents) {
      const parsed = await this.parseDocument(doc);
      
      // 3. Extract metadata
      const metadata = await this.extractMetadata(parsed);
      
      // 4. Chunk for embeddings
      const chunks = await this.chunkDocument(parsed, metadata);
      
      // 5. Generate embeddings
      const embeddedChunks = await this.generateEmbeddings(chunks);
      
      // 6. Store in database
      await this.storeDocument(parsed, embeddedChunks, metadata);
    }
  }
}
```

### 3. Chunking Strategy

```typescript
interface ChunkingStrategy {
  // Smart chunking based on document structure
  chunkDocument(content: string, metadata: DocumentMetadata): Chunk[] {
    // 1. Preserve logical sections (don't split mid-section)
    // 2. Include context (previous/next section headers)
    // 3. Optimal chunk size: 500-1000 tokens
    // 4. Overlap: 10-20% between chunks
    // 5. Special handling for:
    //    - Tables (keep together)
    //    - Questionnaires (chunk by question)
    //    - Formulas (preserve complete formula)
  }
}
```

### 4. Agent Integration Tools

```typescript
// src/lib/agents/tools/knowledge-base.ts

export const knowledgeBaseTools: AgentTool[] = [
  {
    name: 'search_tms_knowledge',
    description: 'Search TMS knowledge base using natural language',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Natural language search query' },
        document_types: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Filter by document types'
        },
        limit: { type: 'number', default: 5 }
      },
      required: ['query']
    },
    execute: async (params, context) => {
      // Semantic search implementation
    }
  },
  
  {
    name: 'get_assessment_methodology',
    description: 'Retrieve specific assessment methodology details',
    parameters: {
      type: 'object',
      properties: {
        assessment_type: { 
          type: 'string', 
          enum: ['TMP', 'QO2', 'WoWV', 'LLP'] 
        },
        section: { type: 'string' }
      },
      required: ['assessment_type']
    },
    execute: async (params, context) => {
      // Structured retrieval
    }
  },
  
  {
    name: 'get_questionnaire_items',
    description: 'Retrieve questionnaire questions and scoring',
    parameters: {
      type: 'object',
      properties: {
        assessment_type: { type: 'string' },
        category: { type: 'string' },
        question_ids: { type: 'array', items: { type: 'string' } }
      }
    },
    execute: async (params, context) => {
      // Questionnaire retrieval
    }
  }
];
```

## Implementation Phases

### Phase 1: Infrastructure Setup (Days 1-2)
1. **Enable pgvector in Supabase**
   ```sql
   create extension if not exists vector;
   ```

2. **Create database schema**
   - Documents table
   - Chunks table with vector column
   - Questionnaire items table
   - Indexes for performance

3. **Set up project structure**
   ```
   src/lib/knowledge-base/
   ├── ingestion/
   │   ├── pipeline.ts
   │   ├── parser.ts
   │   ├── chunker.ts
   │   └── embeddings.ts
   ├── retrieval/
   │   ├── search.ts
   │   ├── filters.ts
   │   └── ranker.ts
   ├── tools/
   │   └── agent-tools.ts
   └── types/
       └── index.ts
   ```

### Phase 2: Document Ingestion (Days 3-5)
1. **Build document parser**
   - Markdown parsing with metadata extraction
   - Special handlers for tables and lists
   - Questionnaire content extraction

2. **Implement smart chunking**
   - Context-preserving chunks
   - Overlapping for continuity
   - Metadata inheritance

3. **Generate embeddings**
   - Batch processing for efficiency
   - Error handling and retries
   - Progress tracking

4. **Initial data load**
   - Process all `.documentation/` files
   - Validate ingestion quality
   - Create ingestion report

### Phase 3: Retrieval System (Days 6-8)
1. **Semantic search**
   - Vector similarity search
   - Result ranking algorithm
   - Query expansion techniques

2. **Hybrid search**
   - Combine vector + keyword search
   - Metadata filtering
   - Faceted search support

3. **Citation system**
   - Track source documents
   - Generate citations
   - Relevance scoring

### Phase 4: Agent Integration (Days 9-10)
1. **Create agent tools**
   - Search tool implementation
   - Structured retrieval tools
   - Batch query support

2. **Optimize for agents**
   - Response formatting
   - Context windowing
   - Caching layer

3. **Testing with agents**
   - Integration tests
   - Performance benchmarks
   - Accuracy validation

### Phase 5: Optimization & Polish (Days 11-12)
1. **Performance tuning**
   - Query optimization
   - Caching strategy
   - Index optimization

2. **Monitoring**
   - Query analytics
   - Performance metrics
   - Error tracking

3. **Documentation**
   - API documentation
   - Usage examples
   - Best practices

## Key Implementation Decisions

### 1. Why Supabase Vector?
- Already integrated with our stack
- No additional infrastructure
- Good performance for our scale
- Native Postgres features

### 2. Chunking Strategy
- **Size**: 500-1000 tokens optimal for context
- **Overlap**: 20% prevents information loss
- **Structure**: Preserve document hierarchy

### 3. Embedding Model
- **OpenAI text-embedding-3-small**: Good balance of performance/cost
- **Dimension**: 1536 (can be reduced if needed)
- **Batch size**: 100 documents at a time

## Testing Strategy

### 1. Unit Tests
```typescript
describe('KnowledgeBase', () => {
  test('should chunk documents preserving context');
  test('should generate valid embeddings');
  test('should retrieve relevant results');
  test('should handle questionnaire formats');
});
```

### 2. Integration Tests
- Test with real TMS documents
- Validate agent tool responses
- Measure retrieval accuracy

### 3. Performance Tests
- Query response time < 500ms (p95)
- Concurrent query handling
- Large document ingestion

## Success Metrics

1. **Coverage**: 100% of documentation indexed
2. **Accuracy**: 90%+ relevant results in top 5
3. **Performance**: < 500ms query response (p95)
4. **Reliability**: 99.9% uptime
5. **Agent Satisfaction**: Agents can answer 95%+ of TMS questions

## Risk Mitigation

1. **Large Document Volume**
   - Risk: Slow ingestion/retrieval
   - Mitigation: Implement progressive loading, caching

2. **Complex Document Formats**
   - Risk: Parsing errors
   - Mitigation: Robust error handling, manual review process

3. **Embedding Costs**
   - Risk: High OpenAI API costs
   - Mitigation: Batch processing, caching, consider alternatives

## Dependencies

- ✅ Agent Framework (Issue #26) - COMPLETE
- ✅ OpenAI Integration - COMPLETE
- ✅ Supabase Setup - COMPLETE
- 🔴 Tool Execution Framework (Issue #29) - Nice to have, not blocking

## Next Steps After Completion

Once the Knowledge Base is complete, the following issues become unblocked:
- Issue #30: Onboarding Agent
- Issue #33: Assessment Agent
- Issue #34: Analysis Agent
- Issue #35: Transformation Agent

## Estimated Timeline

**Total Duration**: 12 days
- Phase 1: 2 days (Infrastructure)
- Phase 2: 3 days (Ingestion)
- Phase 3: 3 days (Retrieval)
- Phase 4: 2 days (Integration)
- Phase 5: 2 days (Optimization)

## Example Usage

```typescript
// Agent using knowledge base
const agent = new OnboardingAgent();

// Agent's tool usage
const result = await agent.callTool('search_tms_knowledge', {
  query: 'What are the key indicators of team maturity in TMP?',
  document_types: ['handbook', 'research'],
  limit: 3
});

// Returns:
{
  results: [
    {
      content: 'The Team Management Profile identifies 8 key indicators...',
      source: 'TMP Accreditation Handbook',
      relevance: 0.92,
      citation: 'TMP Handbook, Section 3.2, p.45'
    },
    // ...
  ]
}
```

## Conclusion

The Knowledge Base System is the critical foundation that enables agents to provide meaningful, IP-traceable guidance. This implementation plan provides a clear path to building a robust, scalable system that unlocks the full potential of the TMS multi-agent platform.