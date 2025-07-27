/**
 * Report Image Serving API
 * GET /api/reports/images/[...path]
 * Serves images from Supabase storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ path: string[] }> }
) {
  const params = await props.params;
  
  try {
    // Reconstruct the full path
    const storagePath = params.path.join('/');
    
    if (!storagePath) {
      return new NextResponse('Missing image path', { status: 400 });
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Download image from Supabase storage
    const { data, error } = await supabase.storage
      .from('report-images')
      .download(storagePath);

    if (error || !data) {
      console.error('Failed to download image from Supabase:', error);
      
      // Return a placeholder image
      const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
        <rect width="400" height="300" fill="#f0f0f0" stroke="#ccc" stroke-width="2"/>
        <text x="200" y="150" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#666">Image Not Found</text>
        <text x="200" y="170" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#999">${storagePath}</text>
      </svg>`;
      
      return new NextResponse(placeholderSvg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-store',
        },
      });
    }

    // Get the blob and convert to array buffer
    const arrayBuffer = await data.arrayBuffer();

    // Return the image with proper headers
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}