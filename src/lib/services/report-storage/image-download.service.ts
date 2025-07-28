/**
 * Image Download Service
 * Downloads and stores report images locally
 */

import { createClient } from '@supabase/supabase-js';
import { VisionAnalysisService } from './vision-analysis.service';

interface ProcessedImage {
  storagePath: string;
  imageType: 'wheel' | 'graph' | 'asset';
  altText?: string;
  detailedDescription?: string;
  extractedData?: any;
  insights?: string[];
  embedding?: number[];
  metadata?: any;
}

interface DownloadOptions {
  jwt?: string;
  userId?: string;
}

export class ImageDownloadService {
  private supabase;
  private visionService: VisionAnalysisService;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.visionService = new VisionAnalysisService();
  }

  /**
   * Download all images from report HTML
   */
  async downloadReportImages(html: string, reportId: string, options?: DownloadOptions): Promise<Map<string, ProcessedImage>> {
    const imageMap = new Map<string, ProcessedImage>();
    
    // Extract all image URLs
    const imageUrls = this.extractImageUrls(html);
    
    // Get JWT token for authentication
    const jwt = await this.getJwtToken(options);
    
    // Download each image
    for (const url of imageUrls) {
      try {
        const processed = await this.downloadImage(url, reportId, jwt);
        if (processed) {
          imageMap.set(url, processed);
        }
      } catch (error) {
        console.error(`Failed to download image ${url}:`, error);
        // Continue with other images
      }
    }

    return imageMap;
  }

  /**
   * Get JWT token for image downloads
   */
  private async getJwtToken(options?: DownloadOptions): Promise<string | null> {
    // If JWT provided directly, use it
    if (options?.jwt) {
      return options.jwt;
    }

    // In the new architecture, JWT should always be provided
    // The report loader generates it before storing
    return null;
  }

  /**
   * Extract image URLs from HTML
   */
  private extractImageUrls(html: string): string[] {
    const urls: string[] = [];
    const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
    let match;

    while ((match = imgRegex.exec(html)) !== null) {
      let url = match[1];
      // Remove trailing backslash if present
      if (url.endsWith('\\')) {
        url = url.slice(0, -1);
      }
      urls.push(url);
    }

    return [...new Set(urls)]; // Remove duplicates
  }

  /**
   * Download a single image
   */
  private async downloadImage(url: string, reportId: string, jwt: string | null): Promise<ProcessedImage | null> {
    try {
      // Decode HTML entities in URL
      let decodedUrl = url
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'");

      // Fix double slashes in URL path (but not in protocol)
      decodedUrl = decodedUrl.replace(/([^:])\/\//g, '$1/');

      console.log(`[Image Download] Processing URL: ${decodedUrl}`);
      
      // Special logging for the problematic wheel
      if (decodedUrl.includes('CreateTMPQWheel')) {
        console.log(`[Image Download] CreateTMPQWheel detected - Full URL: ${decodedUrl}`);
        console.log(`[Image Download] Original URL (before decoding): ${url}`);
        try {
          const urlObj = new URL(decodedUrl);
          console.log(`[Image Download] Query params:`, urlObj.search);
          console.log(`[Image Download] Pathname:`, urlObj.pathname);
        } catch (e) {
          console.error(`[Image Download] Failed to parse CreateTMPQWheel URL:`, e);
        }
      }

      // Determine image type from URL
      const imageType = this.getImageType(decodedUrl);
      
      // Generate storage path
      const filename = this.generateFilename(decodedUrl, imageType);
      const storagePath = `reports/${reportId}/${filename}`;

      // Extract metadata from URL (for charts)
      const metadata = this.extractChartParams(decodedUrl);

      // Download the actual image
      console.log(`[Image Download] Fetching with JWT: ${!!jwt}`);
      const imageData = await this.fetchImageData(decodedUrl, jwt);
      if (!imageData) {
        console.error(`[Image Download] Failed to fetch image data from ${decodedUrl}`);
        return null;
      }
      console.log(`[Image Download] Successfully fetched ${imageData.length} bytes`);

      // Upload to Supabase storage
      console.log(`[Image Download] Uploading to Supabase: ${storagePath}`);
      const uploaded = await this.uploadToSupabase(imageData, storagePath);
      if (!uploaded) {
        console.error(`[Image Download] Failed to upload image to Supabase: ${storagePath}`);
        return null;
      }
      console.log(`[Image Download] Successfully uploaded to ${storagePath}`);

      // Analyze image with vision AI
      let visionAnalysis = null;
      let embedding = null;
      
      try {
        console.log(`[Image Download] Starting vision analysis for ${imageType} image`);
        visionAnalysis = await this.visionService.analyzeImage(imageData, imageType, metadata);
        
        // Generate embedding from the detailed description
        if (visionAnalysis.detailedDescription) {
          embedding = await this.visionService.generateImageEmbedding(visionAnalysis.detailedDescription);
          console.log(`[Image Download] Generated embedding with ${embedding.length} dimensions`);
        }
      } catch (error) {
        console.error(`[Image Download] Vision analysis failed:`, error);
        // Continue without vision analysis
      }

      return {
        storagePath,
        imageType,
        altText: this.generateAltText(imageType, metadata),
        detailedDescription: visionAnalysis?.detailedDescription,
        extractedData: visionAnalysis?.extractedData,
        insights: visionAnalysis?.insights,
        embedding,
        metadata
      };
    } catch (error) {
      console.error('Image download failed:', error);
      return null;
    }
  }

  /**
   * Fetch image data from URL
   */
  private async fetchImageData(url: string, jwt: string | null): Promise<Buffer | null> {
    try {
      const headers: HeadersInit = {
        'User-Agent': 'teamOS/1.0',
        'Accept': 'image/*',
      };
      
      if (jwt) {
        headers['Authorization'] = `Bearer ${jwt}`;
      }

      console.log(`[Image Fetch] URL: ${url}`);
      console.log(`[Image Fetch] Has Auth: ${!!jwt}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(url, {
        headers,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`[Image Fetch] Failed: ${response.status} ${response.statusText}`);
        console.error(`[Image Fetch] URL was: ${url}`);
        
        // If it's a 500 error and contains GetGraph, try the mock API
        if (response.status === 500 && url.includes('GetGraph')) {
          console.log(`[Image Fetch] Attempting fallback to mock API for GetGraph`);
          
          try {
            // Use the mock API endpoint directly
            const { MockTMSAPIClient } = await import('@/src/lib/mock-tms-api/mock-api-client');
            const mockApi = new MockTMSAPIClient();
            
            // Extract the endpoint from the URL
            const urlObj = new URL(url);
            const endpoint = urlObj.pathname + urlObj.search;
            
            const mockResponse = await mockApi.request({
              method: 'GET',
              endpoint: endpoint,
              jwt: jwt || undefined
            });
            
            if (mockResponse instanceof Buffer) {
              console.log(`[Image Fetch] Mock API fallback successful`);
              return mockResponse;
            }
          } catch (mockError) {
            console.error(`[Image Fetch] Mock API fallback failed:`, mockError);
          }
        }
        
        return null;
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('Image fetch timeout');
      } else {
        console.error('Image fetch error:', error);
      }
      return null;
    }
  }

  /**
   * Upload image to Supabase storage
   */
  private async uploadToSupabase(imageData: Buffer, storagePath: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.storage
        .from('report-images')
        .upload(storagePath, imageData, {
          contentType: 'image/png',
          upsert: true
        });

      if (error) {
        console.error('Supabase upload error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Upload to Supabase failed:', error);
      return false;
    }
  }

  /**
   * Determine image type from URL
   */
  private getImageType(url: string): 'wheel' | 'graph' | 'asset' {
    if (url.includes('GetGraph')) {
      if (url.includes('Wheel')) {
        return 'wheel';
      }
      return 'graph';
    }
    return 'asset';
  }

  /**
   * Generate filename for storage
   */
  private generateFilename(url: string, imageType: string): string {
    const timestamp = Date.now();
    
    if (url.includes('GetGraph')) {
      const chartType = this.extractChartType(url);
      return `${imageType}_${chartType}_${timestamp}.png`;
    }
    
    // For asset images
    const match = url.match(/Asset[\\\/]Get[\\\/](\w+)/);
    if (match) {
      return `asset_${match[1]}_${timestamp}.png`;
    }
    
    return `image_${timestamp}.png`;
  }

  /**
   * Extract chart type from GetGraph URL
   */
  private extractChartType(url: string): string {
    const match = url.match(/GetGraph\?([^&]+)/);
    return match ? match[1].toLowerCase() : 'unknown';
  }

  /**
   * Extract chart parameters from URL
   */
  private extractChartParams(url: string): any {
    if (!url.includes('GetGraph')) {
      return null;
    }

    const params: any = {};
    const queryString = url.split('?')[1];
    
    if (queryString) {
      const parts = queryString.split('&');
      const chartType = parts[0];
      params.chartType = chartType;

      for (let i = 1; i < parts.length; i++) {
        const [key, value] = parts[i].split('=');
        if (key && value) {
          params[key] = decodeURIComponent(value);
        }
      }
    }

    return params;
  }

  /**
   * Generate alt text for accessibility
   */
  private generateAltText(imageType: string, metadata: any): string {
    switch (imageType) {
      case 'wheel':
        return 'Team Management Profile Wheel showing work preferences';
      case 'graph':
        if (metadata?.chartType) {
          return `${metadata.chartType} visualization`;
        }
        return 'Report data visualization';
      case 'asset':
        return 'Report asset image';
      default:
        return 'Report image';
    }
  }

  /**
   * Actually download image data (placeholder for now)
   */
  async downloadImageData(url: string, storagePath: string): Promise<boolean> {
    // TODO: Implement actual download and storage
    // For now, we'll just return true as a placeholder
    
    // In real implementation:
    // 1. Fetch image data from URL
    // 2. Upload to Supabase Storage
    // 3. Return success/failure
    
    return true;
  }
}