-- Add vision analysis fields to ReportImage table

-- Add new columns
ALTER TABLE "ReportImage" 
ADD COLUMN IF NOT EXISTS "detailedDescription" TEXT,
ADD COLUMN IF NOT EXISTS "extractedData" JSONB,
ADD COLUMN IF NOT EXISTS "insights" TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "embedding" vector(1536);

-- Create index on embedding for similarity search
CREATE INDEX IF NOT EXISTS "report_image_embedding_idx" ON "ReportImage" USING ivfflat ("embedding" vector_cosine_ops);

-- Comment on new columns
COMMENT ON COLUMN "ReportImage"."detailedDescription" IS 'AI-generated detailed description of the image content';
COMMENT ON COLUMN "ReportImage"."extractedData" IS 'Structured data extracted from the image (e.g., wheel percentages, graph data points)';
COMMENT ON COLUMN "ReportImage"."insights" IS 'Key insights derived from the image analysis';
COMMENT ON COLUMN "ReportImage"."embedding" IS 'Vector embedding of the image description for similarity search';