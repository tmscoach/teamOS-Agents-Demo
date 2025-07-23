import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

/**
 * GET /api/admin/tms-api/graph
 * Proxy endpoint for serving graph images from live TMS API
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Use the test JWT token from environment variable
    const jwt = process.env.TMS_TEST_JWT;
    if (!jwt) {
      throw new Error('TMS_TEST_JWT not configured in environment');
    }
    
    // Build the live API URL from query string
    const queryString = request.url.split('?')[1] || '';
    const liveApiUrl = `https://api-test.tms.global/GetGraph?${queryString}`;
    
    // Fetch from live TMS API
    const response = await fetch(liveApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Accept': 'image/png',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Live API returned ${response.status}: ${response.statusText}`);
    }
    
    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    
    // Return the image
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error('Graph generation error:', error);
    // Return a 1x1 transparent PNG as fallback
    const transparentPNG = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
      0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
      0x54, 0x78, 0x9C, 0x62, 0x00, 0x00, 0x00, 0x02,
      0x00, 0x01, 0xE5, 0x27, 0xDE, 0xFC, 0x00, 0x00,
      0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42,
      0x60, 0x82
    ]);
    return new NextResponse(transparentPNG, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache',
      },
    });
  }
}