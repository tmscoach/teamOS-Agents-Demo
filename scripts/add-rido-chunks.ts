#!/usr/bin/env npx tsx
/**
 * Add RIDO ruler spectrum chunks to existing report
 */

import prisma from '@/lib/db';
import { readFileSync } from 'fs';
import { join } from 'path';

async function addRidoChunks() {
  const subscriptionId = '21989';
  
  console.log('📊 Adding RIDO ruler spectrum chunks to report...\n');
  
  // Get existing report
  const report = await prisma.userReport.findFirst({
    where: { subscriptionId },
    orderBy: { createdAt: 'desc' }
  });
  
  if (!report) {
    console.log('❌ No report found');
    return;
  }
  
  // Load the complete JSON to get RIDO data
  const jsonPath = join(process.cwd(), 'docs/tms-api-spec/examples/tmp-report-response-complete.json');
  const jsonResponse = JSON.parse(readFileSync(jsonPath, 'utf-8'));
  const completeJsonData = jsonResponse.data; // Access the data property
  
  // Find the Individual Summary section with RIDO visualization
  const individualSummary = completeJsonData.sections.find((s: any) => s.id === 'individual_summary');
  
  if (!individualSummary) {
    console.log('❌ Individual Summary section not found');
    return;
  }
  
  // Find CreateTMPQRidoSummary visualization (contains the RIDO data)
  const ridoViz = individualSummary.visualizations?.find((v: any) => 
    v.type === 'CreateTMPQRidoSummary'
  );
  
  if (!ridoViz) {
    console.log('❌ RIDO visualization not found');
    return;
  }
  
  console.log('✅ Found RIDO visualization data');
  console.log('   Raw Scores:', ridoViz.data.rawScores);
  console.log('   Net Scores:', ridoViz.data.netScores);
  
  // Delete any existing RIDO chunks
  await prisma.reportChunk.deleteMany({
    where: {
      reportId: report.id,
      sectionId: { in: ['rido-visualization', 'rido-scale-explanation'] }
    }
  });
  
  // Get max chunk index
  const maxChunk = await prisma.reportChunk.findFirst({
    where: { reportId: report.id },
    orderBy: { chunkIndex: 'desc' }
  });
  
  const nextIndex = (maxChunk?.chunkIndex || 0) + 1;
  
  // Create comprehensive RIDO chunk
  const ridoContent = [
    'RIDO RULER SPECTRUM VISUALIZATION',
    'The RIDO visualization shows your Work Preference Measures on a scale from -30 to +30.',
    '',
    'RAW SCORES on the RIDO scale:',
    `- Extrovert: ${ridoViz.data.rawScores.extrovert} vs Introvert: ${ridoViz.data.rawScores.introvert}`,
    `- Practical: ${ridoViz.data.rawScores.practical} vs Creative: ${ridoViz.data.rawScores.creative}`,
    `- Analytical: ${ridoViz.data.rawScores.analytical} vs Beliefs: ${ridoViz.data.rawScores.beliefs}`,
    `- Structured: ${ridoViz.data.rawScores.structured} vs Flexible: ${ridoViz.data.rawScores.flexible}`,
    '',
    'NET SCORES (calculated as the difference between opposing preferences):',
    `- Relationships: Introvert (I) = ${ridoViz.data.netScores.I} (calculated as ${ridoViz.data.rawScores.introvert} - ${ridoViz.data.rawScores.extrovert})`,
    `- Information: Creative (C) = ${ridoViz.data.netScores.C} (calculated as ${ridoViz.data.rawScores.creative} - ${ridoViz.data.rawScores.practical})`,
    `- Decisions: Beliefs (B) = ${ridoViz.data.netScores.B} (calculated as ${ridoViz.data.rawScores.beliefs} - ${ridoViz.data.rawScores.analytical})`,
    `- Organisation: Structured (S) = ${ridoViz.data.netScores.S} (calculated as ${ridoViz.data.rawScores.structured} - ${ridoViz.data.rawScores.flexible})`,
    '',
    `Your profile is: ${ridoViz.data.profile}`
  ].join('\n');
  
  // Create RIDO visualization chunk
  const ridoChunk = await prisma.reportChunk.create({
    data: {
      reportId: report.id,
      sectionId: 'rido-visualization',
      sectionTitle: 'RIDO Ruler Spectrum',
      content: ridoContent,
      metadata: {
        type: 'rido',
        visualizationType: 'CreateTMPQRidoSummary',
        hasScores: true,
        searchable: true
      },
      chunkIndex: nextIndex,
      charCount: ridoContent.length
    }
  });
  
  console.log(`\n✅ Created RIDO chunk: ${ridoChunk.id}`);
  
  // Create scale explanation chunk
  const scaleContent = [
    'RIDO SCALE INTERPRETATION',
    'The RIDO ruler spectrum visualizes your work preferences on a continuous scale from -30 to +30.',
    '',
    'HOW TO READ THE SCALE:',
    '- The scale ranges from -30 on the left to +30 on the right for each dimension',
    '- Left side represents: Extrovert (E), Practical (P), Analytical (A), Flexible (F)',
    '- Right side represents: Introvert (I), Creative (C), Beliefs (B), Structured (S)',
    '- Your position on each ruler shows the strength and direction of your preference',
    '- A score of 0 would be perfectly balanced between the two preferences',
    '- Positive net scores indicate preference for the right side (I, C, B, S)',
    '- Negative net scores would indicate preference for the left side (E, P, A, F)',
    '',
    'Your strongest preference is Organisation (Structured) with a net score of 9.',
    'Your most balanced dimension is Information (Creative) with a net score of 3.'
  ].join('\n');
  
  const scaleChunk = await prisma.reportChunk.create({
    data: {
      reportId: report.id,
      sectionId: 'rido-scale-explanation',
      sectionTitle: 'Understanding the RIDO Scale',
      content: scaleContent,
      metadata: {
        type: 'explanation',
        relatedTo: 'rido',
        searchable: true
      },
      chunkIndex: nextIndex + 1,
      charCount: scaleContent.length
    }
  });
  
  console.log(`✅ Created scale explanation chunk: ${scaleChunk.id}`);
  
  // Test search
  console.log('\n🔍 Testing RIDO search...');
  
  const testSearches = [
    'RIDO',
    'ruler spectrum',
    'scale -30 to +30',
    'raw scores extrovert introvert'
  ];
  
  for (const search of testSearches) {
    const found = await prisma.reportChunk.findFirst({
      where: {
        reportId: report.id,
        content: { contains: search, mode: 'insensitive' }
      }
    });
    
    console.log(`  ${found ? '✅' : '❌'} Search for "${search}"`);
  }
  
  console.log('\n✅ RIDO chunks added successfully!');
  console.log('\nThe Debrief Agent can now answer questions about:');
  console.log('- What the RIDO visualization shows');
  console.log('- How scores map on the -30 to +30 scale');
  console.log('- The calculation of net scores from raw scores');
  console.log('- What the ruler spectrum represents');
  
  await prisma.$disconnect();
}

addRidoChunks().catch(console.error);