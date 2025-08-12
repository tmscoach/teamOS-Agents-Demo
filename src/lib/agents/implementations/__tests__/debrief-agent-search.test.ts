import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { DebriefAgent } from '../debrief-agent';
import prisma from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';

// Mock OpenAI
jest.mock('openai');

describe('Debrief Agent - Report Search Functionality', () => {
  let agent: DebriefAgent;
  let testReportId: string;
  let testUserId: string;
  let testSubscriptionId: string;
  
  beforeAll(async () => {
    // Mock OpenAI embeddings
    const mockOpenAI = {
      embeddings: {
        create: jest.fn().mockResolvedValue({
          data: [{ embedding: new Array(1536).fill(0.1) }]
        })
      },
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: 'Test response',
                tool_calls: []
              }
            }]
          })
        }
      }
    };
    
    (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => mockOpenAI as any);
    
    // Create test data
    testUserId = uuidv4();
    testSubscriptionId = 'test-debrief-' + Date.now();
    testReportId = uuidv4();
    
    // Create test user
    await prisma.user.create({
      data: {
        id: testUserId,
        email: 'debrief-test@example.com',
        name: 'Debrief Test User',
        clerckId: 'test-clerk-debrief'
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
        reportData: {
          sections: [
            {
              id: 'areas_for_self_assessment',
              title: 'Areas for Self-Assessment',
              content: {
                introduction: 'Your approach has strengths that are useful at work.',
                points: [
                  { text: 'Communication is important for your work style.' },
                  { text: 'Ideas are your strength, gathering facts may be a weakness.' }
                ],
                conclusion: 'You bring many strengths to your job.'
              }
            },
            {
              id: 'team_building',
              title: 'Team-Building',
              content: {
                paragraphs: [
                  'You prefer close colleagues who share your values.',
                  'Establishing esprit de corps is important to you.'
                ]
              }
            },
            {
              id: 'decision_making',
              title: 'Decision-Making',
              content: {
                text: 'Your decisions are influenced by beliefs and values.'
              }
            }
          ]
        }
      }
    });
    
    // Create comprehensive test chunks
    const testChunks = [
      {
        id: uuidv4(),
        reportId: testReportId,
        sectionId: 'areas-for-self-assessment',
        sectionTitle: 'Areas for Self-Assessment',
        content: `AREAS FOR SELF-ASSESSMENT

Your approach has strengths that are useful at work.

• Communication is important for your work style.
• Ideas are your strength, gathering facts may be a weakness.

You bring many strengths to your job.`,
        chunkIndex: 0,
        charCount: 200,
        metadata: { hasEmbedding: true }
      },
      {
        id: uuidv4(),
        reportId: testReportId,
        sectionId: 'team-building',
        sectionTitle: 'Team-Building',
        content: `TEAM-BUILDING

You prefer close colleagues who share your values.
Establishing esprit de corps is important to you.`,
        chunkIndex: 1,
        charCount: 115,
        metadata: { hasEmbedding: true }
      },
      {
        id: uuidv4(),
        reportId: testReportId,
        sectionId: 'decision-making',
        sectionTitle: 'Decision-Making',
        content: `DECISION-MAKING

Your decisions are influenced by beliefs and values.`,
        chunkIndex: 2,
        charCount: 70,
        metadata: { hasEmbedding: true }
      },
      {
        id: uuidv4(),
        reportId: testReportId,
        sectionId: 'rido-visualization',
        sectionTitle: 'RIDO Ruler Spectrum Visualization',
        content: `RIDO RULER SPECTRUM VISUALIZATION

YOUR NET SCORES:
- Relationships: Introvert (I) = 7
- Information: Creative (C) = 3
- Decisions: Beliefs (B) = 5
- Organisation: Structured (S) = 9

YOUR RAW SCORES:
- Extrovert: 8 vs Introvert: 15
- Practical: 12 vs Creative: 15
- Analytical: 10 vs Beliefs: 15
- Structured: 18 vs Flexible: 9`,
        chunkIndex: 3,
        charCount: 290,
        metadata: { hasEmbedding: true }
      }
    ];
    
    // Store chunks with mock embeddings using raw SQL
    for (const chunk of testChunks) {
      const mockEmbedding = new Array(1536).fill(0.1);
      await prisma.$executeRaw`
        INSERT INTO "ReportChunk" (
          id,
          "reportId",
          "sectionId",
          "sectionTitle",
          content,
          "chunkIndex",
          "charCount",
          embedding,
          metadata,
          "createdAt"
        ) VALUES (
          ${chunk.id},
          ${chunk.reportId},
          ${chunk.sectionId},
          ${chunk.sectionTitle},
          ${chunk.content},
          ${chunk.chunkIndex},
          ${chunk.charCount},
          ${mockEmbedding}::vector,
          ${JSON.stringify(chunk.metadata)}::jsonb,
          NOW()
        )
      `;
    }
    
    // Initialize agent
    agent = new DebriefAgent({
      model: 'gpt-4',
      temperature: 0.7
    });
  });
  
  afterAll(async () => {
    // Clean up test data
    await prisma.$executeRaw`
      DELETE FROM "ReportChunk" WHERE "reportId" = ${testReportId}
    `;
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
  
  describe('Section Search', () => {
    it('should find Areas for Self-Assessment section', async () => {
      const tools = agent.getTools();
      const searchTool = tools.find(t => t.name === 'search_report_chunks');
      expect(searchTool).toBeDefined();
      
      const result = await searchTool!.execute(
        { query: 'areas for self-assessment' },
        { metadata: { userId: testUserId, subscriptionId: testSubscriptionId } }
      );
      
      expect(result.success).toBe(true);
      expect(result.output).toContain('Areas for Self-Assessment');
      expect(result.output).toContain('Communication is important');
      expect(result.output).toContain('Ideas are your strength');
    });
    
    it('should find Team-Building section', async () => {
      const tools = agent.getTools();
      const searchTool = tools.find(t => t.name === 'search_report_chunks');
      
      const result = await searchTool!.execute(
        { query: 'team building' },
        { metadata: { userId: testUserId, subscriptionId: testSubscriptionId } }
      );
      
      expect(result.success).toBe(true);
      expect(result.output).toContain('Team-Building');
      expect(result.output).toContain('colleagues who share your values');
      expect(result.output).toContain('esprit de corps');
    });
    
    it('should find Decision-Making section', async () => {
      const tools = agent.getTools();
      const searchTool = tools.find(t => t.name === 'search_report_chunks');
      
      const result = await searchTool!.execute(
        { query: 'decision making' },
        { metadata: { userId: testUserId, subscriptionId: testSubscriptionId } }
      );
      
      expect(result.success).toBe(true);
      expect(result.output).toContain('Decision-Making');
      expect(result.output).toContain('beliefs and values');
    });
  });
  
  describe('RIDO Scores Search', () => {
    it('should find net scores', async () => {
      const tools = agent.getTools();
      const searchTool = tools.find(t => t.name === 'search_report_chunks');
      
      const result = await searchTool!.execute(
        { query: 'net scores' },
        { metadata: { userId: testUserId, subscriptionId: testSubscriptionId } }
      );
      
      expect(result.success).toBe(true);
      expect(result.output).toContain('NET SCORES');
      expect(result.output).toContain('Introvert (I) = 7');
      expect(result.output).toContain('Creative (C) = 3');
      expect(result.output).toContain('Beliefs (B) = 5');
      expect(result.output).toContain('Structured (S) = 9');
    });
    
    it('should find raw scores', async () => {
      const tools = agent.getTools();
      const searchTool = tools.find(t => t.name === 'search_report_chunks');
      
      const result = await searchTool!.execute(
        { query: 'raw scores' },
        { metadata: { userId: testUserId, subscriptionId: testSubscriptionId } }
      );
      
      expect(result.success).toBe(true);
      expect(result.output).toContain('RAW SCORES');
      expect(result.output).toContain('Extrovert: 8 vs Introvert: 15');
      expect(result.output).toContain('Practical: 12 vs Creative: 15');
    });
    
    it('should find RIDO information', async () => {
      const tools = agent.getTools();
      const searchTool = tools.find(t => t.name === 'search_report_chunks');
      
      const result = await searchTool!.execute(
        { query: 'RIDO' },
        { metadata: { userId: testUserId, subscriptionId: testSubscriptionId } }
      );
      
      expect(result.success).toBe(true);
      expect(result.output).toContain('RIDO');
      expect(result.output).toContain('Ruler Spectrum');
    });
  });
  
  describe('Vector Search Fallback', () => {
    it('should use vector search when keywords dont match exactly', async () => {
      const tools = agent.getTools();
      const searchTool = tools.find(t => t.name === 'search_report_chunks');
      
      // This query won't match keywords but should trigger vector search
      const result = await searchTool!.execute(
        { query: 'personality assessment feedback' },
        { metadata: { userId: testUserId, subscriptionId: testSubscriptionId } }
      );
      
      expect(result.success).toBe(true);
      // Vector search should find relevant content even without keyword match
    });
  });
  
  describe('Content Completeness', () => {
    it('should return complete content not just titles', async () => {
      const tools = agent.getTools();
      const searchTool = tools.find(t => t.name === 'search_report_chunks');
      
      const result = await searchTool!.execute(
        { query: 'self-assessment' },
        { metadata: { userId: testUserId, subscriptionId: testSubscriptionId } }
      );
      
      expect(result.success).toBe(true);
      // Should have actual content, not just section title
      expect(result.output.length).toBeGreaterThan(100);
      expect(result.output).not.toBe('AREAS FOR SELF-ASSESSMENT'); // Not just title
      expect(result.output).toContain('Communication is important');
      expect(result.output).toContain('Ideas are your strength');
      expect(result.output).toContain('You bring many strengths');
    });
  });
});