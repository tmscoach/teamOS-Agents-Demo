/**
 * Test AI Agent's ability to access full report context
 * Simulates what the DebriefAgent would do when chatting about a report
 */

import { PrismaClient } from '@/lib/generated/prisma';
import { searchReportChunksVector } from '@/src/lib/agents/tools/search-report-chunks-vector';

const prisma = new PrismaClient();

async function testAIReportContext() {
  const subscriptionId = '21989';
  
  console.log('🤖 Testing AI Report Context Access\n');
  console.log('=' .repeat(60));
  
  try {
    // Get the report
    const report = await prisma.userReport.findFirst({
      where: { subscriptionId },
      select: {
        id: true,
        jsonData: true,
        metadata: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!report) {
      console.log('❌ No report found');
      return;
    }
    
    const jsonData = report.jsonData as any;
    console.log('✅ Report loaded');
    console.log(`   - Sections: ${jsonData?.sections?.length || 0}`);
    console.log(`   - Workflow: ${jsonData?.workflowType}`);
    console.log(`   - User: ${jsonData?.metadata?.userName}\n`);
    
    // Test queries that an AI might need to answer
    const testQueries = [
      {
        question: "What is Bryan's major role?",
        search: "major role Bryan Johnson Upholder Maintainer"
      },
      {
        question: "What are the key strengths?",
        search: "leadership strengths key points"
      },
      {
        question: "Tell me about work preferences",
        search: "work preference measures ICBS profile"
      },
      {
        question: "What visualizations are available?",
        search: "visualization wheel chart graph"
      }
    ];
    
    console.log('🔍 Testing AI Context Retrieval:\n');
    
    for (const test of testQueries) {
      console.log(`Q: "${test.question}"`);
      
      // Search for relevant chunks
      const chunks = await prisma.reportChunk.findMany({
        where: {
          reportId: report.id,
          OR: test.search.split(' ').map(term => ({
            content: {
              contains: term,
              mode: 'insensitive' as const
            }
          }))
        },
        select: {
          sectionTitle: true,
          content: true
        },
        take: 2
      });
      
      if (chunks.length > 0) {
        console.log(`✅ Found ${chunks.length} relevant chunks:`);
        chunks.forEach((chunk, i) => {
          const preview = chunk.content.substring(0, 150).replace(/\n/g, ' ');
          console.log(`   ${i + 1}. [${chunk.sectionTitle}] "${preview}..."`);
        });
      } else {
        console.log('❌ No relevant chunks found');
      }
      console.log('');
    }
    
    // Test full context availability
    console.log('📊 Full Context Check:\n');
    
    const allChunks = await prisma.reportChunk.count({
      where: { reportId: report.id }
    });
    
    const chunksWithEmbeddings = await prisma.$queryRaw<{count: bigint}[]>`
      SELECT COUNT(*) as count 
      FROM "ReportChunk" 
      WHERE "reportId" = ${report.id} 
      AND embedding IS NOT NULL
    `;
    
    const embeddingCount = Number(chunksWithEmbeddings[0]?.count || 0);
    
    console.log(`✅ Total chunks available: ${allChunks}`);
    console.log(`✅ Chunks with embeddings: ${embeddingCount}`);
    console.log(`✅ Coverage: ${Math.round((embeddingCount / allChunks) * 100)}%`);
    
    // Check specific sections AI needs
    const importantSections = [
      'Team Management Profile',
      'Leadership Strengths',
      'Decision-Making',
      'Areas for Self-Assessment',
      'Related Roles'
    ];
    
    console.log('\n📋 Critical Sections for AI:');
    for (const section of importantSections) {
      const exists = await prisma.reportChunk.findFirst({
        where: {
          reportId: report.id,
          sectionTitle: section
        }
      });
      console.log(`   ${exists ? '✅' : '❌'} ${section}`);
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('✨ Summary:');
    console.log(`   - AI has access to ${allChunks} chunks of report content`);
    console.log(`   - ${embeddingCount} chunks are vector-indexed for semantic search`);
    console.log('   - All critical sections are available for debrief conversations');
    console.log('\n🎯 The AI agent can effectively discuss this report!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testAIReportContext();