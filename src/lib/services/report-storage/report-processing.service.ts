/**
 * Report Processing Service
 * Handles HTML parsing, text extraction, and chunking
 */

import { ReportMetadata } from './types';

interface ReportChunk {
  sectionId: string;
  sectionTitle: string;
  content: string;
  metadata?: any;
}

interface ProcessedImage {
  storagePath: string;
  imageType: string;
  altText?: string;
  metadata?: any;
}

export class ReportProcessingService {
  /**
   * Extract metadata from report HTML
   */
  extractMetadata(html: string, reportType: string): ReportMetadata {
    const metadata: ReportMetadata = {
      title: this.extractTitle(html, reportType),
      sections: this.extractSections(html)
    };

    // Extract user and organization info
    const userMatch = html.match(/<label>Name<\/label>\s*<p>([^<]+)<\/p>/);
    if (userMatch) {
      metadata.userName = userMatch[1].trim();
    }

    const orgMatch = html.match(/<label>Organisation<\/label>\s*<p>([^<]+)<\/p>/);
    if (orgMatch) {
      metadata.organizationName = orgMatch[1].trim();
    }

    // Extract profile information
    const majorRoleMatch = html.match(/<label>Major Role<\/label>\s*<p>([^<]+)<\/p>/);
    if (majorRoleMatch) {
      metadata.profile = {
        name: majorRoleMatch[1].trim(),
        majorRole: majorRoleMatch[1].trim()
      };
    }

    // Extract scores for TMP
    if (reportType === 'TMP') {
      metadata.scores = this.extractTMPScores(html);
    }

    return metadata;
  }

  /**
   * Extract report title based on type
   */
  private extractTitle(html: string, reportType: string): string {
    const titleMap: Record<string, string> = {
      'TMP': 'Team Management Profile',
      'QO2': 'QO² Assessment',
      'TEAM_SIGNALS': 'Team Signals Report',
      'TEAM_SIGNALS_360': 'Team Signals 360 Report'
    };

    // Try to extract from HTML first
    const h1Match = html.match(/<h1>([^<]+)<\/h1>/);
    if (h1Match) {
      return h1Match[1].trim();
    }

    return titleMap[reportType] || 'Assessment Report';
  }

  /**
   * Extract sections from table of contents
   */
  private extractSections(html: string): Array<{ id: string; title: string }> {
    const sections: Array<{ id: string; title: string }> = [];
    
    // Look for table of contents links
    const tocRegex = /<a href="#(\w+)"[^>]*>([^<]+)<\/a>/g;
    let match;

    while ((match = tocRegex.exec(html)) !== null) {
      sections.push({
        id: match[1],
        title: match[2].trim()
      });
    }

    return sections;
  }

  /**
   * Extract TMP scores from HTML
   */
  private extractTMPScores(html: string): Record<string, number> | undefined {
    const scores: Record<string, number> = {};
    
    // Extract RIDO scores (e.g., "These are I: 7; C: 3; B: 5; S: 9")
    const scoresMatch = html.match(/These are ([A-Z]: \d+(?:; [A-Z]: \d+)*)/);
    if (scoresMatch) {
      const scorePairs = scoresMatch[1].split('; ');
      scorePairs.forEach(pair => {
        const [key, value] = pair.split(': ');
        scores[key] = parseInt(value, 10);
      });
    }

    return Object.keys(scores).length > 0 ? scores : undefined;
  }

  /**
   * Replace image URLs with local storage paths
   */
  replaceImageUrls(html: string, imageMap: Map<string, ProcessedImage>): string {
    let processedHtml = html;

    imageMap.forEach((processed, originalUrl) => {
      // Replace with local storage URL
      const localUrl = `/api/reports/images/${processed.storagePath}`;
      processedHtml = processedHtml.replace(
        new RegExp(originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        localUrl
      );
    });

    return processedHtml;
  }

  /**
   * Extract chunks from report HTML
   */
  extractChunks(html: string, reportType: string): ReportChunk[] {
    const chunks: ReportChunk[] = [];
    
    // Parse HTML to extract sections
    const sections = this.parseSections(html);
    
    sections.forEach(section => {
      // Create chunks from section content
      const sectionChunks = this.chunkSection(section);
      chunks.push(...sectionChunks);
    });

    return chunks;
  }

  /**
   * Parse HTML sections
   */
  private parseSections(html: string): Array<{ id: string; title: string; content: string }> {
    const sections: Array<{ id: string; title: string; content: string }> = [];
    
    // Match sections by id attribute
    const sectionRegex = /<section[^>]+id="([^"]+)"[^>]*>([\s\S]*?)<\/section>/g;
    let match;

    while ((match = sectionRegex.exec(html)) !== null) {
      const sectionId = match[1];
      const sectionHtml = match[2];
      
      // Extract section title
      const titleMatch = sectionHtml.match(/<h2[^>]*>([^<]+)<\/h2>/);
      const title = titleMatch ? titleMatch[1].trim() : sectionId;
      
      // Extract text content (remove HTML tags)
      const textContent = this.extractTextContent(sectionHtml);
      
      if (textContent.length > 0) {
        sections.push({
          id: sectionId,
          title,
          content: textContent
        });
      }
    }

    return sections;
  }

  /**
   * Extract text content from HTML
   */
  private extractTextContent(html: string): string {
    // Remove script and style elements
    let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    
    // Replace HTML tags with space
    text = text.replace(/<[^>]+>/g, ' ');
    
    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    // Decode HTML entities
    text = this.decodeHtmlEntities(text);
    
    return text;
  }

  /**
   * Decode HTML entities
   */
  private decodeHtmlEntities(text: string): string {
    const entities: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&nbsp;': ' '
    };

    return text.replace(/&[#\w]+;/g, match => entities[match] || match);
  }

  /**
   * Chunk a section into smaller pieces
   */
  private chunkSection(section: { id: string; title: string; content: string }): ReportChunk[] {
    const chunks: ReportChunk[] = [];
    const maxChunkSize = 1000; // characters
    const overlap = 100; // characters
    
    if (section.content.length <= maxChunkSize) {
      // Section is small enough to be a single chunk
      chunks.push({
        sectionId: section.id,
        sectionTitle: section.title,
        content: section.content
      });
    } else {
      // Split into multiple chunks with overlap
      let start = 0;
      while (start < section.content.length) {
        const end = Math.min(start + maxChunkSize, section.content.length);
        const content = section.content.substring(start, end);
        
        chunks.push({
          sectionId: section.id,
          sectionTitle: section.title,
          content,
          metadata: {
            chunkStart: start,
            chunkEnd: end,
            totalLength: section.content.length
          }
        });
        
        start = end - overlap;
      }
    }

    return chunks;
  }
}