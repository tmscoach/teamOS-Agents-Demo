-- Add guardrailConfig column to AgentConfiguration table
ALTER TABLE "AgentConfiguration" 
ADD COLUMN "guardrailConfig" JSONB DEFAULT '{}';