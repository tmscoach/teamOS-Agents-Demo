import { DocumentParser } from '../ingestion/parser';
import { DocumentChunker } from '../ingestion/chunker';
import { knowledgeBaseTools } from '../tools/agent-tools';

describe('Knowledge Base Integration', () => {
  describe('Document Processing Pipeline', () => {
    it('should process a document from parsing to chunking', async () => {
      // Parser would be used here in a real integration test
      const chunker = new DocumentChunker();
      
      const mockDocument = {
        title: 'Test Handbook',
        sourcePath: '/test/handbook.md',
        documentType: 'HANDBOOK' as const,
        content: `# Test Handbook
        
## Introduction
This handbook provides guidance on team management.

## Chapter 1: Leadership
Effective leadership is crucial for team success.

### 1.1 Communication
Leaders must communicate clearly and frequently.

## Chapter 2: Goal Setting
Teams need clear, measurable goals.`,
        metadata: {
          title: 'Test Handbook',
          sourcePath: '/test/handbook.md',
          documentType: 'HANDBOOK' as const
        },
        chunks: []
      };
      
      const chunks = await chunker.chunkDocument(mockDocument);
      
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.every(c => c.content.length > 0)).toBe(true);
      expect(chunks.every(c => c.metadata)).toBe(true);
    });
  });
  
  describe('Agent Tools', () => {
    it('should have all required knowledge base tools', () => {
      const toolNames = knowledgeBaseTools.map(t => t.name);
      
      expect(toolNames).toContain('search_tms_knowledge');
      expect(toolNames).toContain('get_assessment_methodology');
      expect(toolNames).toContain('get_questionnaire_items');
      expect(toolNames).toContain('search_intervention_strategies');
      expect(toolNames).toContain('get_benchmark_data');
    });
    
    it('should have valid tool parameters', () => {
      for (const tool of knowledgeBaseTools) {
        expect(tool.parameters).toBeDefined();
        expect(tool.parameters.type).toBe('object');
        expect(tool.parameters.properties).toBeDefined();
        expect(tool.execute).toBeInstanceOf(Function);
      }
    });
  });
});