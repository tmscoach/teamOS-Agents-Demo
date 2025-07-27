import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import { mockDataStore } from '@/src/lib/mock-tms-api/mock-data-store';

// Define allowed domains for security
const ALLOWED_DOMAINS = [
  'api-test.tms.global',
  'api.tms.global',
  'cdn.tms.global',
  'tmsystem.com',
  'api.tmsystem.com',
  'cdn.tmsystem.com'
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let imageUrl = searchParams.get('url');
    
    if (!imageUrl) {
      return new NextResponse('Missing image URL', { status: 400 });
    }

    // Decode HTML entities (like &amp; to &)
    imageUrl = imageUrl
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'");

    // Validate URL and domain for security
    let url: URL;
    try {
      url = new URL(imageUrl);
    } catch (e) {
      return new NextResponse('Invalid URL format', { status: 400 });
    }

    // Check if the hostname is in our allowed list
    if (!ALLOWED_DOMAINS.includes(url.hostname)) {
      console.error(`Blocked image proxy request to unauthorized domain: ${url.hostname}`);
      return new NextResponse('Unauthorized domain', { status: 403 });
    }

    // Only allow HTTPS connections for security
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return new NextResponse('Only HTTP(S) protocols allowed', { status: 400 });
    }

    // Get the auth token - we'll use the same approach as the main TMS proxy
    const session = await auth();
    if (!session?.userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // For mock API, we need to get or generate a token
    let bearerToken: string | null = null;
    
    // First check if we're using mock API
    const apiMode = process.env.TMS_API_MODE || 'mock';
    
    if (apiMode === 'mock') {
      // For mock mode, generate a token for the current user
      const mockUser = mockDataStore.getUserByClerkId(session.userId);
      if (mockUser) {
        // Generate a mock JWT token
        const { MockTMSClient } = await import('@/src/lib/mock-tms-api/mock-api-client');
        const mockClient = new MockTMSClient();
        bearerToken = mockClient.generateJWT({
          sub: mockUser.id,
          userId: mockUser.id,
          userType: mockUser.userType || 'Respondent',
          organisationId: mockUser.organizationId,
          email: mockUser.email
        });
      }
    } else {
      // For live mode, get from database
      const dbUser = await prisma.user.findUnique({
        where: { clerkId: session.userId },
        include: { TMSAuthToken: true }
      });
      
      if (dbUser?.TMSAuthToken?.tmsJwtToken) {
        bearerToken = dbUser.TMSAuthToken.tmsJwtToken;
      }
    }

    // Log the request details for debugging
    console.log(`[Image Proxy] Fetching: ${imageUrl}`);
    console.log(`[Image Proxy] Has token: ${!!bearerToken}`);

    // Prepare headers
    const headers: HeadersInit = {
      'User-Agent': 'teamOS/1.0',
      'Accept': 'image/*',
    };
    
    if (bearerToken) {
      headers['Authorization'] = `Bearer ${bearerToken}`;
    }

    // Fetch the image from TMS API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    let response;
    try {
      response = await fetch(imageUrl, {
        headers,
        signal: controller.signal,
      });
    } catch (fetchError: any) {
      console.error(`[Image Proxy] Fetch error:`, fetchError);
      if (fetchError.name === 'AbortError') {
        return new NextResponse('Request timeout', { status: 504 });
      }
      throw fetchError;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      console.log(`[Image Proxy] Failed to fetch image from ${imageUrl}: ${response.status}`);
      
      // Return a simple placeholder SVG for failed images
      const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
        <rect width="400" height="300" fill="#f0f0f0" stroke="#ccc" stroke-width="2"/>
        <text x="200" y="150" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#666">Image Unavailable</text>
        <text x="200" y="170" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#999">${url.pathname}</text>
      </svg>`;
      
      return new NextResponse(placeholderSvg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-store',
        },
      });
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    
    // Validate content type is an image
    if (!contentType.startsWith('image/')) {
      return new NextResponse('Invalid content type - only images allowed', { status: 400 });
    }

    const buffer = await response.arrayBuffer();
    
    // Check file size limit (10MB)
    if (buffer.byteLength > 10 * 1024 * 1024) {
      return new NextResponse('Image too large', { status: 413 });
    }

    // Return the image with proper headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error proxying image:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}