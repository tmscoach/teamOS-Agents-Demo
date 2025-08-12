-- Add jsonData field to UserReport table
ALTER TABLE "UserReport" ADD COLUMN IF NOT EXISTS "jsonData" JSON;
