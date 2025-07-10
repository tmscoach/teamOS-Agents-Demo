/**
 * High-level integration test for admin pages
 * Verifies that the import path fixes for issue #44 are working correctly
 */

// Import services at the top
import { GuardrailTrackingService } from '@/src/lib/services/guardrail-tracking';
import { VariableExtractionService } from '@/src/lib/services/variable-extraction';
import { AgentConfigurationService } from '@/src/lib/services/agent-configuration';

describe('Admin Pages Import Path Verification', () => {
  it('should load guardrails page without module not found errors', async () => {
    // This test verifies that the import paths have been fixed
    // The actual page loading is tested via manual verification
    await expect(import('../guardrails/page')).resolves.not.toThrow();
  });

  it('should load variables page without module not found errors', async () => {
    // This test verifies that the import paths have been fixed
    // The actual page loading is tested via manual verification
    await expect(import('../variables/page')).resolves.not.toThrow();
  });

  it('should load agent config page without module not found errors', async () => {
    // This test verifies that the import paths have been fixed
    // The actual page loading is tested via manual verification
    await expect(import('../agents/config/page')).resolves.not.toThrow();
  });

  it('should correctly import services from src/lib/services', () => {
    // Verify the services can be imported with the correct path
    // Services are now imported at the top of the file
    
    expect(GuardrailTrackingService).toBeDefined();
    expect(VariableExtractionService).toBeDefined();
    expect(AgentConfigurationService).toBeDefined();
  });
});