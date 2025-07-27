/**
 * Report Retrieval API
 * GET /api/reports/[id]
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ReportStorageService } from '@/src/lib/services/report-storage/report-storage.service';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reportId = params.id;
    if (!reportId) {
      return NextResponse.json(
        { error: 'Report ID required' },
        { status: 400 }
      );
    }

    // Look up the database user by Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: session.userId },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the report
    const storageService = new ReportStorageService();
    const report = await storageService.getReport(reportId, user.id);

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Error retrieving report:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve report' },
      { status: 500 }
    );
  }
}