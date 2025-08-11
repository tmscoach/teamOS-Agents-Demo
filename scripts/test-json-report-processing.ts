/**
 * Test script for JSON Report Processing (Phase 1)
 * Run with: npx tsx scripts/test-json-report-processing.ts
 */

import { PrismaClient } from '@/lib/generated/prisma';
import { ReportStorageService } from '@/src/lib/services/report-storage/report-storage.service';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testJSONReportProcessing() {
  const prisma = new PrismaClient();
  const reportService = new ReportStorageService(prisma);
  
  try {
    console.log('🧪 Testing JSON Report Processing...\n');
    
    // Check if OpenAI API key is available
    if (process.env.OPENAI_API_KEY) {
      console.log('✓ OpenAI API key detected (will generate embeddings)');
    } else {
      console.log('⚠️  No OpenAI API key found (embeddings will be skipped)');
    }
    console.log();
    
    // Step 1: Create a test user if needed
    const testUser = await prisma.user.upsert({
      where: { email: 'json-test@example.com' },
      update: {},
      create: {
        id: 'test-user-json-' + Date.now(),
        email: 'json-test@example.com',
        role: 'TEAM_MEMBER',
        name: 'Test User',
        clerkId: 'clerk_test_' + Date.now(),
        updatedAt: new Date()
      }
    });
    console.log('✓ Test user ready:', testUser.email);
    
    // Step 2: Create a test report
    const testReport = await prisma.userReport.create({
      data: {
        userId: testUser.id,
        organizationId: 'test-org',
        reportType: 'TMP',
        subscriptionId: '21989-test-' + Date.now(),
        templateId: '6',
        rawHtml: '<html><body>Test Report</body></html>',
        processingStatus: 'PENDING'
      }
    });
    console.log('✓ Test report created:', testReport.id);
    
    // Step 3: Create mock JSON data (similar to what the endpoint returns)
    const mockJSONData = {
      success: true,
      data: {
        reportId: `rpt_tmp_${testReport.subscriptionId}`,
        subscriptionId: testReport.subscriptionId,
        workflowType: 'TMP',
        sections: [
          {
            id: 'test-section-1',
            type: 'visual',
            title: 'Team Management Profile Test',
            order: 1,
            visualization: {
              type: 'CreateTMPQWheel',
              data: {
                majorRole: { name: 'Upholder Maintainer' }
              }
            },
            vectorChunk: 'TMP Wheel showing Upholder Maintainer as major role for testing vector embeddings'
          },
          {
            id: 'test-section-2',
            type: 'content',
            title: 'Work Preferences Test',
            order: 2,
            content: {
              text: 'This is test content for work preferences analysis.',
              subsections: [
                {
                  title: 'Introvert vs Extrovert',
                  content: 'Test shows balanced preference between introvert and extrovert work styles.'
                }
              ]
            },
            vectorChunk: 'Work preferences showing balanced introvert-extrovert orientation'
          }
        ]
      }
    };
    
    console.log('\n📝 Processing JSON report with', mockJSONData.data.sections.length, 'sections...');
    
    // Step 4: Process the JSON report
    await reportService.processJSONReport(testReport.id, mockJSONData);
    console.log('✓ JSON report processed successfully');
    
    // Step 5: Verify the results
    console.log('\n🔍 Verifying results...');
    
    // Check if report was updated with jsonData
    const updatedReport = await prisma.userReport.findUnique({
      where: { id: testReport.id }
    });
    
    console.log('✓ Report status:', updatedReport?.processingStatus);
    console.log('✓ JSON data stored:', updatedReport?.jsonData ? 'Yes' : 'No');
    
    // Check if chunks were created
    const chunks = await prisma.reportChunk.findMany({
      where: { reportId: testReport.id }
    });
    
    console.log('✓ Chunks created:', chunks.length);
    
    for (const chunk of chunks) {
      console.log(`  - ${chunk.sectionTitle}: ${chunk.content.substring(0, 50)}...`);
      console.log(`    Has embedding: ${chunk.embedding ? 'Yes ✓' : 'No ✗'}`);
    }
    
    // Step 6: Test vector search (if embeddings exist)
    // Re-fetch chunks with raw SQL to get the embedding data
    const chunksWithEmbeddings = await prisma.$queryRaw<any[]>`
      SELECT id, "sectionTitle", content, 
             embedding IS NOT NULL as has_embedding,
             octet_length(embedding::text) as embedding_size
      FROM "ReportChunk"
      WHERE "reportId" = ${testReport.id}
    `;
    
    console.log('\n📊 Embedding verification (raw SQL):');
    for (const chunk of chunksWithEmbeddings) {
      console.log(`  - ${chunk.sectionTitle}: embedding=${chunk.has_embedding}, size=${chunk.embedding_size}`);
    }
    
    if (chunksWithEmbeddings.length > 0 && chunksWithEmbeddings[0].has_embedding) {
      console.log('\n🔍 Testing vector search...');
      
      const searchResults = await prisma.$queryRaw`
        SELECT "sectionTitle", content
        FROM "ReportChunk"
        WHERE "reportId" = ${testReport.id}
        AND embedding IS NOT NULL
        LIMIT 3
      `;
      
      console.log('✓ Vector search ready, found', (searchResults as any[]).length, 'chunks with embeddings');
    }
    
    console.log('\n✅ All Phase 1 tests completed successfully!');
    
    // Optional: Comment out cleanup to inspect data in Supabase
    const cleanup = await prisma.userReport.delete({
      where: { id: testReport.id }
    });
    console.log('\n🧹 Test data cleaned up');
    
    // Alternative: Keep data for inspection
    // console.log('\n💾 Test data kept for inspection. Report ID:', testReport.id);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack:', error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testJSONReportProcessing();