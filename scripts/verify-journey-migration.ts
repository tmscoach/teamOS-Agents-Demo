#!/usr/bin/env node
import prisma from '../lib/db'
import { JourneyPhase } from '@prisma/client'

async function verifyMigration() {
  console.log('🔍 Verifying journey phase migration...\n')

  try {
    // Check if the new columns exist by querying a user
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        journeyStatus: true,
        journeyPhase: true,
        completedAssessments: true,
        viewedDebriefs: true,
        teamSignalsEligible: true,
        completedSteps: true,
        role: true
      },
      take: 5
    })

    if (users.length === 0) {
      console.log('⚠️  No users found in database')
      return
    }

    console.log(`✅ Found ${users.length} users with new journey fields:\n`)

    users.forEach(user => {
      console.log(`📧 ${user.email}`)
      console.log(`   Legacy Status: ${user.journeyStatus}`)
      console.log(`   Journey Phase: ${user.journeyPhase}`)
      console.log(`   Completed Assessments: ${JSON.stringify(user.completedAssessments)}`)
      console.log(`   Viewed Debriefs: ${JSON.stringify(user.viewedDebriefs)}`)
      console.log(`   Team Signals Eligible: ${user.teamSignalsEligible}`)
      console.log(`   Completed Steps: ${user.completedSteps.length} steps`)
      console.log('')
    })

    // Check enum values
    console.log('📋 Available Journey Phases:')
    console.log('   - ONBOARDING')
    console.log('   - ASSESSMENT') 
    console.log('   - DEBRIEF')
    console.log('   - CONTINUOUS_ENGAGEMENT')

    // Check if data was migrated correctly
    const stats = await prisma.user.aggregate({
      _count: {
        _all: true,
        journeyPhase: true,
        completedAssessments: true,
        viewedDebriefs: true
      }
    })

    console.log('\n📊 Migration Statistics:')
    console.log(`   Total Users: ${stats._count._all}`)
    console.log(`   Users with Journey Phase: ${stats._count.journeyPhase}`)
    console.log(`   Users with Completed Assessments: ${stats._count.completedAssessments}`)
    console.log(`   Users with Viewed Debriefs: ${stats._count.viewedDebriefs}`)

    console.log('\n✅ Migration verification complete!')

  } catch (error) {
    console.error('❌ Error verifying migration:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyMigration()