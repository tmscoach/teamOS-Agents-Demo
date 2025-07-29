import { NextRequest, NextResponse } from 'next/server';
import { mockTMSClient } from '@/src/lib/mock-tms-api/mock-api-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await mockTMSClient.callTool('tms_generate_html_report', body);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}