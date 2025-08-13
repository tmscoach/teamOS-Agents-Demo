import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/src/lib/auth/clerk-dev-wrapper';
import { KnowledgeBaseSearch } from '@/src/lib/knowledge-base/retrieval/search';

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { assessment_type, section, context } = body;

    if (!assessment_type) {
      return NextResponse.json(
        { error: 'Assessment type parameter is required' },
        { status: 400 }
      );
    }

    console.log('[Voice Tool: get-assessment-methodology] Getting methodology for:', {
      assessment_type,
      section,
      context
    });

    // Execute the search using the same service as the chat agent
    const search = new KnowledgeBaseSearch();
    
    try {
      const query = section 
        ? `${assessment_type} ${section}`
        : `${assessment_type} methodology overview`;
      
      const results = await search.search(query, {
        documentTypes: ['HANDBOOK'],
        limit: 3,
        minRelevance: 0.1
      });
      
      console.log('[Voice Tool: get-assessment-methodology] Found', results.length, 'results');
      
      await search.close();
      
      return NextResponse.json({
        success: true,
        output: {
          assessment_type,
          methodology: results.map(r => ({
            content: r.content,
            source: r.source,
            citation: r.citation
          }))
        }
      });
    } catch (error) {
      await search.close();
      console.error('[Voice Tool: get-assessment-methodology] Error:', error);
      return NextResponse.json({
        success: false,
        output: null,
        error: `Failed to retrieve assessment methodology: ${error}`
      });
    }
  } catch (error) {
    console.error('[Voice Tool: get-assessment-methodology] Request error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}