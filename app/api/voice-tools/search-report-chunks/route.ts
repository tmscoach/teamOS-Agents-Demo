import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/src/lib/auth/clerk-dev-wrapper';
import prisma from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { query, subscriptionId, limit = 5, context } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    // Use subscription ID from params or context
    const finalSubscriptionId = subscriptionId || context?.subscriptionId;
    
    if (!finalSubscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    console.log('[Voice Tool: search-report-chunks] Searching report chunks:', {
      query,
      subscriptionId: finalSubscriptionId,
      limit
    });

    try {
      // Search report chunks in the database using raw SQL for case-insensitive search
      // Using ILIKE for PostgreSQL case-insensitive pattern matching
      const chunks = await prisma.$queryRaw<Array<{
        content: string;
        sectionTitle: string;
        metadata: any;
      }>>`
        SELECT rc."content", rc."sectionTitle", rc."metadata"
        FROM "ReportChunk" rc
        INNER JOIN "UserReport" ur ON rc."reportId" = ur."id"
        WHERE ur."subscriptionId" = ${finalSubscriptionId}
        AND (
          rc."content" ILIKE ${`%${query}%`}
          OR rc."sectionTitle" ILIKE ${`%${query}%`}
        )
        ORDER BY rc."chunkIndex" ASC
        LIMIT ${limit}
      `;

      const chunkArray = chunks || [];
      console.log('[Voice Tool: search-report-chunks] Found', chunkArray.length, 'chunks');

      return NextResponse.json({
        success: true,
        output: {
          chunks: chunkArray.map(chunk => ({
            content: chunk.content,
            section: chunk.sectionTitle,
            metadata: chunk.metadata
          }))
        }
      });
    } catch (error) {
      console.error('[Voice Tool: search-report-chunks] Database error:', error);
      return NextResponse.json({
        success: false,
        output: null,
        error: `Failed to search report chunks: ${error}`
      });
    }
  } catch (error) {
    console.error('[Voice Tool: search-report-chunks] Request error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}