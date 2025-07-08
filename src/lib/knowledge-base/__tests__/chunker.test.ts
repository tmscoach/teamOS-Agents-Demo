import { DocumentChunker } from '../ingestion/chunker';
import { ProcessedDocument } from '../types';

describe('DocumentChunker', () => {
  let chunker: DocumentChunker;
  
  beforeEach(() => {
    chunker = new DocumentChunker();
  });
  
  describe('chunkDocument', () => {
    it('should chunk document by sections', async () => {
      const document: ProcessedDocument = {
        title: 'Test Document',
        sourcePath: '/test/doc.md',
        documentType: 'HANDBOOK',
        content: `# Introduction
This is the introduction section with some content.

## Chapter 1
This is chapter 1 content.

### Section 1.1
Detailed content for section 1.1.

## Chapter 2
This is chapter 2 content.`,
        metadata: { title: 'Test Document', sourcePath: '/test/doc.md', documentType: 'HANDBOOK' },
        chunks: []
      };
      
      const chunks = await chunker.chunkDocument(document, { preserveSections: true });
      
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].metadata.section).toBe('Introduction');
      expect(chunks.find(c => c.metadata.section === 'Chapter 1')).toBeDefined();
      expect(chunks.find(c => c.metadata.section === 'Chapter 2')).toBeDefined();
    });
    
    it('should handle large sections by splitting them', async () => {
      const largeContent = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(30);
      const document: ProcessedDocument = {
        title: 'Large Document',
        sourcePath: '/test/large.md',
        documentType: 'HANDBOOK',
        content: `# Large Section\n${largeContent}`,
        metadata: { title: 'Large Document', sourcePath: '/test/large.md', documentType: 'HANDBOOK' },
        chunks: []
      };
      
      const chunks = await chunker.chunkDocument(document, { 
        chunkSize: 800,
        preserveSections: true 
      });
      
      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks[0].metadata.subsection).toBe('Part 1');
      expect(chunks[1].metadata.subsection).toBe('Part 2');
    });
    
    it('should chunk by size when preserveSections is false', async () => {
      const content = 'The quick brown fox jumps over the lazy dog. '.repeat(50);
      const document: ProcessedDocument = {
        title: 'Test Document',
        sourcePath: '/test/doc.md',
        documentType: 'HANDBOOK',
        content: content,
        metadata: { title: 'Test Document', sourcePath: '/test/doc.md', documentType: 'HANDBOOK' },
        chunks: []
      };
      
      const chunks = await chunker.chunkDocument(document, {
        chunkSize: 500,
        chunkOverlap: 100,
        preserveSections: false
      });
      
      expect(chunks.length).toBeGreaterThan(2);
      expect(chunks[0].content.length).toBeLessThanOrEqual(500);
      
      const overlap = chunks[0].content.substring(chunks[0].content.length - 100);
      expect(chunks[1].content.startsWith(overlap)).toBe(true);
    });
  });
});