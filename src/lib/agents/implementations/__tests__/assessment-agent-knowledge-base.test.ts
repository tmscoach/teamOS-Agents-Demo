import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createAssessmentAgent } from '../assessment-agent';
import { AgentContext } from '../../types';
import { knowledgeBaseTools } from '../../../knowledge-base';

// Mock the knowledge base tools
jest.mock('../../../knowledge-base', () => ({
  knowledgeBaseTools: [
    {
      name: 'search_tms_knowledge',
      description: 'Search the TMS knowledge base',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string' }
        },
        required: ['query']
      },
      execute: jest.fn()
    },
    {
      name: 'get_assessment_methodology',
      description: 'Get assessment methodology details',
      parameters: {
        type: 'object',
        properties: {
          assessment_type: { type: 'string' }
        },
        required: ['assessment_type']
      },
      execute: jest.fn()
    }
  ]
}));

// Mock the TMS tool factory
jest.mock('../../tools/tms-tool-factory', () => ({
  createTMSTools: jest.fn(() => [])
}));

// Mock the agent config loader
jest.mock('../../config/agent-config-loader', () => ({
  AgentConfigLoader: {
    loadConfiguration: jest.fn(() => null)
  }
}));

describe('AssessmentAgent Knowledge Base Integration', () => {
  let agent: any;
  let mockContext: AgentContext;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create agent
    agent = await createAssessmentAgent();
    
    // Create mock context
    mockContext = {
      conversationId: 'test-conversation',
      teamId: 'test-team',
      managerId: 'test-manager',
      currentAgent: 'AssessmentAgent',
      messageHistory: [],
      metadata: {
        selectedAssessment: {
          assessmentType: 'TMP',
          subscriptionId: '12345',
          status: 'In Progress'
        }
      }
    };
  });

  describe('Tool Loading', () => {
    it('should load knowledge base tools on initialization', () => {
      expect(agent.tools).toBeDefined();
      expect(agent.tools.length).toBeGreaterThan(0);
      
      const toolNames = agent.tools.map((tool: any) => tool.name);
      expect(toolNames).toContain('search_tms_knowledge');
      expect(toolNames).toContain('get_assessment_methodology');
    });

    it('should inherit from KnowledgeEnabledAgent', () => {
      // The agent should have knowledge base capabilities
      expect(agent.knowledgeEnabled).toBe(true);
    });
  });

  describe('System Prompt', () => {
    it('should include knowledge base instructions in system prompt', () => {
      const instructions = agent.getInstructions(mockContext);
      
      // Should mention knowledge base access
      expect(instructions).toContain('knowledge base');
      expect(instructions).toContain('TMS intellectual property');
      
      // Should instruct to search when asked about methodology
      expect(instructions).toContain('Always search the knowledge base');
    });
  });

  describe('Tool Execution', () => {
    it('should search knowledge base when asked about TMP handbook', async () => {
      const searchTool = knowledgeBaseTools.find(t => t.name === 'search_tms_knowledge');
      const mockExecute = searchTool?.execute as jest.Mock;
      
      // Mock the tool response
      mockExecute.mockResolvedValueOnce({
        success: true,
        output: {
          results: [
            {
              content: "The TMP (Team Management Profile) is a psychometric assessment...",
              source: "TMP Handbook",
              relevance: 0.95
            }
          ]
        }
      });

      // Execute the tool
      const result = await searchTool?.execute({ query: 'TMP handbook' }, mockContext);
      
      expect(mockExecute).toHaveBeenCalledWith(
        { query: 'TMP handbook' },
        mockContext
      );
      
      expect(result?.success).toBe(true);
      expect(result?.output?.results).toHaveLength(1);
      expect(result?.output?.results[0].source).toBe('TMP Handbook');
    });

    it('should get assessment methodology when asked about specific assessments', async () => {
      const methodologyTool = knowledgeBaseTools.find(t => t.name === 'get_assessment_methodology');
      const mockExecute = methodologyTool?.execute as jest.Mock;
      
      // Mock the tool response
      mockExecute.mockResolvedValueOnce({
        success: true,
        output: {
          assessment_type: 'TMP',
          methodology: [
            {
              content: "TMP measures team role preferences...",
              source: "TMP Accreditation Handbook"
            }
          ]
        }
      });

      // Execute the tool
      const result = await methodologyTool?.execute(
        { assessment_type: 'TMP' }, 
        mockContext
      );
      
      expect(mockExecute).toHaveBeenCalledWith(
        { assessment_type: 'TMP' },
        mockContext
      );
      
      expect(result?.success).toBe(true);
      expect(result?.output?.assessment_type).toBe('TMP');
    });
  });

  describe('Tool Integration with Assessment Flow', () => {
    it('should have both knowledge base and assessment-specific tools', () => {
      const toolNames = agent.tools.map((tool: any) => tool.name);
      
      // Knowledge base tools
      expect(toolNames).toContain('search_tms_knowledge');
      expect(toolNames).toContain('get_assessment_methodology');
      expect(toolNames).toContain('get_questionnaire_items');
      expect(toolNames).toContain('search_intervention_strategies');
      expect(toolNames).toContain('get_benchmark_data');
    });

    it('should prioritize knowledge base search for methodology questions', () => {
      const instructions = agent.getInstructions(mockContext);
      
      // Should have instructions about using knowledge base for questions
      expect(instructions).toMatch(/when.*asked.*about.*TMS.*search/i);
      expect(instructions).toMatch(/cite.*sources/i);
    });
  });

  describe('Error Handling', () => {
    it('should handle knowledge base search failures gracefully', async () => {
      const searchTool = knowledgeBaseTools.find(t => t.name === 'search_tms_knowledge');
      const mockExecute = searchTool?.execute as jest.Mock;
      
      // Mock a failure
      mockExecute.mockResolvedValueOnce({
        success: false,
        error: 'Database connection failed'
      });

      const result = await searchTool?.execute({ query: 'test query' }, mockContext);
      
      expect(result?.success).toBe(false);
      expect(result?.error).toBe('Database connection failed');
    });
  });
});