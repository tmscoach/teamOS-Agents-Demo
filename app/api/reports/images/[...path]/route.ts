/**
 * Report Image Proxy API
 * GET /api/reports/images/[...path]
 * Proxies graph and asset requests to TMS API
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { MockTMSAPIClient } from '@/src/lib/mock-tms-api/mock-api-client';
import { TMSAuthService } from '@/src/lib/agents/tools/tms-auth-service';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ path: string[] }> }
) {
  const params = await props.params;
  
  try {
    const path = params.path;
    const pathString = path.join('/');
    const url = new URL(request.url);
    const queryString = url.search;
    
    console.log('[Image Proxy] Request for:', pathString, 'Query:', queryString);

    // Get current user
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get database user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { clerkId: session.userId },
          { email: session.userId } // For dev auth
        ]
      },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get JWT token for TMS API calls
    const authService = new TMSAuthService();
    const jwt = await authService.getTokenForUser(user.id);

    // Create mock API client
    const mockApi = new MockTMSAPIClient();

    // Handle GetGraph requests
    if (pathString === 'GetGraph' || pathString.startsWith('GetGraph')) {
      console.log('[Image Proxy] Generating graph with query:', queryString);
      
      try {
        // Call the mock API's graph generation
        const graphBuffer = await mockApi.request({
          method: 'GET',
          endpoint: `/GetGraph${queryString}`,
          jwt
        });

        if (graphBuffer instanceof Buffer) {
          return new NextResponse(graphBuffer, {
            headers: {
              'Content-Type': 'image/png',
              'Cache-Control': 'public, max-age=3600'
            }
          });
        } else {
          console.error('[Image Proxy] Graph generation did not return a buffer:', typeof graphBuffer);
          // Return a placeholder image or error
          return new NextResponse('Graph generation failed', { status: 500 });
        }
      } catch (error) {
        console.error('[Image Proxy] Graph generation error:', error);
        
        // Try to generate a mock graph as fallback
        const { generateGraph } = await import('@/src/lib/mock-tms-api/endpoints/reports');
        const graphBuffer = await generateGraph({
          endpoint: `/GetGraph${queryString}`,
          jwt
        });
        
        return new NextResponse(graphBuffer, {
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=3600'
          }
        });
      }
    }
    
    // Handle Asset requests (e.g., /Asset/Get/loadinggif or /Asset/Get/mr_circle_UM)
    if (pathString.startsWith('Asset')) {
      console.log('[Image Proxy] Fetching asset:', pathString);
      
      try {
        // First try the mock API
        const assetData = await mockApi.request({
          method: 'GET',
          endpoint: `/${pathString}`,
          jwt
        });
        
        if (assetData instanceof Buffer) {
          // Determine content type based on path
          let contentType = 'image/png';
          if (pathString.includes('gif')) contentType = 'image/gif';
          else if (pathString.includes('jpg') || pathString.includes('jpeg')) contentType = 'image/jpeg';
          
          return new NextResponse(assetData, {
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=86400' // Cache assets for 24 hours
            }
          });
        }
      } catch (error) {
        console.error('[Image Proxy] Asset fetch error:', error);
      }
      
      // Fallback: Try direct fetch from TMS API
      try {
        const assetUrl = `https://api-test.tms.global/${pathString}`;
        const response = await fetch(assetUrl, {
          headers: jwt ? { 'Authorization': `Bearer ${jwt}` } : {}
        });
        
        if (response.ok) {
          const buffer = await response.arrayBuffer();
          return new NextResponse(buffer, {
            headers: {
              'Content-Type': response.headers.get('Content-Type') || 'image/png',
              'Cache-Control': 'public, max-age=86400'
            }
          });
        }
      } catch (fetchError) {
        console.error('[Image Proxy] Direct fetch error:', fetchError);
      }
      
      // Return a placeholder or error
      return new NextResponse('Asset not found', { status: 404 });
    }
    
    // Unknown path
    console.warn('[Image Proxy] Unknown path:', pathString);
    return new NextResponse('Not found', { status: 404 });
    
  } catch (error) {
    console.error('[Image Proxy] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to proxy image' },
      { status: 500 }
    );
  }
}