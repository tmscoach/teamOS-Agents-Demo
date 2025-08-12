/**
 * Script to fetch the actual TMS API JSON report and store it properly
 * This ensures we use the full data, not simplified mock data
 */

import { PrismaClient } from '@/lib/generated/prisma';
import { executeTMSTool } from '@/src/lib/agents/tools/tms-tool-executor';
import { mockTMSClient } from '@/src/lib/mock-tms-api/mock-api-client';
import { ReportStorageService } from '@/src/lib/services/report-storage/report-storage.service';

const prisma = new PrismaClient();

async function fetchAndStoreFullReport() {
  const subscriptionId = '21989';
  
  try {
    console.log('🔄 Fetching full JSON report from TMS API for subscription:', subscriptionId);
    
    // Import mock data store to access test data
    const { mockDataStore } = await import('@/src/lib/mock-tms-api/mock-data-store');
    
    // Get the test user that owns the subscription
    const testUser = mockDataStore.getUserByEmail('facilitator@example.com');
    if (!testUser) {
      throw new Error('Test user not found. Mock data store not initialized properly.');
    }
    
    console.log('✅ Using test user:', testUser.id);
    
    // Generate a JWT token for this user
    const jwt = mockTMSClient.generateJWT({
      sub: testUser.id,
      UserType: 'Facilitator',
      nameid: testUser.email,
      organisationId: testUser.organizationId
    });
    
    // The JWT will be automatically recognized by the mock API through decoding
    
    // Mark the subscription as completed so we can retrieve the report
    const subscription = mockDataStore.getSubscription(subscriptionId);
    if (subscription) {
      subscription.status = 'completed';
      subscription.completionPercentage = 100;
      subscription.completedAt = new Date().toISOString();
      console.log('✅ Marked subscription as completed');
    }
    
    // Fetch the actual JSON report from TMS API
    const result = await executeTMSTool({
      tool: 'tms_get_json_report',
      parameters: {
        subscriptionId
      },
      jwt
    });
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to fetch JSON report');
    }
    
    console.log('✅ Fetched JSON report successfully');
    
    // Extract the actual data (unwrap if needed)
    const jsonData = result.data.data || result.data;
    
    // Log report structure
    console.log('\n📊 Report Structure:');
    console.log('- Subscription ID:', jsonData.subscriptionId);
    console.log('- Workflow Type:', jsonData.workflowType);
    console.log('- Total Sections:', jsonData.sections?.length || 0);
    console.log('- Has Metadata:', !!jsonData.metadata);
    
    if (jsonData.sections) {
      console.log('\n📑 Sections:');
      jsonData.sections.forEach((section: any, index: number) => {
        console.log(`  ${index + 1}. ${section.title} (${section.type})`);
        console.log(`     - Has vectorChunk: ${!!section.vectorChunk}`);
        console.log(`     - VectorChunk length: ${section.vectorChunk?.length || 0}`);
        if (section.visualization) {
          console.log(`     - Visualization type: ${section.visualization.type}`);
        }
      });
    }
    
    // Find or create the report
    let report = await prisma.userReport.findFirst({
      where: { subscriptionId },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!report) {
      console.log('\n📝 Creating new report record...');
      
      // Get user for the report
      const user = await prisma.user.findFirst({
        where: { email: 'rowan@teammanagementsystems.com' }
      });
      
      if (!user) {
        throw new Error('User not found. Please ensure rowan@teammanagementsystems.com exists in the database.');
      }
      
      report = await prisma.userReport.create({
        data: {
          userId: user.id,
          organizationId: user.organizationId,
          subscriptionId,
          reportType: jsonData.workflowType || 'TMP',
          templateId: jsonData.templateId || null,
          jsonData: jsonData,
          metadata: jsonData.metadata || {},
          processingStatus: 'PENDING',
          rawHtml: '' // Empty since this is JSON-only
        }
      });
      console.log('✅ Created new report:', report.id);
    } else {
      console.log('\n📝 Updating existing report:', report.id);
      
      // Update with the full JSON data
      await prisma.userReport.update({
        where: { id: report.id },
        data: {
          jsonData: jsonData,
          metadata: jsonData.metadata || {},
          processingStatus: 'PENDING'
        }
      });
      console.log('✅ Updated report with full JSON data');
    }
    
    // Clear existing chunks for this report
    console.log('\n🗑️  Clearing existing chunks...');
    await prisma.reportChunk.deleteMany({
      where: { reportId: report.id }
    });
    
    // Process the JSON report to create vector chunks
    console.log('\n🔄 Processing JSON report for vector embeddings...');
    const storageService = new ReportStorageService(prisma);
    await storageService.processJSONReport(report.id, jsonData);
    
    console.log('✅ Successfully processed JSON report with vector embeddings');
    
    // Verify chunks were created
    const chunkCount = await prisma.reportChunk.count({
      where: { reportId: report.id }
    });
    console.log(`\n📊 Created ${chunkCount} vector chunks`);
    
    // Show sample chunks
    const sampleChunks = await prisma.reportChunk.findMany({
      where: { reportId: report.id },
      take: 3,
      orderBy: { chunkIndex: 'asc' }
    });
    
    console.log('\n📑 Sample chunks:');
    sampleChunks.forEach((chunk, index) => {
      console.log(`  ${index + 1}. ${chunk.sectionTitle}`);
      console.log(`     Content preview: ${chunk.content.substring(0, 100)}...`);
    });
    
    console.log('\n✨ Success! Full JSON report stored and processed.');
    console.log(`\n🎯 View the report at: http://localhost:3000/reports/json/${subscriptionId}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fetchAndStoreFullReport();