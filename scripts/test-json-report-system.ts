/**
 * Comprehensive test script for JSON report storage and vector chunks
 * Tests:
 * 1. JSON data storage integrity
 * 2. Vector chunk creation and embedding
 * 3. Search functionality
 * 4. Report retrieval via API
 */

import { PrismaClient } from '@/lib/generated/prisma';
import { executeTMSTool } from '@/src/lib/agents/tools/tms-tool-executor';

const prisma = new PrismaClient();

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  log(`📋 ${title}`, colors.bright + colors.cyan);
  console.log('='.repeat(60));
}

function logTest(name: string, passed: boolean, details?: string) {
  const icon = passed ? '✅' : '❌';
  const color = passed ? colors.green : colors.red;
  log(`${icon} ${name}`, color);
  if (details) {
    console.log(`   ${details}`);
  }
}

async function testJSONReportSystem() {
  const subscriptionId = '21989';
  let allTestsPassed = true;
  
  try {
    logSection('JSON Report System Test Suite');
    log(`Testing subscription: ${subscriptionId}\n`, colors.yellow);
    
    // ========================================
    // Test 1: JSON Data Storage
    // ========================================
    logSection('Test 1: JSON Data Storage Integrity');
    
    const reports = await prisma.userReport.findMany({
      where: { subscriptionId },
      select: {
        id: true,
        jsonData: true,
        processingStatus: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 1
    });
    
    if (reports.length === 0) {
      logTest('Report exists', false, 'No report found');
      allTestsPassed = false;
      return;
    }
    
    const report = reports[0];
    const jsonData = report.jsonData as any;
    
    logTest('Report exists', true, `Report ID: ${report.id}`);
    logTest('JSON data present', !!jsonData, `Has data: ${!!jsonData}`);
    logTest('Processing status', report.processingStatus === 'COMPLETED', `Status: ${report.processingStatus}`);
    
    // Check JSON structure
    const hasCorrectStructure = jsonData?.sections && Array.isArray(jsonData.sections);
    logTest('JSON structure valid', hasCorrectStructure, `Sections array: ${hasCorrectStructure}`);
    
    const sectionCount = jsonData?.sections?.length || 0;
    const expectedSections = 14; // TMP report should have 14 sections
    logTest('Section count', sectionCount === expectedSections, `Found ${sectionCount} sections (expected ${expectedSections})`);
    
    // Check for vector chunks in sections
    const sectionsWithVectorChunks = jsonData?.sections?.filter((s: any) => s.vectorChunk)?.length || 0;
    logTest('Sections with vectorChunks', sectionsWithVectorChunks > 0, `${sectionsWithVectorChunks} sections have vectorChunks`);
    
    // Verify key sections exist
    const keyTitles = ['Team Management Profile', 'Introduction', 'Work Preference Measures'];
    const foundTitles = jsonData?.sections?.map((s: any) => s.title) || [];
    const hasKeySections = keyTitles.every(title => foundTitles.includes(title));
    logTest('Key sections present', hasKeySections, `Found: ${foundTitles.slice(0, 3).join(', ')}...`);
    
    if (!hasCorrectStructure || sectionCount !== expectedSections) {
      allTestsPassed = false;
    }
    
    // ========================================
    // Test 2: Vector Chunks
    // ========================================
    logSection('Test 2: Vector Chunk Storage');
    
    const chunks = await prisma.reportChunk.findMany({
      where: { reportId: report.id },
      select: {
        id: true,
        sectionTitle: true,
        content: true,
        chunkIndex: true
      },
      orderBy: { chunkIndex: 'asc' }
    });
    
    logTest('Chunks created', chunks.length > 0, `Found ${chunks.length} chunks`);
    
    // Check if chunks match sections with content
    const expectedChunks = sectionsWithVectorChunks || sectionCount;
    const chunkCountValid = chunks.length >= Math.min(expectedChunks, sectionCount);
    logTest('Chunk count appropriate', chunkCountValid, `${chunks.length} chunks for ${sectionCount} sections`);
    
    // Verify chunk content
    const hasContent = chunks.every(chunk => chunk.content && chunk.content.length > 0);
    logTest('All chunks have content', hasContent, hasContent ? 'All chunks contain text' : 'Some chunks are empty');
    
    // Check for embeddings using raw SQL query
    const chunksWithEmbeddings = await prisma.$queryRaw<{count: bigint}[]>`
      SELECT COUNT(*) as count 
      FROM "ReportChunk" 
      WHERE "reportId" = ${report.id} 
      AND embedding IS NOT NULL
    `;
    const embeddingCount = Number(chunksWithEmbeddings[0]?.count || 0);
    const embeddingPercentage = chunks.length > 0 ? Math.round((embeddingCount / chunks.length) * 100) : 0;
    logTest('Embeddings generated', embeddingCount > 0, `${embeddingCount}/${chunks.length} chunks (${embeddingPercentage}%) have embeddings`);
    
    // Sample chunk content
    if (chunks.length > 0) {
      console.log('\n📝 Sample Chunks:');
      chunks.slice(0, 3).forEach((chunk, i) => {
        console.log(`   ${i + 1}. ${chunk.sectionTitle}`);
        console.log(`      Content: "${chunk.content.substring(0, 80)}..."`);
        // Embeddings checked separately
      });
    }
    
    if (chunks.length === 0 || !hasContent) {
      allTestsPassed = false;
    }
    
    // ========================================
    // Test 3: Vector Search
    // ========================================
    logSection('Test 3: Vector Search Functionality');
    
    // Test search for specific content
    const searchQueries = [
      'Upholder Maintainer',
      'Bryan Johnson',
      'Work Preference',
      'Controller Inspector'
    ];
    
    for (const query of searchQueries) {
      const results = await prisma.reportChunk.findMany({
        where: {
          reportId: report.id,
          content: {
            contains: query,
            mode: 'insensitive'
          }
        },
        select: {
          sectionTitle: true,
          content: true
        },
        take: 3
      });
      
      const found = results.length > 0;
      logTest(`Search: "${query}"`, found, `Found in ${results.length} chunks`);
      
      if (found && results[0]) {
        const preview = results[0].content.substring(0, 100);
        console.log(`      Preview: "${preview}..."`);
      }
    }
    
    // ========================================
    // Test 4: API Endpoint
    // ========================================
    logSection('Test 4: API Endpoint Functionality');
    
    // Test the API endpoint
    const apiUrl = `http://localhost:3001/api/reports/json/${subscriptionId}`;
    
    try {
      const response = await fetch(apiUrl, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const isOk = response.ok;
      logTest('API endpoint accessible', isOk, `Status: ${response.status} ${response.statusText}`);
      
      if (isOk) {
        const data = await response.json();
        const hasData = !!data.data || !!data.jsonData;
        logTest('API returns data', hasData, hasData ? 'JSON data received' : 'No data in response');
        
        // Check if it's cached
        const isCached = data.cached === true;
        log(`   Data source: ${isCached ? 'Cached from database' : 'Fresh from TMS API'}`, colors.blue);
      } else {
        allTestsPassed = false;
      }
    } catch (apiError) {
      logTest('API endpoint accessible', false, `Error: ${apiError}`);
      allTestsPassed = false;
    }
    
    // ========================================
    // Test 5: Data Completeness
    // ========================================
    logSection('Test 5: Data Completeness Check');
    
    // Verify the report has all expected data
    const dataChecks = [
      { field: 'reportId', value: jsonData?.reportId },
      { field: 'subscriptionId', value: jsonData?.subscriptionId },
      { field: 'workflowType', value: jsonData?.workflowType },
      { field: 'metadata', value: jsonData?.metadata },
      { field: 'sections', value: jsonData?.sections }
    ];
    
    dataChecks.forEach(check => {
      const exists = !!check.value;
      logTest(`Field: ${check.field}`, exists, exists ? '✓ Present' : '✗ Missing');
      if (!exists) allTestsPassed = false;
    });
    
    // Check visualization data
    const visualSections = jsonData?.sections?.filter((s: any) => s.visualization) || [];
    logTest('Visualization data', visualSections.length > 0, `${visualSections.length} sections have visualizations`);
    
    if (visualSections.length > 0) {
      console.log('\n📊 Visualizations found:');
      visualSections.slice(0, 3).forEach((section: any) => {
        console.log(`   - ${section.title}: ${section.visualization.type}`);
      });
    }
    
    // ========================================
    // Summary
    // ========================================
    logSection('Test Summary');
    
    if (allTestsPassed) {
      log('🎉 All tests passed! The JSON report system is working correctly.', colors.bright + colors.green);
      console.log('\n✨ The system is ready for use with:');
      console.log('   - Full JSON data storage (14 sections)');
      console.log('   - Vector embeddings for search');
      console.log('   - API endpoint for retrieval');
      console.log('   - Complete report context for AI chat');
    } else {
      log('⚠️  Some tests failed. Please review the issues above.', colors.bright + colors.yellow);
      console.log('\nSuggested fixes:');
      console.log('   1. Run: npx tsx scripts/fetch-and-store-full-json-report.ts');
      console.log('   2. Check if the dev server is running on port 3001');
      console.log('   3. Verify database connection and Prisma schema');
    }
    
    console.log(`\n🔗 View the report at: http://localhost:3001/reports/json/${subscriptionId}`);
    
  } catch (error) {
    log('\n❌ Test suite error:', colors.red);
    console.error(error);
    allTestsPassed = false;
  } finally {
    await prisma.$disconnect();
    process.exit(allTestsPassed ? 0 : 1);
  }
}

// Run the test suite
testJSONReportSystem();