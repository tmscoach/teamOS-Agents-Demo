-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create a function to search for similar chunks
-- This function converts JSON embeddings to vectors and performs similarity search
CREATE OR REPLACE FUNCTION search_similar_chunks(
  query_embedding float[],
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  content text,
  "documentId" uuid,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dc.id,
    dc.content,
    dc."documentId",
    -- Calculate cosine similarity
    -- Convert JSON to vector and use <=> operator for cosine distance
    -- Then convert to similarity (1 - distance)
    (1 - (
      (dc.embedding::text::vector(1536) <=> query_embedding::vector(1536))
    ))::float as similarity
  FROM "DocumentChunk" dc
  WHERE dc.embedding IS NOT NULL
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- Create an index for better performance (optional but recommended)
-- This would require converting the embedding column to vector type first
-- For now, we'll skip this as it requires schema changes

-- Test the function exists
SELECT proname FROM pg_proc WHERE proname = 'search_similar_chunks';