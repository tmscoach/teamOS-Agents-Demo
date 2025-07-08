-- Enable pgvector extension first
CREATE EXTENSION IF NOT EXISTS vector;

-- Create enum types
CREATE TYPE "UserRole" AS ENUM ('TEAM_MEMBER', 'MANAGER', 'ADMIN');
CREATE TYPE "DocumentType" AS ENUM ('HANDBOOK', 'QUESTIONNAIRE', 'REPORT', 'RESEARCH');

-- Create Document table
CREATE TABLE IF NOT EXISTS "Document" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "title" TEXT NOT NULL,
    "sourcePath" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- Create unique index on sourcePath
CREATE UNIQUE INDEX IF NOT EXISTS "Document_sourcePath_key" ON "Document"("sourcePath");
CREATE INDEX IF NOT EXISTS "Document_documentType_idx" ON "Document"("documentType");

-- Create DocumentChunk table
CREATE TABLE IF NOT EXISTS "DocumentChunk" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "documentId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(1536),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentChunk_pkey" PRIMARY KEY ("id")
);

-- Create indexes for DocumentChunk
CREATE INDEX IF NOT EXISTS "DocumentChunk_documentId_idx" ON "DocumentChunk"("documentId");
CREATE INDEX IF NOT EXISTS "DocumentChunk_chunkIndex_idx" ON "DocumentChunk"("chunkIndex");

-- Create QuestionnaireItem table
CREATE TABLE IF NOT EXISTS "QuestionnaireItem" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "documentId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "responseOptions" JSONB,
    "scoringFormula" TEXT,
    "category" TEXT,
    "assessmentType" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionnaireItem_pkey" PRIMARY KEY ("id")
);

-- Create indexes and constraints for QuestionnaireItem
CREATE UNIQUE INDEX IF NOT EXISTS "QuestionnaireItem_documentId_questionId_key" ON "QuestionnaireItem"("documentId", "questionId");
CREATE INDEX IF NOT EXISTS "QuestionnaireItem_assessmentType_idx" ON "QuestionnaireItem"("assessmentType");
CREATE INDEX IF NOT EXISTS "QuestionnaireItem_category_idx" ON "QuestionnaireItem"("category");

-- Add foreign key constraints
ALTER TABLE "DocumentChunk" ADD CONSTRAINT "DocumentChunk_documentId_fkey" 
    FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "QuestionnaireItem" ADD CONSTRAINT "QuestionnaireItem_documentId_fkey" 
    FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;