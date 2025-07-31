/**
 * Report Storage API
 * POST /api/reports/store
 */

import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { ReportStorageService } from '@/src/lib/services/report-storage/report-storage.service';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const clerkUser = await currentUser();

    // Look up the database user by Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: session.userId },
      select: { id: true, organizationId: true }
    });

    let dbUserId: string;
    let dbOrganizationId: string | null;
    
    if (!user) {
      // If user doesn't exist in database, create them
      const newUser = await prisma.user.create({
        data: {
          id: session.userId, // Use Clerk ID as the database ID for now
          clerkId: session.userId,
          email: clerkUser?.emailAddresses?.[0]?.emailAddress || `${session.userId}@temp.com`,
          name: clerkUser?.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim() : 'Unknown User',
          role: 'TEAM_MEMBER',
          updatedAt: new Date()
        }
      });
      dbUserId = newUser.id;
      dbOrganizationId = newUser.organizationId;
    } else {
      dbUserId = user.id;
      dbOrganizationId = user.organizationId;
    }

    const body = await request.json();
    const {
      reportType,
      subscriptionId,
      templateId,
      rawHtml,
      organizationId,
      teamId,
      processImmediately,
      jwt
    } = body;

    // Validate required fields
    if (!reportType || !subscriptionId || !templateId || !rawHtml) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate report type
    const validTypes = ['TMP', 'QO2', 'TEAM_SIGNALS', 'TEAM_SIGNALS_360'];
    if (!validTypes.includes(reportType)) {
      return NextResponse.json(
        { error: 'Invalid report type' },
        { status: 400 }
      );
    }

    // Store the report
    const storageService = new ReportStorageService();
    const reportId = await storageService.storeReport({
      userId: dbUserId, // Use the database user ID
      teamId,
      organizationId: organizationId || dbOrganizationId || 'default',
      reportType,
      subscriptionId,
      templateId,
      rawHtml,
      processImmediately,
      jwt
    });

    return NextResponse.json({
      success: true,
      reportId,
      message: 'Report stored successfully and queued for processing'
    });
  } catch (error) {
    console.error('Error storing report:', error);
    return NextResponse.json(
      { error: 'Failed to store report' },
      { status: 500 }
    );
  }
}