import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { mockDataStore } from '@/src/lib/mock-tms-api/mock-data-store';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    // Get the current user from Clerk
    const session = await auth();
    const user = await currentUser();
    
    if (!session?.userId || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const userId = session.userId;
    const userEmail = user.emailAddresses?.[0]?.emailAddress;
    
    // Check for existing mock user
    let mockUser = mockDataStore.getUserByClerkId(userId);
    
    // Check for database user
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId }
    }).catch(() => null);
    
    // If no mock user exists, create one
    if (!mockUser && userEmail) {
      console.log('[test-mock-user] Creating mock user for:', userEmail);
      
      // Ensure we have an organization
      const existingOrgs = Array.from(mockDataStore.organizations.values());
      let orgId: string;
      
      if (existingOrgs.length > 0) {
        orgId = existingOrgs[0].id;
      } else {
        const newOrg = mockDataStore.createOrganization('Test Organization', 'system');
        orgId = newOrg.id;
      }
      
      // Create the mock user
      mockUser = mockDataStore.createUser({
        email: userEmail,
        clerkUserId: userId,
        firstName: userEmail.split('@')[0],
        lastName: 'User',
        userType: 'Facilitator',
        organizationId: orgId
      });
    }
    
    // Get all subscriptions for this user
    const allSubscriptions = mockDataStore.getAllSubscriptions();
    const userSubscriptions = allSubscriptions.filter(sub => 
      sub.userId === mockUser?.id || sub.userId === dbUser?.id
    );
    
    return NextResponse.json({
      clerkUser: {
        id: userId,
        email: userEmail
      },
      databaseUser: dbUser ? {
        id: dbUser.id,
        email: dbUser.email,
        clerkId: dbUser.clerkId,
        organizationId: dbUser.organizationId
      } : null,
      mockUser: mockUser ? {
        id: mockUser.id,
        email: mockUser.email,
        clerkUserId: mockUser.clerkUserId,
        userType: mockUser.userType,
        organizationId: mockUser.organizationId
      } : null,
      subscriptions: userSubscriptions,
      mockDataStoreInfo: {
        totalUsers: mockDataStore.users.size,
        totalOrganizations: mockDataStore.organizations.size,
        totalSubscriptions: mockDataStore.subscriptions.size
      }
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}