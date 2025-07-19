-- Add organization support to existing tables

-- Add organizationId and organizationRole to User table
ALTER TABLE "User" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "User" ADD COLUMN "organizationRole" TEXT;

-- Add organizationId to Team table
ALTER TABLE "Team" ADD COLUMN "organizationId" TEXT;

-- Add organizationId to Conversation table
ALTER TABLE "Conversation" ADD COLUMN "organizationId" TEXT;

-- Create indexes for better query performance
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");
CREATE INDEX "Team_organizationId_idx" ON "Team"("organizationId");
CREATE INDEX "Conversation_organizationId_idx" ON "Conversation"("organizationId");