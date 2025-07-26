/**
 * Report Search API
 * POST /api/reports/search
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
    const { query, reportTypes, limit } = body;

    // Validate query
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query string required' },
        { status: 400 }
      );
    }

    // Search reports
    const storageService = new ReportStorageService();
    const results = await storageService.searchReports({
      userId: session.userId,
      query,
      reportTypes,
      limit: limit || 10
    });

    return NextResponse.json({
      success: true,
      results,
      count: results.length
    });
  } catch (error) {
    console.error('Error searching reports:', error);
    return NextResponse.json(
      { error: 'Failed to search reports' },
      { status: 500 }
    );
  }
}