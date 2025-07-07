import { DocumentChunk, ChunkMetadata, ProcessedDocument } from '../types';

export interface ChunkerOptions {
  chunkSize: number;
  chunkOverlap: number;
  preserveSections: boolean;
}

export class DocumentChunker {
  private readonly defaultOptions: ChunkerOptions = {
    chunkSize: 800,
    chunkOverlap: 200,
    preserveSections: true
  };
  
  async chunkDocument(
    document: ProcessedDocument, 
    options?: Partial<ChunkerOptions>
  ): Promise<DocumentChunk[]> {
    const opts = { ...this.defaultOptions, ...options };
    
    if (opts.preserveSections) {
      return this.chunkBySections(document, opts);
    } else {
      return this.chunkBySize(document, opts);
    }
  }
  
  private chunkBySections(
    document: ProcessedDocument, 
    options: ChunkerOptions
  ): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const sections = this.splitIntoSections(document.content);
    
    let chunkIndex = 0;
    
    for (const section of sections) {
      if (section.content.length <= options.chunkSize) {
        chunks.push({
          content: section.content,
          chunkIndex: chunkIndex++,
          metadata: {
            startOffset: section.startOffset,
            endOffset: section.endOffset,
            section: section.header,
            headers: section.headers,
            context: this.getContext(sections, sections.indexOf(section))
          }
        });
      } else {
        const subChunks = this.splitLargeSection(section, options);
        for (const subChunk of subChunks) {
          chunks.push({
            content: subChunk.content,
            chunkIndex: chunkIndex++,
            metadata: {
              ...subChunk.metadata,
              section: section.header,
              headers: section.headers
            }
          });
        }
      }
    }
    
    return chunks;
  }
  
  private chunkBySize(
    document: ProcessedDocument, 
    options: ChunkerOptions
  ): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const content = document.content;
    const { chunkSize, chunkOverlap } = options;
    
    let startOffset = 0;
    let chunkIndex = 0;
    
    while (startOffset < content.length) {
      const endOffset = Math.min(startOffset + chunkSize, content.length);
      const chunkContent = content.slice(startOffset, endOffset);
      
      chunks.push({
        content: chunkContent,
        chunkIndex: chunkIndex++,
        metadata: {
          startOffset,
          endOffset,
          headers: this.extractHeadersFromRange(content, startOffset, endOffset)
        }
      });
      
      startOffset = Math.max(0, endOffset - chunkOverlap);
    }
    
    return chunks;
  }
  
  private splitIntoSections(content: string): Section[] {
    const sections: Section[] = [];
    const lines = content.split('\n');
    
    let currentSection: Section | null = null;
    let currentHeaders: string[] = [];
    let offset = 0;
    
    for (const line of lines) {
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      
      if (headerMatch) {
        if (currentSection) {
          currentSection.endOffset = offset - 1;
          sections.push(currentSection);
        }
        
        const level = headerMatch[1].length;
        const header = headerMatch[2];
        
        currentHeaders = currentHeaders.slice(0, level - 1);
        currentHeaders.push(header);
        
        currentSection = {
          header,
          content: line + '\n',
          startOffset: offset,
          endOffset: offset + line.length,
          headers: [...currentHeaders]
        };
      } else if (currentSection) {
        currentSection.content += line + '\n';
      } else {
        currentSection = {
          header: 'Introduction',
          content: line + '\n',
          startOffset: offset,
          endOffset: offset + line.length,
          headers: ['Introduction']
        };
      }
      
      offset += line.length + 1;
    }
    
    if (currentSection) {
      currentSection.endOffset = offset - 1;
      sections.push(currentSection);
    }
    
    return sections;
  }
  
  private splitLargeSection(section: Section, options: ChunkerOptions): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const { chunkSize, chunkOverlap } = options;
    
    let startPos = 0;
    
    while (startPos < section.content.length) {
      const endPos = Math.min(startPos + chunkSize, section.content.length);
      let chunkEnd = endPos;
      
      if (endPos < section.content.length) {
        const lastPeriod = section.content.lastIndexOf('.', endPos);
        const lastNewline = section.content.lastIndexOf('\n', endPos);
        chunkEnd = Math.max(lastPeriod, lastNewline) > startPos 
          ? Math.max(lastPeriod, lastNewline) + 1 
          : endPos;
      }
      
      chunks.push({
        content: section.content.slice(startPos, chunkEnd),
        chunkIndex: 0,
        metadata: {
          startOffset: section.startOffset + startPos,
          endOffset: section.startOffset + chunkEnd,
          headers: section.headers,
          subsection: `Part ${chunks.length + 1}`
        }
      });
      
      startPos = Math.max(0, chunkEnd - chunkOverlap);
    }
    
    return chunks;
  }
  
  private getContext(sections: Section[], currentIndex: number): string {
    const contextParts: string[] = [];
    
    if (currentIndex > 0) {
      contextParts.push(`Previous: ${sections[currentIndex - 1].header}`);
    }
    
    if (currentIndex < sections.length - 1) {
      contextParts.push(`Next: ${sections[currentIndex + 1].header}`);
    }
    
    return contextParts.join(' | ');
  }
  
  private extractHeadersFromRange(content: string, start: number, end: number): string[] {
    const chunk = content.slice(Math.max(0, start - 500), end);
    const headers: string[] = [];
    const lines = chunk.split('\n');
    
    for (const line of lines) {
      const match = line.match(/^#{1,6}\s+(.+)$/);
      if (match) {
        headers.push(match[1]);
      }
    }
    
    return headers;
  }
}

interface Section {
  header: string;
  content: string;
  startOffset: number;
  endOffset: number;
  headers: string[];
}