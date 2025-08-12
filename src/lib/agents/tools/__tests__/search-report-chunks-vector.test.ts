import { createSearchReportChunksVectorTool } from '../search-report-chunks-vector';
import { AgentContext } from '../../types';

// Mock Supabase first (before any imports)
let mockRpc: jest.Mock;
jest.mock('@supabase/supabase-js', () => {
  mockRpc = jest.fn();
  return {
    createClient: jest.fn(() => ({
      rpc: mockRpc
    }))
  };
});

// Mock Prisma
jest.mock('@/lib/db', () => ({
  default: {
    userReport: {
      findFirst: jest.fn()
    }
  }
}));

// Mock fetch for OpenAI embeddings
global.fetch = jest.fn();

describe('searchReportChunksVector Tool', () => {
  const tool = createSearchReportChunksVectorTool();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock embedding response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{ embedding: new Array(1536).fill(0.1) }]
      })
    });
  });

  it('has correct metadata', () => {
    expect(tool.name).toBe('search_report_chunks_vector');
    expect(tool.description).toContain('Semantically search');
    expect(tool.parameters.properties).toHaveProperty('query');
    expect(tool.parameters.properties).toHaveProperty('similarity_threshold');
  });

  it('performs vector search with report ID', async () => {
    const mockChunks = [
      {
        id: 'chunk-1',
        section_title: 'Work Preferences',
        content: 'Your introvert score indicates...',
        similarity: 0.85
      },
      {
        id: 'chunk-2',
        section_title: 'Team Dynamics',
        content: 'Based on your profile...',
        similarity: 0.78
      }
    ];

    mockRpc.mockResolvedValue({
      data: mockChunks,
      error: null
    });

    const context: AgentContext = {
      userId: 'user-123',
      messages: [],
      metadata: {
        reportId: 'report-123'
      }
    };

    const result = await tool.execute(
      { query: 'introvert score meaning', limit: 5 },
      context
    );

    expect(result.success).toBe(true);
    expect(result.output).toContain('Work Preferences');
    expect(result.output).toContain('85.0% match');
    expect(result.output).toContain('Team Dynamics');
    expect(result.output).toContain('78.0% match');
    
    // Verify OpenAI embedding was called
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/embeddings',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('introvert score meaning')
      })
    );
    
    // Verify Supabase RPC was called
    expect(mockRpc).toHaveBeenCalledWith('search_report_chunks', {
      query_embedding: expect.any(Array),
      match_threshold: 0.7,
      match_count: 5,
      filter_report_id: 'report-123'
    });
  });

  it('finds report by subscription if no report ID provided', async () => {
    const prisma = require('@/lib/db').default;
    
    prisma.userReport.findFirst.mockResolvedValue({
      id: 'found-report-123'
    });

    mockRpc.mockResolvedValue({
      data: [],
      error: null
    });

    const context: AgentContext = {
      userId: 'user-123',
      messages: [],
      metadata: {
        subscriptionId: 'sub-123',
        userId: 'user-123'
      }
    };

    await tool.execute({ query: 'test query' }, context);

    expect(prisma.userReport.findFirst).toHaveBeenCalledWith({
      where: {
        subscriptionId: 'sub-123',
        userId: 'user-123'
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: { id: true }
    });

    expect(mockRpc).toHaveBeenCalledWith(
      'search_report_chunks',
      expect.objectContaining({
        filter_report_id: 'found-report-123'
      })
    );
  });

  it('handles no results gracefully', async () => {
    mockRpc.mockResolvedValue({
      data: [],
      error: null
    });

    const result = await tool.execute(
      { query: 'nonexistent topic', reportId: 'report-123' },
      {} as AgentContext
    );

    expect(result.success).toBe(true);
    expect(result.output).toContain('No relevant sections found');
  });

  it('handles embedding API errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500
    });

    const result = await tool.execute(
      { query: 'test', reportId: 'report-123' },
      {} as AgentContext
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Failed to generate embedding');
  });

  it('handles Supabase errors', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'Database error' }
    });

    const result = await tool.execute(
      { query: 'test', reportId: 'report-123' },
      {} as AgentContext
    );

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('respects similarity threshold parameter', async () => {
    mockRpc.mockResolvedValue({
      data: [],
      error: null
    });

    await tool.execute(
      { 
        query: 'test',
        reportId: 'report-123',
        similarity_threshold: 0.9
      },
      {} as AgentContext
    );

    expect(mockRpc).toHaveBeenCalledWith(
      'search_report_chunks',
      expect.objectContaining({
        match_threshold: 0.9
      })
    );
  });
});