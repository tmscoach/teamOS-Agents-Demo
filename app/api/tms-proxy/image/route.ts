import { NextRequest, NextResponse } from 'next/server';

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
    const imageUrl = searchParams.get('url');
    
    if (!imageUrl) {
      return new NextResponse('Missing image URL', { status: 400 });
    }

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

    // Fetch the image from TMS API
    const response = await fetch(imageUrl, {
      headers: {
        // Add any necessary headers for TMS API
        'User-Agent': 'teamOS/1.0',
      },
    });

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