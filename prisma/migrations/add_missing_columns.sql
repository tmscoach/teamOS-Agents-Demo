-- Add missing columns to support the application
-- Run this manually if automatic migrations fail

-- Add metadata column to Conversation table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='Conversation' AND column_name='metadata') THEN
        ALTER TABLE "Conversation" ADD COLUMN "metadata" JSONB;
    END IF;
END $$;

-- Add metadata column to Message table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='Message' AND column_name='metadata') THEN
        ALTER TABLE "Message" ADD COLUMN "metadata" JSONB;
    END IF;
END $$;

-- Add guardrailConfig column to AgentConfiguration table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='AgentConfiguration' AND column_name='guardrailConfig') THEN
        ALTER TABLE "AgentConfiguration" ADD COLUMN "guardrailConfig" JSONB DEFAULT '{}';
    END IF;
END $$;