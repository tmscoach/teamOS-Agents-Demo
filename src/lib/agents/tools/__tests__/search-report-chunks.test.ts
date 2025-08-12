import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import prisma from '@/lib/db';
import { AgentContext } from '../../types';
import { v4 as uuidv4 } from 'uuid';

// Mock OpenAI before importing the tool
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    embeddings: {
      create: jest.fn().mockResolvedValue({
        data: [{ embedding: new Array(1536).fill(0.1) }]
      })
    }
  }));
});

import { createSearchReportChunksTool } from '../search-report-chunks';

describe('Search Report Chunks Tool', () => {
  let testReportId: string;
  let testUserId: string;
  let testSubscriptionId: string;
  
  beforeAll(async () => {
    // Create test data
    testUserId = uuidv4();
    testSubscriptionId = 'test-sub-' + Date.now();
    testReportId = uuidv4();
    
    // Create test user
    await prisma.user.create({
      data: {
        id: testUserId,
        email: 'test@example.com',
        name: 'Test User',
        clerckId: 'test-clerk-id'
      }
    });
    
    // Create test subscription
    await prisma.subscription.create({
      data: {
        id: testSubscriptionId,
        userId: testUserId,
        type: 'ASSESSMENT',
        status: 'ACTIVE'
      }
    });
    
    // Create test report
    await prisma.userReport.create({
      data: {
        id: testReportId,
        userId: testUserId,
        subscriptionId: testSubscriptionId,
        reportType: 'TMP',
        processingStatus: 'COMPLETED',
        reportData: {}
      }
    });
    
    // Create test chunks with embeddings
    const testChunks = [
      {
        id: uuidv4(),
        reportId: testReportId,
        sectionId: 'areas-for-self-assessment',
        sectionTitle: 'Areas for Self-Assessment',
        content: 'You often do your best work when by yourself. Communication is important. Ideas are your strength.',
        chunkIndex: 0,
        charCount: 100
      },
      {
        id: uuidv4(),
        reportId: testReportId,
        sectionId: 'team-building',
        sectionTitle: 'Team-Building',
        content: 'You prefer to have a close group of colleagues who share the same values. Establishing esprit de corps is important.',
        chunkIndex: 1,
        charCount: 120
      },
      {
        id: uuidv4(),
        reportId: testReportId,
        sectionId: 'decision-making',
        sectionTitle: 'Decision-Making',
        content: 'Your approach to decision-making is heavily influenced by your beliefs and values.',
        chunkIndex: 2,
        charCount: 80
      },
      {
        id: uuidv4(),
        reportId: testReportId,
        sectionId: 'rido-scores',
        sectionTitle: 'RIDO Scores',
        content: 'Net Scores: I=7, C=3, B=5, S=9. Raw Scores: Extrovert=8, Introvert=15.',
        chunkIndex: 3,
        charCount: 70
      }
    ];
    
    for (const chunk of testChunks) {
      await prisma.reportChunk.create({ data: chunk });
    }
  });
  
  afterAll(async () => {
    // Clean up test data
    await prisma.reportChunk.deleteMany({
      where: { reportId: testReportId }
    });
    await prisma.userReport.delete({
      where: { id: testReportId }
    });
    await prisma.subscription.delete({
      where: { id: testSubscriptionId }
    });
    await prisma.user.delete({
      where: { id: testUserId }
    });
    await prisma.$disconnect();
  });
  
  describe('Keyword Search', () => {
    it('should find chunks by exact keyword match', async () => {
      const tool = createSearchReportChunksTool();
      const context: AgentContext = {
        metadata: {
          userId: testUserId,
          subscriptionId: testSubscriptionId,
          reportId: testReportId
        }
      };
      
      const result = await tool.execute(
        { query: 'self-assessment' },
        context
      );
      
      expect(result.success).toBe(true);
      expect(result.output).toContain('Areas for Self-Assessment');
      expect(result.output).toContain('Ideas are your strength');
    });
    
    it('should find chunks by partial keyword match', async () => {
      const tool = createSearchReportChunksTool();
      const context: AgentContext = {
        metadata: {
          userId: testUserId,
          subscriptionId: testSubscriptionId,
          reportId: testReportId
        }
      };
      
      const result = await tool.execute(
        { query: 'team' },
        context
      );
      
      expect(result.success).toBe(true);
      expect(result.output).toContain('Team-Building');
      expect(result.output).toContain('esprit de corps');
    });
    
    it('should find RIDO scores', async () => {
      const tool = createSearchReportChunksTool();
      const context: AgentContext = {
        metadata: {
          userId: testUserId,
          subscriptionId: testSubscriptionId,
          reportId: testReportId
        }
      };
      
      const result = await tool.execute(
        { query: 'net scores' },
        context
      );
      
      expect(result.success).toBe(true);
      expect(result.output).toContain('RIDO Scores');
      expect(result.output).toContain('I=7');
    });
  });
  
  describe('Report Context', () => {
    it('should use reportId from params over context', async () => {
      const tool = createSearchReportChunksTool();
      const context: AgentContext = {
        metadata: {
          userId: testUserId,
          subscriptionId: testSubscriptionId,
          reportId: 'wrong-report-id'
        }
      };
      
      const result = await tool.execute(
        { query: 'decision', reportId: testReportId },
        context
      );
      
      expect(result.success).toBe(true);
      expect(result.output).toContain('Decision-Making');
    });
    
    it('should find report by subscription if no reportId provided', async () => {
      const tool = createSearchReportChunksTool();
      const context: AgentContext = {
        metadata: {
          userId: testUserId,
          subscriptionId: testSubscriptionId
        }
      };
      
      const result = await tool.execute(
        { query: 'values' },
        context
      );
      
      expect(result.success).toBe(true);
      expect(result.output).toContain('beliefs and values');
    });
    
    it('should return error if no report identification available', async () => {
      const tool = createSearchReportChunksTool();
      const context: AgentContext = {
        metadata: {}
      };
      
      const result = await tool.execute(
        { query: 'test' },
        context
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing report identification');
    });
  });
  
  describe('Result Limits', () => {
    it('should respect limit parameter', async () => {
      const tool = createSearchReportChunksTool();
      const context: AgentContext = {
        metadata: {
          userId: testUserId,
          subscriptionId: testSubscriptionId,
          reportId: testReportId
        }
      };
      
      const result = await tool.execute(
        { query: 'your', limit: 2 },
        context
      );
      
      expect(result.success).toBe(true);
      // Count the number of section separators
      const sectionCount = (result.output.match(/\*\*/g) || []).length / 2;
      expect(sectionCount).toBeLessThanOrEqual(2);
    });
  });
  
  describe('Vector Search Fallback', () => {
    it('should fall back to vector search when no keyword matches', async () => {
      const tool = createSearchReportChunksTool();
      const context: AgentContext = {
        metadata: {
          userId: testUserId,
          subscriptionId: testSubscriptionId,
          reportId: testReportId
        }
      };
      
      // Query that won't match keywords but semantically related
      const result = await tool.execute(
        { query: 'collaborative work style preferences' },
        context
      );
      
      // Since we don't have embeddings in test data, it should return no results
      // but not fail
      expect(result.success).toBe(true);
    });
  });
});