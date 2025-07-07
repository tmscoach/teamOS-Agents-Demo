/**
 * Unit tests for ContextManager
 */

import { ContextManager } from '../context';
import { TransformationPhase } from '../types';

describe('ContextManager', () => {
  let contextManager: ContextManager;

  beforeEach(() => {
    contextManager = new ContextManager();
  });

  describe('createContext', () => {
    it('should create a new context with default values', async () => {
      const context = await contextManager.createContext({
        teamId: 'team-123',
        managerId: 'manager-456',
      });

      expect(context).toMatchObject({
        teamId: 'team-123',
        managerId: 'manager-456',
        transformationPhase: 'onboarding',
        currentAgent: 'OnboardingAgent',
        messageHistory: [],
        metadata: {},
      });
      expect(context.conversationId).toBeDefined();
    });

    it('should create a context with custom values', async () => {
      const context = await contextManager.createContext({
        teamId: 'team-123',
        managerId: 'manager-456',
        initialAgent: 'ProfileAnalysisAgent',
        transformationPhase: 'assessment',
        metadata: { source: 'api' },
      });

      expect(context).toMatchObject({
        teamId: 'team-123',
        managerId: 'manager-456',
        transformationPhase: 'assessment',
        currentAgent: 'ProfileAnalysisAgent',
        metadata: { source: 'api' },
      });
    });
  });

  describe('updateContext', () => {
    it('should update context fields', async () => {
      const context = await contextManager.createContext({
        teamId: 'team-123',
        managerId: 'manager-456',
      });

      const updated = await contextManager.updateContext(context.conversationId, {
        currentAgent: 'AssessmentAgent',
        transformationPhase: 'assessment',
      });

      expect(updated.currentAgent).toBe('AssessmentAgent');
      expect(updated.transformationPhase).toBe('assessment');
      expect(updated.teamId).toBe('team-123'); // Should preserve
    });

    it('should merge metadata correctly', async () => {
      const context = await contextManager.createContext({
        teamId: 'team-123',
        managerId: 'manager-456',
        metadata: { foo: 'bar' },
      });

      const updated = await contextManager.updateContext(context.conversationId, {
        metadata: { baz: 'qux' },
      });

      expect(updated.metadata).toEqual({ foo: 'bar', baz: 'qux' });
    });

    it('should throw error for non-existent conversation', async () => {
      await expect(
        contextManager.updateContext('non-existent', {})
      ).rejects.toThrow('Context not found');
    });
  });

  describe('addMessage', () => {
    it('should add a message to conversation history', async () => {
      const context = await contextManager.createContext({
        teamId: 'team-123',
        managerId: 'manager-456',
      });

      await contextManager.addMessage(context.conversationId, {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: new Date(),
      });

      const updated = await contextManager.getContext(context.conversationId);
      expect(updated?.messageHistory).toHaveLength(1);
      expect(updated?.messageHistory[0].content).toBe('Hello');
    });
  });

  describe('updatePhase', () => {
    it('should update transformation phase', async () => {
      const context = await contextManager.createContext({
        teamId: 'team-123',
        managerId: 'manager-456',
      });

      await contextManager.updatePhase(context.conversationId, 'analysis');

      const updated = await contextManager.getContext(context.conversationId);
      expect(updated?.transformationPhase).toBe('analysis');
    });
  });

  describe('updateAssessmentResults', () => {
    it('should update assessment results', async () => {
      const context = await contextManager.createContext({
        teamId: 'team-123',
        managerId: 'manager-456',
      });

      await contextManager.updateAssessmentResults(
        context.conversationId,
        'tmp',
        { score: 85 }
      );

      const updated = await contextManager.getContext(context.conversationId);
      expect(updated?.assessmentResults?.tmp).toEqual({ score: 85 });
    });
  });

  describe('cloneContext', () => {
    it('should create a deep copy of context', async () => {
      const original = await contextManager.createContext({
        teamId: 'team-123',
        managerId: 'manager-456',
        metadata: { nested: { value: 'test' } },
      });

      await contextManager.addMessage(original.conversationId, {
        id: 'msg-1',
        role: 'user',
        content: 'Test message',
        timestamp: new Date(),
      });

      const cloned = await contextManager.cloneContext(original.conversationId);

      expect(cloned.conversationId).not.toBe(original.conversationId);
      expect(cloned.teamId).toBe(original.teamId);
      expect(cloned.messageHistory).toHaveLength(1);
      expect(cloned.metadata).toEqual(original.metadata);

      // Verify deep copy
      cloned.metadata.nested.value = 'modified';
      const originalReloaded = await contextManager.getContext(original.conversationId);
      expect(originalReloaded?.metadata.nested.value).toBe('test');
    });
  });
});