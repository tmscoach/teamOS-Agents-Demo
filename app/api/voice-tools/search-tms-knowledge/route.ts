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
    const { query, document_types, limit, context } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    console.log('[Voice Tool: search-tms-knowledge] Searching for:', query, {
      documentTypes: document_types,
      limit: limit || 5,
      context
    });

    // Execute the search using the same service as the chat agent
    const search = new KnowledgeBaseSearch();
    
    try {
      // Use hybrid search for better results (same as the agent tool)
      const words = query.split(' ');
      const keywords = query.length <= 5 
        ? words // Include all words for short queries/acronyms
        : words.filter((word: string) => word.length > 2);
        
      const results = await search.hybridSearch(query, keywords, {
        documentTypes: document_types,
        limit: limit || 5,
        minRelevance: parseFloat(process.env.KNOWLEDGE_BASE_MIN_RELEVANCE || '0.1')
      });
      
      console.log('[Voice Tool: search-tms-knowledge] Found', results.length, 'results');
      
      await search.close();
      
      return NextResponse.json({
        success: true,
        output: {
          results: results.map(r => ({
            content: r.content,
            source: r.source,
            relevance: r.relevance,
            citation: r.citation
          }))
        }
      });
    } catch (error) {
      await search.close();
      console.error('[Voice Tool: search-tms-knowledge] Error:', error);
      return NextResponse.json({
        success: false,
        output: null,
        error: `Failed to search knowledge base: ${error}`
      });
    }
  } catch (error) {
    console.error('[Voice Tool: search-tms-knowledge] Request error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}