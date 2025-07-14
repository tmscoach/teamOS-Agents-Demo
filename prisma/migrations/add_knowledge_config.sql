-- Add knowledgeConfig field to AgentConfiguration table
ALTER TABLE "AgentConfiguration" 
ADD COLUMN IF NOT EXISTS "knowledgeConfig" JSONB;