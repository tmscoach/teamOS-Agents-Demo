import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    // Try to connect to the database
    await prisma.$connect();
    
    // Try to count agent configurations
    const count = await prisma.agentConfiguration.count().catch(err => {
      return { error: 'Table not found', details: err.message };
    });
    
    // Check if guardrailConfig column exists
    const sampleConfig = await prisma.agentConfiguration.findFirst().catch(err => {
      return { error: 'Cannot query table', details: err.message };
    });
    
    return NextResponse.json({
      status: 'Database connection successful',
      agentConfigCount: count,
      sampleConfig: sampleConfig,
      hasGuardrailConfig: sampleConfig && 'guardrailConfig' in sampleConfig
    });
  } catch (error) {
    return NextResponse.json({
      status: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      suggestion: 'Check DATABASE_URL in .env file'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}