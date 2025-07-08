-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS document_chunk_embedding_idx 
ON "DocumentChunk" 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create full-text search indexes
CREATE INDEX IF NOT EXISTS document_content_fts_idx 
ON "DocumentChunk" 
USING gin(to_tsvector('english', content));

-- Create indexes for efficient filtering
CREATE INDEX IF NOT EXISTS document_type_idx ON "Document" ("documentType");
CREATE INDEX IF NOT EXISTS questionnaire_assessment_type_idx ON "QuestionnaireItem" ("assessmentType");
CREATE INDEX IF NOT EXISTS questionnaire_category_idx ON "QuestionnaireItem" (category);

-- Function to search documents by vector similarity
CREATE OR REPLACE FUNCTION search_documents(
  query_embedding vector(1536),
  match_count int DEFAULT 5,
  filter_document_types text[] DEFAULT NULL
)
RETURNS TABLE(
  chunk_id uuid,
  document_id uuid,
  content text,
  title text,
  document_type text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dc.id as chunk_id,
    dc."documentId" as document_id,
    dc.content,
    d.title,
    d."documentType"::text,
    1 - (dc.embedding <=> query_embedding) as similarity
  FROM "DocumentChunk" dc
  JOIN "Document" d ON d.id = dc."documentId"
  WHERE 
    (filter_document_types IS NULL OR d."documentType" = ANY(filter_document_types))
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;