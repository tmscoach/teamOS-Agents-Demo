import { DebriefAgent } from '../debrief-agent';
import { AgentContext } from '../../types';

// Mock the parent classes
jest.mock('../tms-enabled-agent', () => ({
  TMSEnabledAgent: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(undefined),
    tools: [],
    buildSystemMessage: jest.fn(() => 'Context: TMS Debrief Agent')
  }))
}));

jest.mock('../knowledge-enabled-agent', () => ({
  KnowledgeEnabledAgent: jest.fn().mockImplementation(() => ({
    knowledgeEnabled: true,
    initialize: jest.fn().mockResolvedValue(undefined),
    tools: [],
    getInstructions: jest.fn(() => `
      You have access to the following knowledge base tools:
      - search_tms_knowledge: Search the TMS knowledge base
      - get_assessment_methodology: Get detailed information about assessment methodologies
      
      NEVER make up or guess definitions - always use the search_tms_knowledge tool to find accurate information.
    `)
  }))
}));

// Mock the tools
jest.mock('../../tools/search-report-chunks', () => ({
  createSearchReportChunksTool: jest.fn(() => ({
    name: 'search_report_chunks',
    description: 'Search report chunks',
    parameters: {},
    execute: jest.fn()
  }))
}));

jest.mock('../../tools/get-report-context', () => ({
  createGetReportContextTool: jest.fn(() => ({
    name: 'get_report_context', 
    description: 'Get report context',
    parameters: {},
    execute: jest.fn()
  }))
}));

jest.mock('../../tools/search-report-chunks-vector', () => ({
  createSearchReportChunksVectorTool: jest.fn(() => ({
    name: 'search_report_chunks_vector',
    description: 'Vector search report chunks', 
    parameters: {},
    execute: jest.fn()
  }))
}));

describe('DebriefAgent Tools', () => {
  let agent: DebriefAgent;

  beforeEach(async () => {
    agent = new DebriefAgent();
    await agent.initialize();
  });

  it('includes all report search tools', () => {
    const toolNames = agent.tools.map(tool => tool.name);
    
    expect(toolNames).toContain('search_report_chunks');
    expect(toolNames).toContain('get_report_context');
    expect(toolNames).toContain('search_report_chunks_vector');
  });

  it('adds report tools after initialization', () => {
    const reportTools = agent.tools.filter(tool => 
      tool.name.includes('report') || tool.name.includes('chunks')
    );
    
    expect(reportTools.length).toBeGreaterThanOrEqual(3);
  });

  it('builds system message with debrief context', () => {
    const context: AgentContext = {
      userId: 'test-user',
      messages: [],
      metadata: {
        isDebriefMode: true,
        reportId: 'report-123',
        subscriptionId: 'sub-123',
        assessmentType: 'TMP'
      }
    };

    // Access protected method through type assertion
    const systemMessage = (agent as any).buildSystemMessage(context);
    
    expect(systemMessage).toContain('Context:');
    expect(systemMessage).toContain('TMS Debrief Agent');
  });
});

describe('DebriefAgent Knowledge Base Access', () => {
  it('has knowledge base enabled by default', async () => {
    const agent = new DebriefAgent();
    await agent.initialize();
    
    // Check that the agent extends KnowledgeEnabledAgent
    expect((agent as any).knowledgeEnabled).toBe(true);
  });

  it('includes knowledge base instructions', async () => {
    const agent = new DebriefAgent();
    await agent.initialize();
    const context: AgentContext = {
      userId: 'test-user',
      messages: []
    };

    const instructions = (agent as any).getInstructions(context);
    
    expect(instructions).toContain('search_tms_knowledge');
    expect(instructions).toContain('get_assessment_methodology');
    expect(instructions).toContain('NEVER make up or guess definitions');
  });
});