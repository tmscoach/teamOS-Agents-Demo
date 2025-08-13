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
      // Search report chunks in the database
      // This is a simplified version - you may want to use vector search here
      const chunks = await prisma.reportChunk.findMany({
        where: {
          UserReport: {
            subscriptionId: finalSubscriptionId
          },
          OR: [
            { content: { contains: query, mode: 'insensitive' } },
            { sectionTitle: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: limit,
        orderBy: {
          sequenceNumber: 'asc'
        },
        select: {
          content: true,
          sectionTitle: true,
          pageNumber: true,
          metadata: true
        }
      });

      console.log('[Voice Tool: search-report-chunks] Found', chunks.length, 'chunks');

      return NextResponse.json({
        success: true,
        output: {
          chunks: chunks.map(chunk => ({
            content: chunk.content,
            section: chunk.sectionTitle,
            page: chunk.pageNumber,
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