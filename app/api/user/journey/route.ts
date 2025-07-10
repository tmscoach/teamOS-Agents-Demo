import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { JourneyTracker } from '@/lib/orchestrator/journey-tracker'

export async function GET() {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const journeyTracker = await JourneyTracker.getOrCreateJourneyForUser(user.id)
    const journey = await journeyTracker.getCurrentJourney()

    return NextResponse.json(journey)
  } catch (error) {
    console.error('Error fetching journey:', error)
    return NextResponse.json(
      { error: 'Failed to fetch journey status' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { stepId, data } = await request.json()

    const journeyTracker = await JourneyTracker.getOrCreateJourneyForUser(user.id)
    await journeyTracker.updateJourneyProgress(stepId, data)

    const updatedJourney = await journeyTracker.getCurrentJourney()

    return NextResponse.json(updatedJourney)
  } catch (error) {
    console.error('Error updating journey:', error)
    return NextResponse.json(
      { error: 'Failed to update journey progress' },
      { status: 500 }
    )
  }
}