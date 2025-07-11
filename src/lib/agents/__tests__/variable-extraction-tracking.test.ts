import { createOnboardingTools } from '../tools/onboarding-tools';
import { VariableExtractionService } from '../../services/variable-extraction';
import { AgentContext } from '../types';

// Mock the VariableExtractionService
jest.mock('../../services/variable-extraction', () => ({
  VariableExtractionService: {
    trackExtractionBatch: jest.fn().mockResolvedValue(0)
  }
}));

describe('Variable Extraction Tracking', () => {
  let extractTeamInfoTool: any;
  let mockContext: AgentContext;
  let originalEnv: string | undefined;

  beforeAll(() => {
    // Save original NODE_ENV
    originalEnv = process.env.NODE_ENV;
    // Set NODE_ENV to 'development' to enable tracking in tests
    process.env.NODE_ENV = 'development';
  });

  afterAll(() => {
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalEnv;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    const tools = createOnboardingTools();
    extractTeamInfoTool = tools.find(t => t.name === 'extractTeamInfo');
    
    mockContext = {
      conversationId: 'conv-123',
      managerId: 'manager-123',
      teamId: 'team-123',
      messageHistory: [],
      metadata: {}
    };
  });

  test('should track successful extractions', async () => {
    const message = "Hi, I'm Sarah Johnson from TechCorp. We have 25 people on our team.";
    
    const result = await extractTeamInfoTool.execute(
      { message },
      mockContext
    );

    // Verify extraction worked
    expect(result.success).toBe(true);
    expect(result.output).toEqual({
      name: 'Sarah Johnson',
      organization: 'TechCorp',
      team_size: 25
    });

    // Verify tracking was called
    expect(VariableExtractionService.trackExtractionBatch).toHaveBeenCalledTimes(1);
    const trackedExtractions = (VariableExtractionService.trackExtractionBatch as jest.Mock).mock.calls[0][0];
    
    // Should track all fields that were attempted
    expect(trackedExtractions).toHaveLength(9); // All fields are tracked
    
    // Verify successful extractions
    const nameExtraction = trackedExtractions.find((e: any) => e.fieldName === 'manager_name');
    expect(nameExtraction).toMatchObject({
      conversationId: 'conv-123',
      agentName: 'OnboardingAgent',
      fieldName: 'manager_name',
      attempted: true,
      successful: true,
      extractedValue: 'Sarah Johnson',
      confidence: expect.any(Number)
    });
    expect(nameExtraction.confidence).toBeGreaterThan(0.5);

    const teamSizeExtraction = trackedExtractions.find((e: any) => e.fieldName === 'team_size');
    expect(teamSizeExtraction).toMatchObject({
      successful: true,
      extractedValue: '25'
    });

    const orgExtraction = trackedExtractions.find((e: any) => e.fieldName === 'organization');
    expect(orgExtraction).toMatchObject({
      successful: true,
      extractedValue: 'TechCorp'
    });
  });

  test('should track failed extractions', async () => {
    const message = "Hello, I need help with my team.";
    
    const result = await extractTeamInfoTool.execute(
      { message },
      mockContext
    );

    // Verify extraction found nothing
    expect(result.success).toBe(true);
    expect(result.output).toEqual({});

    // Verify tracking was called
    expect(VariableExtractionService.trackExtractionBatch).toHaveBeenCalledTimes(1);
    const trackedExtractions = (VariableExtractionService.trackExtractionBatch as jest.Mock).mock.calls[0][0];
    
    // All fields should be tracked as failed attempts
    expect(trackedExtractions.length).toBeGreaterThan(0);
    trackedExtractions.forEach((extraction: any) => {
      expect(extraction).toMatchObject({
        conversationId: 'conv-123',
        agentName: 'OnboardingAgent',
        attempted: true,
        successful: false,
        extractedValue: undefined,
        confidence: 0
      });
    });
  });

  test('should track mixed success/failure extractions', async () => {
    const message = "My name is John and our main challenge is communication gaps.";
    
    const result = await extractTeamInfoTool.execute(
      { message },
      mockContext
    );

    expect(result.output).toEqual({
      name: 'John',
      primary_challenge: 'My name is John and our main challenge is communication gaps'
    });

    const trackedExtractions = (VariableExtractionService.trackExtractionBatch as jest.Mock).mock.calls[0][0];
    
    // Check successful extractions
    const nameExtraction = trackedExtractions.find((e: any) => e.fieldName === 'manager_name');
    expect(nameExtraction.successful).toBe(true);
    expect(nameExtraction.extractedValue).toBe('John');

    const challengeExtraction = trackedExtractions.find((e: any) => e.fieldName === 'primary_challenge');
    expect(challengeExtraction.successful).toBe(true);
    expect(challengeExtraction.extractedValue).toContain('challenge is communication');

    // Check failed extractions
    const teamSizeExtraction = trackedExtractions.find((e: any) => e.fieldName === 'team_size');
    expect(teamSizeExtraction.successful).toBe(false);
  });

  test('should calculate appropriate confidence scores', async () => {
    const message = "I'm definitely Bob Smith, manager at ACME Corp.";
    
    await extractTeamInfoTool.execute({ message }, mockContext);

    const trackedExtractions = (VariableExtractionService.trackExtractionBatch as jest.Mock).mock.calls[0][0];
    const nameExtraction = trackedExtractions.find((e: any) => e.fieldName === 'manager_name');
    
    // Should have high confidence due to explicit pattern match
    expect(nameExtraction.confidence).toBeGreaterThanOrEqual(0.7);
  });

  test('should not track in test environment', async () => {
    // Temporarily set NODE_ENV to test
    const currentEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
    
    try {
      await extractTeamInfoTool.execute(
        { message: "I'm Sarah with 10 people" },
        mockContext
      );

      // Should not call tracking in test environment
      expect(VariableExtractionService.trackExtractionBatch).not.toHaveBeenCalled();
    } finally {
      // Restore NODE_ENV
      process.env.NODE_ENV = currentEnv;
    }
    
    // Reset mock for next part of test
    jest.clearAllMocks();
    
    // Test with test- prefix conversation ID
    const testContext = {
      ...mockContext,
      conversationId: 'test-123' // Test conversation ID
    };

    await extractTeamInfoTool.execute(
      { message: "I'm Sarah with 10 people" },
      testContext
    );

    // Should not call tracking for test conversations
    expect(VariableExtractionService.trackExtractionBatch).not.toHaveBeenCalled();
  });

  test('should handle tracking errors gracefully', async () => {
    // Mock tracking to throw an error
    (VariableExtractionService.trackExtractionBatch as jest.Mock).mockRejectedValueOnce(
      new Error('Database error')
    );

    const message = "I'm Alex from StartupCo";
    
    // Should not throw even if tracking fails
    const result = await extractTeamInfoTool.execute({ message }, mockContext);
    
    expect(result.success).toBe(true);
    expect(result.output.name).toBe('Alex');
    expect(result.output.organization).toBe('StartupCo');
  });
});