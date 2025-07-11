import { OnboardingAgent } from '../onboarding-agent';
import { AgentContext } from '../../types';
import { VariableExtractionService } from '../../../services/variable-extraction';
import { AgentConfigLoader } from '../../config/agent-config-loader';

// Mock dependencies
jest.mock('../../../services/variable-extraction', () => ({
  VariableExtractionService: {
    trackExtractionBatch: jest.fn().mockResolvedValue(0)
  }
}));

jest.mock('../../config/agent-config-loader');

// Mock the LLM provider
jest.mock('../../llm', () => ({
  LLMProvider: jest.fn().mockImplementation(() => ({
    generateResponse: jest.fn().mockResolvedValue({
      content: 'Mocked response',
      toolCalls: []
    })
  }))
}));

// Mock the knowledge base
jest.mock('../../../knowledge-base', () => ({
  knowledgeBaseTools: []
}));

describe('OnboardingAgent Extraction with Configuration', () => {
  let agent: OnboardingAgent;
  let mockContext: AgentContext;
  let originalEnv: string | undefined;

  beforeAll(() => {
    originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    // Set OpenAI key to avoid initialization error
    process.env.OPENAI_API_KEY = 'test-key';
  });

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the config loader to return configured extraction rules
    (AgentConfigLoader.loadConfiguration as jest.Mock).mockResolvedValue({
      systemPrompt: 'Test prompt',
      extractionRules: {
        manager_name: {
          type: 'string',
          patterns: ["I'm\\s+([A-Z][a-z]+)"],
          required: true
        },
        team_size: {
          type: 'number',
          patterns: ["(\\d+)\\s+people"],
          required: true
        }
      }
    });

    // Mock getDefaultExtractionRules as fallback
    (AgentConfigLoader.getDefaultExtractionRules as jest.Mock).mockReturnValue({
      manager_name: {
        type: 'string',
        patterns: ["My name is\\s+([A-Z][a-z]+)"],
        required: true
      }
    });

    agent = new OnboardingAgent();
    mockContext = {
      conversationId: 'conv-123',
      managerId: 'manager-123',
      teamId: 'team-123',
      messageHistory: [],
      metadata: {}
    };
  });

  test('should use configured extraction rules', async () => {
    const message = "I'm Bob and we have 15 people on the team";
    
    // Call processMessage to trigger extraction
    await agent.processMessage(message, mockContext);

    // Verify config was loaded
    expect(AgentConfigLoader.loadConfiguration).toHaveBeenCalledWith('OnboardingAgent');

    // Verify extraction tracking was called
    expect(VariableExtractionService.trackExtractionBatch).toHaveBeenCalled();
    
    const trackedExtractions = (VariableExtractionService.trackExtractionBatch as jest.Mock).mock.calls[0][0];
    
    // Should have tracked both configured fields
    expect(trackedExtractions).toHaveLength(2);
    
    // Check manager_name extraction
    const nameExtraction = trackedExtractions.find((e: any) => e.fieldName === 'manager_name');
    expect(nameExtraction).toMatchObject({
      fieldName: 'manager_name',
      attempted: true,
      successful: true,
      extractedValue: 'Bob'
    });

    // Check team_size extraction  
    const sizeExtraction = trackedExtractions.find((e: any) => e.fieldName === 'team_size');
    expect(sizeExtraction).toMatchObject({
      fieldName: 'team_size',
      attempted: true,
      successful: true,
      extractedValue: '15'
    });
  });

  test('should fall back to default rules when no config', async () => {
    // Mock no configuration found
    (AgentConfigLoader.loadConfiguration as jest.Mock).mockResolvedValue(null);

    const message = "My name is Alice";
    
    await agent.processMessage(message, mockContext);

    // Should have used default rules
    expect(AgentConfigLoader.getDefaultExtractionRules).toHaveBeenCalledWith('OnboardingAgent');
    
    // Verify extraction still happened
    expect(VariableExtractionService.trackExtractionBatch).toHaveBeenCalled();
  });

  test('should maintain backward compatibility with metadata', async () => {
    const message = "I'm Sarah with 20 people";
    
    const response = await agent.processMessage(message, mockContext);

    // Check that metadata is properly updated
    expect(mockContext.metadata.onboarding).toBeDefined();
    expect(mockContext.metadata.onboarding.capturedFields).toMatchObject({
      manager_name: 'Sarah',
      team_size: 20
    });

    // Check extraction tracking count in metadata
    expect(mockContext.metadata.extractionsTracked).toBe(2);
  });

  test('should handle extraction errors gracefully', async () => {
    // Mock config loader to throw error
    (AgentConfigLoader.loadConfiguration as jest.Mock).mockRejectedValue(new Error('Config error'));

    const message = "I'm John with 10 people";
    
    // Should not throw
    const response = await agent.processMessage(message, mockContext);
    
    expect(response).toBeDefined();
    
    // Should fall back to default rules
    expect(AgentConfigLoader.getDefaultExtractionRules).toHaveBeenCalled();
  });

  test('should not track in test environment', async () => {
    const testContext = {
      ...mockContext,
      conversationId: 'test-123'
    };

    await agent.processMessage("I'm Test User", testContext);
    
    // Should not track test conversations
    expect(VariableExtractionService.trackExtractionBatch).not.toHaveBeenCalled();
  });
});