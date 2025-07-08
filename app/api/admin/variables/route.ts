import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { VariableExtractionService } from '@/lib/services/variable-extraction';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const conversationId = searchParams.get('conversationId');

    // If conversationId is provided, get extractions for that conversation
    if (conversationId) {
      const extractions = await VariableExtractionService.getConversationExtractions(conversationId);
      return NextResponse.json(extractions);
    }

    // Otherwise, search extractions based on filters
    const params = {
      query: searchParams.get('query') || undefined,
      agentName: searchParams.get('agentName') || undefined,
      fieldName: searchParams.get('fieldName') || undefined,
      successful: searchParams.has('successful') ? searchParams.get('successful') === 'true' : undefined,
      minConfidence: searchParams.get('minConfidence') ? parseFloat(searchParams.get('minConfidence')!) : undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    };

    const results = await VariableExtractionService.searchExtractions(params);
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching variable extractions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch variable extractions' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    // Handle batch tracking
    if (Array.isArray(body)) {
      const count = await VariableExtractionService.trackExtractionBatch(body);
      return NextResponse.json({ count });
    }

    // Handle single tracking
    if (!body.conversationId || !body.agentName || !body.fieldName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const extraction = await VariableExtractionService.trackExtraction({
      conversationId: body.conversationId,
      agentName: body.agentName,
      fieldName: body.fieldName,
      attempted: body.attempted ?? true,
      successful: body.successful ?? false,
      extractedValue: body.extractedValue,
      confidence: body.confidence,
    });

    return NextResponse.json(extraction);
  } catch (error) {
    console.error('Error tracking variable extraction:', error);
    return NextResponse.json(
      { error: 'Failed to track variable extraction' },
      { status: 500 }
    );
  }
}