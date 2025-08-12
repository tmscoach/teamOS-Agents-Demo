import { DebriefAgent } from '../debrief-agent';

// Mock all dependencies to avoid initialization issues
jest.mock('../tms-enabled-agent', () => ({
  TMSEnabledAgent: jest.fn()
}));

jest.mock('../knowledge-enabled-agent', () => ({
  KnowledgeEnabledAgent: jest.fn()
}));

jest.mock('../../tools/search-report-chunks', () => ({
  createSearchReportChunksTool: jest.fn(() => ({
    name: 'search_report_chunks',
    execute: jest.fn()
  }))
}));

jest.mock('../../tools/get-report-context', () => ({
  createGetReportContextTool: jest.fn(() => ({
    name: 'get_report_context',
    execute: jest.fn()
  }))
}));

jest.mock('../../tools/search-report-chunks-vector', () => ({
  createSearchReportChunksVectorTool: jest.fn(() => ({
    name: 'search_report_chunks_vector',
    execute: jest.fn()
  }))
}));

describe('DebriefAgent', () => {
  it('can be instantiated', () => {
    const agent = new DebriefAgent();
    expect(agent).toBeInstanceOf(DebriefAgent);
  });

  it('has correct name and description', () => {
    const agent = new DebriefAgent();
    expect(agent.name).toBe('DebriefAgent');
    expect(agent.description).toContain('post-assessment debrief');
  });
});