import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { VariableExtractionService } from '@/src/lib/services/variable-extraction';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const endpoint = searchParams.get('endpoint');

    // Handle specific endpoints
    switch (endpoint) {
      case 'problematic-fields': {
        const threshold = searchParams.get('threshold') ? parseInt(searchParams.get('threshold')!) : 50;
        const problematicFields = await VariableExtractionService.getProblematicFields(threshold);
        return NextResponse.json(problematicFields);
      }

      case 'trends': {
        const params = {
          agentName: searchParams.get('agentName') || undefined,
          fieldName: searchParams.get('fieldName') || undefined,
          days: searchParams.get('days') ? parseInt(searchParams.get('days')!) : 7,
        };
        const trends = await VariableExtractionService.getExtractionTrends(params);
        return NextResponse.json(trends);
      }

      case 'confidence-distribution': {
        const fieldName = searchParams.get('fieldName');
        if (!fieldName) {
          return NextResponse.json(
            { error: 'Field name is required for confidence distribution' },
            { status: 400 }
          );
        }
        const distribution = await VariableExtractionService.getConfidenceDistribution(fieldName);
        return NextResponse.json(distribution);
      }

      default: {
        // General statistics
        const filters = {
          agentName: searchParams.get('agentName') || undefined,
          fieldName: searchParams.get('fieldName') || undefined,
          startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
          endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
        };

        const stats = await VariableExtractionService.getExtractionStats(filters);
        
        // Transform the response to match expected format
        return NextResponse.json({
          totalExtractions: stats.totalAttempts,
          successfulExtractions: stats.successfulExtractions,
          successRate: stats.overallSuccessRate,
          fieldsBySuccessRate: stats.byField?.sort((a, b) => b.successRate - a.successRate) || [],
          fields: stats.byField || [],
          byAgent: stats.byAgent || []
        });
      }
    }
  } catch (error: any) {
    console.error('Error fetching variable extraction stats:', error);
    
    // Handle missing database table error
    if (error.code === 'P2021' && error.message?.includes('table `public.VariableExtraction` does not exist')) {
      return NextResponse.json({
        totalExtractions: 0,
        successfulExtractions: 0,
        successRate: 0,
        fieldsBySuccessRate: [],
        fields: [],
        trends: [],
        warning: 'Variable extraction table not initialized. Please run database migrations.',
        instructions: 'Run: npx prisma migrate dev'
      });
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch variable extraction statistics' },
      { status: 500 }
    );
  }
}