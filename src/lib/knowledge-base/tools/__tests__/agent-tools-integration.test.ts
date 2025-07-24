/**
 * Integration tests for knowledge base agent tools
 */

import { knowledgeBaseTools } from '../agent-tools';
import { KnowledgeSearchService } from '../../retrieval/search';
import prisma from '@/lib/db';

// Mock the search service
jest.mock('../../retrieval/search');

describe('Knowledge Base Agent Tools Integration', () => {
  const mockSearchService = KnowledgeSearchService as jest.MockedClass<typeof KnowledgeSearchService>;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('search_tms_knowledge tool', () => {
    const searchTool = knowledgeBaseTools[0];

    it('should have correct tool configuration', () => {
      expect(searchTool.name).toBe('search_tms_knowledge');
      expect(searchTool.description).toContain('Search TMS knowledge base');
      expect(searchTool.inputSchema.required).toContain('query');
    });

    it('should call search service with correct parameters', async () => {
      const mockResults = [
        {
          content: 'ICAF stands for Introvert, Creative, Analytical, Flexible',
          source: 'TMP Handbook',
          relevance: 0.95,
          metadata: { section: 'Definitions' }
        }
      ];

      mockSearchService.search.mockResolvedValue({
        results: mockResults,
        totalCount: 1,
        searchTime: 100
      });

      const result = await searchTool.execute({
        query: 'What is ICAF?',
        minRelevance: 0.3
      });

      expect(mockSearchService.search).toHaveBeenCalledWith(
        'What is ICAF?',
        expect.objectContaining({
          limit: 5,
          minRelevance: 0.3
        })
      );

      expect(result.success).toBe(true);
      expect(result.output.results).toEqual(mockResults);
    });

    it('should use default minRelevance of 0.3', async () => {
      mockSearchService.search.mockResolvedValue({
        results: [],
        totalCount: 0,
        searchTime: 50
      });

      await searchTool.execute({ query: 'test query' });

      expect(mockSearchService.search).toHaveBeenCalledWith(
        'test query',
        expect.objectContaining({
          minRelevance: 0.3 // Default lowered threshold
        })
      );
    });

    it('should handle search errors gracefully', async () => {
      mockSearchService.search.mockRejectedValue(new Error('Search failed'));

      const result = await searchTool.execute({
        query: 'test query'
      });

      expect(result.success).toBe(false);
      expect(result.output.error).toBe('Search failed');
    });

    it('should respect custom limit parameter', async () => {
      mockSearchService.search.mockResolvedValue({
        results: [],
        totalCount: 0,
        searchTime: 50
      });

      await searchTool.execute({
        query: 'test',
        limit: 10
      });

      expect(mockSearchService.search).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({
          limit: 10
        })
      );
    });

    it('should format results correctly', async () => {
      const mockResults = [
        {
          content: 'Content 1',
          source: 'Source 1',
          relevance: 0.9,
          metadata: { page: 1 }
        },
        {
          content: 'Content 2',
          source: 'Source 2',
          relevance: 0.8,
          metadata: { section: 'Intro' }
        }
      ];

      mockSearchService.search.mockResolvedValue({
        results: mockResults,
        totalCount: 2,
        searchTime: 75
      });

      const result = await searchTool.execute({
        query: 'test query'
      });

      expect(result.success).toBe(true);
      expect(result.output.results).toHaveLength(2);
      expect(result.output.totalCount).toBe(2);
      expect(result.output.searchTime).toBe(75);
    });
  });

  describe('retrieve_document_section tool', () => {
    const retrieveTool = knowledgeBaseTools[1];

    it('should have correct tool configuration', () => {
      expect(retrieveTool.name).toBe('retrieve_document_section');
      expect(retrieveTool.description).toContain('Retrieve a specific section');
      expect(retrieveTool.inputSchema.required).toContain('documentId');
      expect(retrieveTool.inputSchema.required).toContain('section');
    });

    it('should call search service retrieveSection', async () => {
      const mockSection = {
        content: 'Section content here',
        source: 'TMP Manual',
        relevance: 1,
        citation: 'TMP Manual, Chapter 3',
        metadata: { chapter: 3 }
      };

      mockSearchService.retrieveSection.mockResolvedValue(mockSection);

      const result = await retrieveTool.execute({
        documentId: 'doc-123',
        section: 'Chapter 3'
      });

      expect(mockSearchService.retrieveSection).toHaveBeenCalledWith(
        'doc-123',
        'Chapter 3'
      );

      expect(result.success).toBe(true);
      expect(result.output).toEqual(mockSection);
    });

    it('should handle section not found', async () => {
      mockSearchService.retrieveSection.mockResolvedValue(null);

      const result = await retrieveTool.execute({
        documentId: 'doc-123',
        section: 'Nonexistent'
      });

      expect(result.success).toBe(false);
      expect(result.output.error).toBe('Section not found');
    });

    it('should handle retrieval errors', async () => {
      mockSearchService.retrieveSection.mockRejectedValue(
        new Error('Database error')
      );

      const result = await retrieveTool.execute({
        documentId: 'doc-123',
        section: 'Chapter 1'
      });

      expect(result.success).toBe(false);
      expect(result.output.error).toBe('Database error');
    });
  });

  describe('questionnaire_lookup tool', () => {
    const questionnaireTool = knowledgeBaseTools[2];

    it('should have correct tool configuration', () => {
      expect(questionnaireTool.name).toBe('questionnaire_lookup');
      expect(questionnaireTool.description).toContain('questionnaire items');
      expect(questionnaireTool.inputSchema.required).toContain('assessmentType');
    });

    it('should call search service getQuestionnaireItems', async () => {
      const mockItems = [
        {
          id: 'q1',
          questionText: 'Question 1',
          responseOptions: ['Yes', 'No'],
          scoringFormula: 'simple',
          category: 'Category A',
          assessmentType: 'TMP',
          source: 'TMP Questionnaire',
          metadata: {}
        }
      ];

      mockSearchService.getQuestionnaireItems.mockResolvedValue(mockItems);

      const result = await questionnaireTool.execute({
        assessmentType: 'TMP',
        category: 'Category A'
      });

      expect(mockSearchService.getQuestionnaireItems).toHaveBeenCalledWith({
        assessmentType: 'TMP',
        category: 'Category A'
      });

      expect(result.success).toBe(true);
      expect(result.output.items).toEqual(mockItems);
      expect(result.output.count).toBe(1);
    });

    it('should handle no items found', async () => {
      mockSearchService.getQuestionnaireItems.mockResolvedValue([]);

      const result = await questionnaireTool.execute({
        assessmentType: 'WOW'
      });

      expect(result.success).toBe(true);
      expect(result.output.items).toEqual([]);
      expect(result.output.count).toBe(0);
    });

    it('should handle lookup errors', async () => {
      mockSearchService.getQuestionnaireItems.mockRejectedValue(
        new Error('Query failed')
      );

      const result = await questionnaireTool.execute({
        assessmentType: 'QO2'
      });

      expect(result.success).toBe(false);
      expect(result.output.error).toBe('Query failed');
    });
  });
});