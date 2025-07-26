/**
 * Report Retrieval API
 * GET /api/reports/[id]
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ReportStorageService } from '@/src/lib/services/report-storage/report-storage.service';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Get the report
    const storageService = new ReportStorageService();
    const report = await storageService.getReport(reportId, session.userId);

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