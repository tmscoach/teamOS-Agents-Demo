/**
 * Tests for mock agents
 */

describe('Mock Agents', () => {
  it('should export mock agent classes', () => {
    // Just verify the module loads properly
    const mockAgents = require('./mock-agents');
    
    expect(mockAgents.MockOnboardingAgent).toBeDefined();
    expect(mockAgents.MockProfileAnalysisAgent).toBeDefined();
    expect(mockAgents.MockEchoAgent).toBeDefined();
    expect(mockAgents.createMockAgentSystem).toBeDefined();
  });
});