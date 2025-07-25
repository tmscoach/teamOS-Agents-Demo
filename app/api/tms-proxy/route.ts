import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/src/lib/auth/clerk-dev-wrapper';
import { createTMSTool } from '@/src/lib/agents/tools/tms-tool-factory';
import { AgentContext } from '@/src/lib/agents/types';
import prisma from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tool, parameters } = body;

    if (!tool || !parameters) {
      return NextResponse.json(
        { error: 'Missing required fields: tool, parameters' },
        { status: 400 }
      );
    }

    // Create the TMS tool
    const tmsTool = createTMSTool(tool);
    
    if (!tmsTool) {
      return NextResponse.json(
        { error: `Unknown tool: ${tool}` },
        { status: 400 }
      );
    }

    // Get the user's database record
    console.log('TMS Proxy: Looking up user with clerkId:', user.id);
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id }
    });
    
    let contextUserId = user.id; // Default to Clerk ID
    let effectiveUserId = user.id; // The ID to use for the actual API calls
    
    if (dbUser) {
      console.log('TMS Proxy: Found database user:', dbUser.id);
      contextUserId = dbUser.id; // Use database ID for context
      
      // For mock API, we need to handle the user ID mapping carefully
      if (process.env.NEXT_PUBLIC_USE_MOCK_TMS_API === 'true') {
        const { mockDataStore } = await import('@/src/lib/mock-tms-api/mock-data-store');
        
        // First check if there's a mock user mapped to this Clerk ID
        const mockUserByClerkId = mockDataStore.getUserByClerkId(user.id);
        if (mockUserByClerkId) {
          console.log('TMS Proxy: Found mock user by Clerk ID:', mockUserByClerkId.id);
          effectiveUserId = mockUserByClerkId.id;
        } else {
          // Check if there's a mock user with the database user's email
          const mockUserByEmail = mockDataStore.getUserByEmail(dbUser.email);
          if (mockUserByEmail) {
            console.log('TMS Proxy: Found mock user by email:', mockUserByEmail.id);
            effectiveUserId = mockUserByEmail.id;
          } else {
            console.log('TMS Proxy: No mock user found, will create token dynamically');
            // Keep database user ID - the auth service will handle creating a mock token
            effectiveUserId = dbUser.id;
          }
        }
      } else {
        // Production mode - use database user ID
        effectiveUserId = dbUser.id;
      }
    } else {
      console.log('TMS Proxy: No database user found');
      
      // In mock mode, check if there's a mock user for this Clerk ID
      if (process.env.NEXT_PUBLIC_USE_MOCK_TMS_API === 'true') {
        const { mockDataStore } = await import('@/src/lib/mock-tms-api/mock-data-store');
        const mockUser = mockDataStore.getUserByClerkId(user.id);
        if (mockUser) {
          console.log('TMS Proxy: Found mock user without database record:', mockUser.id);
          effectiveUserId = mockUser.id;
        }
      }
    }

    // Create a minimal agent context for the tool
    const context: AgentContext = {
      teamId: 'tms-proxy-team',
      managerId: contextUserId, // Use database ID for context if available
      transformationPhase: 'assessment',
      currentAgent: 'OnboardingAgent',
      conversationId: 'tms-proxy-' + Date.now(),
      messageHistory: [],
      metadata: {}
    };
    
    // For auth-related operations, we need to pass the effective user ID
    if (tool === 'tms_debrief_report' || tool === 'tms_generate_html_report') {
      // These tools need the actual user ID that will be used for authentication
      context.managerId = effectiveUserId;
    }

    // Execute the tool
    const result = await tmsTool.execute(parameters, context);
    
    return NextResponse.json({
      success: result.success,
      result: result.output?.raw || result.output,
      formatted: result.output?.formatted,
      error: result.error,
      tool: tool
    });
  } catch (error) {
    console.error('TMS proxy error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error
      },
      { status: 500 }
    );
  }
}