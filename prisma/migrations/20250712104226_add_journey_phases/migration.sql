-- CreateEnum
CREATE TYPE "JourneyPhase" AS ENUM ('ONBOARDING', 'ASSESSMENT', 'DEBRIEF', 'CONTINUOUS_ENGAGEMENT');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "journeyPhase" "JourneyPhase" NOT NULL DEFAULT 'ONBOARDING',
ADD COLUMN     "completedAssessments" JSONB DEFAULT '{}',
ADD COLUMN     "viewedDebriefs" JSONB DEFAULT '{}',
ADD COLUMN     "teamSignalsEligible" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "User_journeyPhase_idx" ON "User"("journeyPhase");

-- Migrate existing data from journeyStatus to journeyPhase
UPDATE "User" 
SET "journeyPhase" = 
  CASE 
    WHEN "journeyStatus" = 'ONBOARDING' THEN 'ONBOARDING'::"JourneyPhase"
    WHEN "journeyStatus" = 'ACTIVE' THEN 'ASSESSMENT'::"JourneyPhase"
    WHEN "journeyStatus" = 'DORMANT' THEN 'CONTINUOUS_ENGAGEMENT'::"JourneyPhase"
    ELSE 'ONBOARDING'::"JourneyPhase"
  END;

-- Set teamSignalsEligible for users who have completed certain steps
UPDATE "User"
SET "teamSignalsEligible" = true
WHERE 'tmp_assessment' = ANY("completedSteps")
   OR 'tmp_debrief' = ANY("completedSteps");