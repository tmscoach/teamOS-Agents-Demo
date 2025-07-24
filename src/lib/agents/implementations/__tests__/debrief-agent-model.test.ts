/**
 * Tests for DebriefAgent model selection and configuration
 */

import { OpenAIDebriefAgent } from '../openai-debrief-agent';
import { BaseOpenAIAgent } from '../base-openai-agent';

describe('DebriefAgent Model Selection', () => {
  let agent: OpenAIDebriefAgent;

  beforeEach(async () => {
    agent = new OpenAIDebriefAgent();
    await agent.initialize();
  });

  it('should use GPT-4o model by default for DebriefAgent', () => {
    expect((agent as any).model).toBe('gpt-4o');
  });

  it('should use lower temperature (0.3) for DebriefAgent', () => {
    expect((agent as any).temperature).toBe(0.3);
  });

  it('should use GPT-4o-mini for other agents', () => {
    const baseAgent = new BaseOpenAIAgent({
      name: 'TestAgent',
      description: 'Test agent',
      instructions: () => 'Test instructions'
    });
    
    expect((baseAgent as any).model).toBe('gpt-4o-mini');
    expect((baseAgent as any).temperature).toBe(0.7);
  });

  it('should override model if specified in config', async () => {
    // Mock the config loader to return custom model
    const mockConfig = {
      model: 'gpt-4-turbo',
      temperature: 0.5
    };
    
    jest.spyOn(agent as any, 'ensureConfigLoaded').mockResolvedValue(undefined);
    (agent as any).loadedConfig = mockConfig;
    
    // Re-initialize to apply config
    await agent.initialize();
    
    // Model should be overridden by config
    expect((agent as any).model).toBe('gpt-4-turbo');
    expect((agent as any).temperature).toBe(0.5);
  });

  it('should have correct system prompt for TMS debrief', () => {
    const instructions = (agent as any).instructions();
    
    expect(instructions).toContain('TMS Debrief Agent');
    expect(instructions).toContain('assessment debriefs');
    expect(instructions).toContain('subscription ID');
  });

  it('should configure TMS tools correctly', async () => {
    // Check that TMS tools were loaded
    const tools = (agent as any).tools;
    const tmsToolNames = tools.map((tool: any) => tool.name);
    
    // Should have knowledge base tools by default
    expect(tmsToolNames).toContain('search_tms_knowledge');
  });

  it('should have guardrails configured', () => {
    const guardrails = (agent as any).inputGuardrails;
    
    expect(guardrails).toBeDefined();
    expect(guardrails.length).toBeGreaterThan(0);
    
    // Check for specific guardrail types
    const guardrailNames = guardrails.map((g: any) => g.name);
    expect(guardrailNames).toContain('ProfanityCheck');
  });

  it('should update guardrails from configuration', async () => {
    const mockGuardrailConfig = {
      enableProfanityCheck: false,
      enableSafetyCheck: true,
      maxQuestionsPerSession: 50
    };
    
    jest.spyOn(agent as any, 'ensureConfigLoaded').mockResolvedValue(undefined);
    (agent as any).loadedConfig = { guardrailConfig: mockGuardrailConfig };
    
    await agent.initialize();
    
    // Should update guardrail config
    expect((agent as any).guardrailConfig.enableProfanityCheck).toBe(false);
    expect((agent as any).guardrailConfig.maxQuestionsPerSession).toBe(50);
  });
});