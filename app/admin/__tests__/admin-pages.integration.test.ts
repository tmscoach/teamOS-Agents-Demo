/**
 * High-level integration test for admin pages
 * Verifies that the import path fixes for issue #44 are working correctly
 */

describe('Admin Pages Import Path Verification', () => {
  it('should load guardrails page without module not found errors', async () => {
    // This test verifies that the import paths have been fixed
    // The actual page loading is tested via manual verification
    expect(() => require('../guardrails/page')).not.toThrow();
  });

  it('should load variables page without module not found errors', async () => {
    // This test verifies that the import paths have been fixed
    // The actual page loading is tested via manual verification
    expect(() => require('../variables/page')).not.toThrow();
  });

  it('should load agent config page without module not found errors', async () => {
    // This test verifies that the import paths have been fixed
    // The actual page loading is tested via manual verification
    expect(() => require('../agents/config/page')).not.toThrow();
  });

  it('should correctly import services from src/lib/services', () => {
    // Verify the services can be imported with the correct path
    const guardrailService = require('@/src/lib/services/guardrail-tracking');
    const variableService = require('@/src/lib/services/variable-extraction');
    const agentConfigService = require('@/src/lib/services/agent-configuration');
    
    expect(guardrailService.GuardrailTrackingService).toBeDefined();
    expect(variableService.VariableExtractionService).toBeDefined();
    expect(agentConfigService.AgentConfigurationService).toBeDefined();
  });
});