/**
 * Report Storage API
 * POST /api/reports/store
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ReportStorageService } from '@/src/lib/services/report-storage/report-storage.service';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      reportType,
      subscriptionId,
      templateId,
      rawHtml,
      organizationId,
      teamId
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
      userId: session.userId,
      teamId,
      organizationId: organizationId || 'default', // TODO: Get from user context
      reportType,
      subscriptionId,
      templateId,
      rawHtml
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