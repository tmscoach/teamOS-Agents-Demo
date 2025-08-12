import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/src/lib/auth/clerk-dev-wrapper';
import { prisma } from '@/lib/db/prisma';
import { JourneyPhase } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { phase, subscriptionId } = body;

    // Get user from database
    const userQuery = clerkUser.emailAddresses?.[0]?.emailAddress 
      ? { email: clerkUser.emailAddresses[0].emailAddress }
      : { clerkId: clerkUser.id };
      
    const user = await prisma.user.findUnique({
      where: userQuery,
      select: {
        id: true,
        journeyPhase: true,
        completedSteps: true
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user's journey phase
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        journeyPhase: phase as JourneyPhase,
        completedSteps: {
          push: `assessment_${subscriptionId}_completed`
        }
      }
    });

    // If moving to DEBRIEF phase, create a completed report record
    if (phase === 'DEBRIEF' && subscriptionId) {
      // Get user's organization ID
      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { organizationId: true }
      });

      if (!fullUser?.organizationId) {
        console.error('[Journey] User has no organization ID');
        return NextResponse.json({ error: 'User organization not found' }, { status: 400 });
      }

      // Check if report already exists
      const existingReport = await prisma.userReport.findFirst({
        where: {
          userId: user.id,
          subscriptionId: String(subscriptionId)
        }
      });

      if (!existingReport) {
        // Create a new report with completed status
        await prisma.userReport.create({
          data: {
            userId: user.id,
            organizationId: fullUser.organizationId,
            reportType: 'TMP', // Default to TMP, would need to get from subscription
            subscriptionId: String(subscriptionId),
            templateId: '6', // Default template
            rawHtml: '', // Will be populated when viewing the report
            processingStatus: 'COMPLETED',
            metadata: {
              completedAt: new Date().toISOString()
            }
          }
        });

        console.log('[Journey] Created completed report for subscription:', subscriptionId);
      } else {
        // Update existing report to completed status
        await prisma.userReport.update({
          where: { id: existingReport.id },
          data: {
            processingStatus: 'COMPLETED',
            metadata: {
              ...(existingReport.metadata as any || {}),
              completedAt: new Date().toISOString()
            }
          }
        });

        console.log('[Journey] Updated report to completed for subscription:', subscriptionId);
      }
    }

    console.log('[Journey] Updated user journey phase to:', phase);

    // Update mock data store if in mock mode and assessment completed
    if (process.env.NEXT_PUBLIC_USE_MOCK_TMS_API === 'true' && phase === 'DEBRIEF' && subscriptionId) {
      const { mockDataStore } = await import('@/src/lib/mock-tms-api/mock-data-store');
      
      // Get mock user ID from clerk user
      let mockUserId = user.id;
      const mockUser = mockDataStore.getUserByClerkId(user.clerkId || '') || 
                      mockDataStore.getUserByEmail(user.email);
      if (mockUser) {
        mockUserId = mockUser.id;
      }
      
      // Update subscription using the TMS subscription ID
      const updated = mockDataStore.updateSubscriptionByTmsId(String(subscriptionId), mockUserId, {
        status: 'completed',
        completedDate: new Date(),
        completionPercentage: 100
      });
      
      if (updated) {
        console.log('[Journey] Updated mock subscription status to completed:', subscriptionId);
      } else {
        console.log('[Journey] Failed to update mock subscription:', subscriptionId, 'for user:', mockUserId);
      }
    }

    return NextResponse.json({
      success: true,
      journeyPhase: updatedUser.journeyPhase
    });
  } catch (error) {
    console.error('[Journey] Error updating phase:', error);
    return NextResponse.json(
      { error: 'Failed to update journey phase' },
      { status: 500 }
    );
  }
}