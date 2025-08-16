-- Add journey tracking fields to User table
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "imageUrl" TEXT,
ADD COLUMN IF NOT EXISTS "journeyStatus" TEXT DEFAULT 'ONBOARDING',
ADD COLUMN IF NOT EXISTS "currentAgent" TEXT,
ADD COLUMN IF NOT EXISTS "completedSteps" TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "lastActivity" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "onboardingData" JSONB,
ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- Update role enum values if needed
UPDATE "User" SET "role" = 'TEAM_MANAGER' WHERE "role" = 'MANAGER';

-- Create index on journeyStatus
CREATE INDEX IF NOT EXISTS "User_journeyStatus_idx" ON "User"("journeyStatus");