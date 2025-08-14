import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '../search-tms-knowledge/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/src/lib/auth/clerk-dev-wrapper', () => ({
  currentUser: vi.fn()
}));

vi.mock('@/src/lib/knowledge-base/retrieval/search', () => ({
  KnowledgeBaseSearch: vi.fn().mockImplementation(() => ({
    hybridSearch: vi.fn(),
    close: vi.fn()
  }))
}));

import { currentUser } from '@/src/lib/auth/clerk-dev-wrapper';
import { KnowledgeBaseSearch } from '@/src/lib/knowledge-base/retrieval/search';

describe('GET /api/voice-tools/search-tms-knowledge', () => {
  const mockUser = { id: 'test-user-id', email: 'test@example.com' };
  const mockSearchResults = [
    {
      content: 'The Team Management Wheel is a visual representation...',
      source: 'TMP Handbook',
      relevance: 0.95,
      citation: 'TMP Handbook, Page 15'
    },
    {
      content: 'RIDO stands for Relationships, Information, Decisions, Organization...',
      source: 'TMP Handbook',
      relevance: 0.88,
      citation: 'TMP Handbook, Page 22'
    }
  ];

  let mockSearch: any;

  beforeEach(() => {
    vi.clearAllMocks();
    (currentUser as any).mockResolvedValue(mockUser);
    
    mockSearch = {
      hybridSearch: vi.fn().mockResolvedValue(mockSearchResults),
      close: vi.fn()
    };
    (KnowledgeBaseSearch as any).mockImplementation(() => mockSearch);
  });

  describe('authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      (currentUser as any).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/voice-tools/search-tms-knowledge', {
        method: 'POST',
        body: JSON.stringify({ query: 'Team Management Wheel' })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('search functionality', () => {
    it('should perform hybrid search with provided query', async () => {
      const request = new NextRequest('http://localhost:3000/api/voice-tools/search-tms-knowledge', {
        method: 'POST',
        body: JSON.stringify({
          query: 'Team Management Wheel'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockSearch.hybridSearch).toHaveBeenCalledWith(
        'Team Management Wheel',
        ['Team', 'Management', 'Wheel'],
        {
          documentTypes: undefined,
          limit: 5,
          minRelevance: 0.1
        }
      );
      expect(data.success).toBe(true);
      expect(data.output.results).toHaveLength(2);
    });

    it('should filter by document types when provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/voice-tools/search-tms-knowledge', {
        method: 'POST',
        body: JSON.stringify({
          query: 'net scores',
          document_types: ['HANDBOOK'],
          limit: 3
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockSearch.hybridSearch).toHaveBeenCalledWith(
        'net scores',
        ['net', 'scores'],
        {
          documentTypes: ['HANDBOOK'],
          limit: 3,
          minRelevance: 0.1
        }
      );
    });

    it('should handle short queries/acronyms correctly', async () => {
      const request = new NextRequest('http://localhost:3000/api/voice-tools/search-tms-knowledge', {
        method: 'POST',
        body: JSON.stringify({
          query: 'RIDO'
        })
      });

      const response = await POST(request);
      await response.json();

      // For short queries (≤5 chars), include all words as keywords
      expect(mockSearch.hybridSearch).toHaveBeenCalledWith(
        'RIDO',
        ['RIDO'],
        expect.any(Object)
      );
    });

    it('should filter short words from keywords for longer queries', async () => {
      const request = new NextRequest('http://localhost:3000/api/voice-tools/search-tms-knowledge', {
        method: 'POST',
        body: JSON.stringify({
          query: 'How is my Introvert score calculated'
        })
      });

      const response = await POST(request);
      await response.json();

      // Should filter out words ≤2 chars (is, my)
      expect(mockSearch.hybridSearch).toHaveBeenCalledWith(
        'How is my Introvert score calculated',
        ['How', 'Introvert', 'score', 'calculated'],
        expect.any(Object)
      );
    });
  });

  describe('error handling', () => {
    it('should return 400 if query is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/voice-tools/search-tms-knowledge', {
        method: 'POST',
        body: JSON.stringify({})
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Query parameter is required');
    });

    it('should handle search errors gracefully', async () => {
      mockSearch.hybridSearch.mockRejectedValue(new Error('Vector database unavailable'));

      const request = new NextRequest('http://localhost:3000/api/voice-tools/search-tms-knowledge', {
        method: 'POST',
        body: JSON.stringify({ query: 'Team Management Wheel' })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Vector database unavailable');
      expect(mockSearch.close).toHaveBeenCalled(); // Ensure cleanup on error
    });

    it('should close search connection after successful query', async () => {
      const request = new NextRequest('http://localhost:3000/api/voice-tools/search-tms-knowledge', {
        method: 'POST',
        body: JSON.stringify({ query: 'Team Management Wheel' })
      });

      const response = await POST(request);
      await response.json();

      expect(response.status).toBe(200);
      expect(mockSearch.close).toHaveBeenCalled();
    });
  });

  describe('result formatting', () => {
    it('should format results with required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/voice-tools/search-tms-knowledge', {
        method: 'POST',
        body: JSON.stringify({ query: 'Team Management Wheel' })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.output.results[0]).toEqual({
        content: mockSearchResults[0].content,
        source: mockSearchResults[0].source,
        relevance: mockSearchResults[0].relevance,
        citation: mockSearchResults[0].citation
      });
    });
  });
});