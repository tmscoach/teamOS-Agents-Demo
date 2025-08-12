-- Create vector search function for report chunks
CREATE OR REPLACE FUNCTION search_report_chunks(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_report_id text DEFAULT NULL
)
RETURNS TABLE (
  id text,
  report_id text,
  section_title text,
  content text,
  chunk_index int,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rc.id,
    rc."reportId" as report_id,
    rc."sectionTitle" as section_title,
    rc.content,
    rc."chunkIndex" as chunk_index,
    1 - (rc.embedding <=> query_embedding) as similarity
  FROM "ReportChunk" rc
  WHERE 
    (filter_report_id IS NULL OR rc."reportId" = filter_report_id)
    AND rc.embedding IS NOT NULL
    AND 1 - (rc.embedding <=> query_embedding) > match_threshold
  ORDER BY rc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create index for vector similarity search if not exists
CREATE INDEX IF NOT EXISTS report_chunk_embedding_idx 
ON "ReportChunk" 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_report_chunks TO authenticated;
GRANT EXECUTE ON FUNCTION search_report_chunks TO service_role;