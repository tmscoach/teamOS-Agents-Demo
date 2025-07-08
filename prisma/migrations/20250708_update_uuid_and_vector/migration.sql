-- UpdateUuidGenerationAndVectorType
-- This migration updates the UUID generation method and vector type definition

-- Enable uuid-ossp extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Note: The following changes have already been applied to the production database
-- This migration file documents the changes for consistency

-- The following columns were updated to use gen_random_uuid():
-- - Document.id
-- - DocumentChunk.id  
-- - QuestionnaireItem.id

-- The vector type was changed from vector(1536) to vector (flexible dimensions)
-- This allows for different embedding models with varying dimensions

-- An index was added on DocumentChunk.embedding for vector similarity search
-- CREATE INDEX IF NOT EXISTS document_chunk_embedding_idx ON "DocumentChunk" USING ivfflat (embedding vector_cosine_ops);