/**
 * Image Download Service
 * Downloads and stores report images locally
 */

import { createClient } from '@supabase/supabase-js';

interface ProcessedImage {
  storagePath: string;
  imageType: 'wheel' | 'graph' | 'asset';
  altText?: string;
  metadata?: any;
}

export class ImageDownloadService {
  private supabase;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Download all images from report HTML
   */
  async downloadReportImages(html: string, reportId: string): Promise<Map<string, ProcessedImage>> {
    const imageMap = new Map<string, ProcessedImage>();
    
    // Extract all image URLs
    const imageUrls = this.extractImageUrls(html);
    
    // Download each image
    for (const url of imageUrls) {
      try {
        const processed = await this.downloadImage(url, reportId);
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
   * Extract image URLs from HTML
   */
  private extractImageUrls(html: string): string[] {
    const urls: string[] = [];
    const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
    let match;

    while ((match = imgRegex.exec(html)) !== null) {
      urls.push(match[1]);
    }

    return [...new Set(urls)]; // Remove duplicates
  }

  /**
   * Download a single image
   */
  private async downloadImage(url: string, reportId: string): Promise<ProcessedImage | null> {
    try {
      // Determine image type from URL
      const imageType = this.getImageType(url);
      
      // For now, we'll store the original URL as a reference
      // In a real implementation, we would download and store in Supabase Storage
      
      // Generate storage path
      const filename = this.generateFilename(url, imageType);
      const storagePath = `reports/${reportId}/${filename}`;

      // Extract metadata from URL (for charts)
      const metadata = this.extractChartParams(url);

      return {
        storagePath,
        imageType,
        altText: this.generateAltText(imageType, metadata),
        metadata
      };
    } catch (error) {
      console.error('Image download failed:', error);
      return null;
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