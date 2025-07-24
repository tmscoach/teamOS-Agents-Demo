/**
 * @jest-environment node
 */

/**
 * Tests for DebriefAgent model selection and configuration
 */

import { OpenAIDebriefAgent } from '../openai-debrief-agent';
import { OpenAIAgent } from '../base-openai-agent';

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
    const baseAgent = new OpenAIAgent({
      name: 'TestAgent',
      description: 'Test agent',
      instructions: () => 'Test instructions'
    });
    
    expect((baseAgent as any).model).toBe('gpt-4o-mini');
    expect((baseAgent as any).temperature).toBe(0.7);
  });

  it('should use environment variables to override model if set', async () => {
    // Set environment variables
    const originalModel = process.env.DEBRIEFAGENT_MODEL;
    const originalTemp = process.env.DEBRIEFAGENT_TEMPERATURE;
    
    process.env.DEBRIEFAGENT_MODEL = 'gpt-4-turbo';
    process.env.DEBRIEFAGENT_TEMPERATURE = '0.5';
    
    // Create new agent that will pick up env vars
    const envAgent = new OpenAIDebriefAgent();
    await envAgent.initialize();
    
    // Model should be overridden by env vars
    expect((envAgent as any).model).toBe('gpt-4-turbo');
    expect((envAgent as any).temperature).toBe(0.5);
    
    // Restore original env vars
    if (originalModel !== undefined) {
      process.env.DEBRIEFAGENT_MODEL = originalModel;
    } else {
      delete process.env.DEBRIEFAGENT_MODEL;
    }
    if (originalTemp !== undefined) {
      process.env.DEBRIEFAGENT_TEMPERATURE = originalTemp;
    } else {
      delete process.env.DEBRIEFAGENT_TEMPERATURE;
    }
  });

  it('should have correct system prompt for TMS debrief', () => {
    const instructions = (agent as any).instructions();
    
    expect(instructions).toContain('TMS Debrief Agent');
    expect(instructions).toContain('comprehensive debriefs');
    expect(instructions).toContain('Team Management Profile');
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