import { PrismaClient } from '@prisma/client'
import { JourneyTracker } from '../lib/orchestrator/journey-tracker'

const prisma = new PrismaClient()

async function testJourneyPhases() {
  console.log('Testing new journey phase data model...\n')

  try {
    // Find a test user
    const testUser = await prisma.user.findFirst({
      where: {
        email: 'test@example.com'
      }
    })

    if (!testUser) {
      console.log('No test user found. Creating one...')
      const newUser = await prisma.user.create({
        data: {
          clerkId: 'test_clerk_id_' + Date.now(),
          email: 'test@example.com',
          name: 'Test User',
          role: 'MANAGER',
          journeyPhase: 'ONBOARDING',
          completedSteps: ['welcome', 'team_context'],
          completedAssessments: {
            initial_survey: {
              completedAt: new Date(),
              results: { score: 85 }
            }
          },
          viewedDebriefs: {},
          teamSignalsEligible: false
        }
      })
      console.log('Created test user:', newUser.id)
    }

    // Test journey tracker with new fields
    const tracker = new JourneyTracker(testUser?.id || '')
    
    console.log('\n1. Testing getCurrentJourney with new fields...')
    const journey = await tracker.getCurrentJourney()
    console.log('Current phase:', journey.currentPhase)
    console.log('Completed assessments:', journey.completedAssessments)
    console.log('Viewed debriefs:', journey.viewedDebriefs)
    console.log('Team Signals eligible:', journey.teamSignalsEligible)

    console.log('\n2. Testing markAssessmentComplete...')
    await tracker.markAssessmentComplete('tmp_assessment', {
      scores: { leadership: 8, communication: 7 },
      completionTime: 15
    })
    console.log('Marked TMP assessment as complete')

    console.log('\n3. Testing markDebriefViewed...')
    await tracker.markDebriefViewed('tmp_debrief', {
      reportId: 'report_123',
      viewDuration: 300
    })
    console.log('Marked TMP debrief as viewed')

    // Verify updates
    const updatedJourney = await tracker.getCurrentJourney()
    console.log('\n4. Verifying updates...')
    console.log('Updated assessments:', updatedJourney.completedAssessments)
    console.log('Updated debriefs:', updatedJourney.viewedDebriefs)
    console.log('Team Signals eligible:', updatedJourney.teamSignalsEligible)

    console.log('\n✅ All tests passed!')

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testJourneyPhases()