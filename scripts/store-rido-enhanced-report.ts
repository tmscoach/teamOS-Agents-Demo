#!/usr/bin/env npx tsx
/**
 * Enhanced storage of JSON report with RIDO ruler spectrum information
 * This ensures the Debrief Agent can find and explain the RIDO visualization
 */

import prisma from '@/lib/db';
import { readFileSync } from 'fs';
import { join } from 'path';

async function storeRidoEnhancedReport() {
  const subscriptionId = '21989';
  
  console.log('🔄 Storing enhanced report with RIDO ruler spectrum data...\n');
  
  // Load the complete JSON example
  const jsonPath = join(process.cwd(), 'docs/tms-api-spec/examples/tmp-report-response-complete.json');
  const completeJsonData = JSON.parse(readFileSync(jsonPath, 'utf-8'));
  
  // Delete existing report and chunks
  const existingReport = await prisma.userReport.findFirst({
    where: { subscriptionId },
    orderBy: { createdAt: 'desc' }
  });
  
  if (existingReport) {
    console.log('🗑️  Deleting existing report and chunks...');
    await prisma.reportChunk.deleteMany({
      where: { reportId: existingReport.id }
    });
    await prisma.userReport.delete({
      where: { id: existingReport.id }
    });
  }
  
  // Create new report with complete JSON
  console.log('✨ Creating new report with complete JSON data...');
  const report = await prisma.userReport.create({
    data: {
      subscriptionId,
      reportType: 'TMP',
      status: 'completed',
      assessmentId: 'TMP-2024-001',
      completedAt: new Date(),
      reportData: completeJsonData,
      metadata: {
        version: '1.0',
        hasRidoVisualization: true,
        hasNetScores: true,
        hasRawScores: true
      }
    }
  });
  
  console.log(`✅ Report created: ${report.id}`);
  
  // Create comprehensive chunks
  const chunks: any[] = [];
  
  // Find and process the Individual Summary section with RIDO data
  const individualSummary = completeJsonData.sections.find((s: any) => s.id === 'individual_summary');
  
  if (individualSummary) {
    console.log('\n📊 Processing Individual Summary with RIDO visualization...');
    
    // Find the CreateTMPQRidoSummary visualization
    const ridoViz = individualSummary.visualizations?.find((v: any) => 
      v.type === 'CreateTMPQRidoSummary'
    );
    
    if (ridoViz) {
      console.log('✅ Found RIDO visualization data');
      
      // Create a dedicated RIDO chunk with all the ruler spectrum information
      const ridoContent = [
        'RIDO RULER SPECTRUM VISUALIZATION',
        'This shows your Work Preference Measures on a scale from -30 to +30',
        '',
        'RAW SCORES on RIDO scale:',
        `- Extrovert: ${ridoViz.data.rawScores.extrovert} vs Introvert: ${ridoViz.data.rawScores.introvert}`,
        `- Practical: ${ridoViz.data.rawScores.practical} vs Creative: ${ridoViz.data.rawScores.creative}`,
        `- Analytical: ${ridoViz.data.rawScores.analytical} vs Beliefs: ${ridoViz.data.rawScores.beliefs}`,
        `- Structured: ${ridoViz.data.rawScores.structured} vs Flexible: ${ridoViz.data.rawScores.flexible}`,
        '',
        'NET SCORES (difference between opposing preferences):',
        `- Relationships: Introvert (I) = ${ridoViz.data.netScores.I} (Introvert ${ridoViz.data.rawScores.introvert} - Extrovert ${ridoViz.data.rawScores.extrovert})`,
        `- Information: Creative (C) = ${ridoViz.data.netScores.C} (Creative ${ridoViz.data.rawScores.creative} - Practical ${ridoViz.data.rawScores.practical})`,
        `- Decisions: Beliefs (B) = ${ridoViz.data.netScores.B} (Beliefs ${ridoViz.data.rawScores.beliefs} - Analytical ${ridoViz.data.rawScores.analytical})`,
        `- Organisation: Structured (S) = ${ridoViz.data.netScores.S} (Structured ${ridoViz.data.rawScores.structured} - Flexible ${ridoViz.data.rawScores.flexible})`,
        '',
        `Your ICBS Profile: ${ridoViz.data.profile}`,
        '',
        'RIDO SCALE INTERPRETATION:',
        '- The scale runs from -30 to +30 for each dimension',
        '- Negative values indicate preference for the left side (E, P, A, F)',
        '- Positive values indicate preference for the right side (I, C, B, S)',
        '- The magnitude shows the strength of your preference',
        '- Your net scores plot where you fall on each ruler spectrum'
      ].join('\n');
      
      chunks.push({
        sectionId: 'rido-visualization',
        sectionTitle: 'RIDO Ruler Spectrum',
        content: ridoContent,
        metadata: {
          type: 'rido',
          hasVisualization: true,
          visualizationType: 'CreateTMPQRidoSummary',
          searchable: true
        }
      });
      
      // Also create a simplified scores chunk
      chunks.push({
        sectionId: 'scores-summary',
        sectionTitle: 'Work Preference Scores Summary',
        content: [
          'WORK PREFERENCE MEASURES SCORES',
          `NET SCORES: I=${ridoViz.data.netScores.I}, C=${ridoViz.data.netScores.C}, B=${ridoViz.data.netScores.B}, S=${ridoViz.data.netScores.S}`,
          `RAW SCORES: Introvert=${ridoViz.data.rawScores.introvert}, Extrovert=${ridoViz.data.rawScores.extrovert}, `,
          `Creative=${ridoViz.data.rawScores.creative}, Practical=${ridoViz.data.rawScores.practical}, `,
          `Beliefs=${ridoViz.data.rawScores.beliefs}, Analytical=${ridoViz.data.rawScores.analytical}, `,
          `Structured=${ridoViz.data.rawScores.structured}, Flexible=${ridoViz.data.rawScores.flexible}`,
          `PROFILE: ${ridoViz.data.profile}`
        ].join(' '),
        metadata: {
          type: 'scores',
          searchable: true
        }
      });
    }
  }
  
  // Process all other sections
  for (let index = 0; index < completeJsonData.sections.length; index++) {
    const section = completeJsonData.sections[index];
    const contentParts = [];
    
    // Add title and content
    if (section.title) contentParts.push(section.title);
    if (section.vectorChunk) contentParts.push(section.vectorChunk);
    
    // Add text content
    if (section.content) {
      if (section.content.text) contentParts.push(section.content.text);
      if (section.content.paragraphs) {
        contentParts.push(...section.content.paragraphs);
      }
    }
    
    // Process visualizations
    if (section.visualizations) {
      for (const viz of section.visualizations) {
        // Add any ruler/scale visualizations
        if (viz.type === 'Ruler' || viz.type === 'Scale') {
          const leftLabel = viz.params?.ll || 'Left';
          const rightLabel = viz.params?.rl || 'Right';
          const leftValue = viz.params?.lv;
          const rightValue = viz.params?.rv;
          
          if (leftValue && rightValue) {
            contentParts.push(`${viz.dimension || 'Scale'}: ${leftLabel}=${leftValue}, ${rightLabel}=${rightValue}`);
          }
        }
      }
    }
    
    if (contentParts.length > 0) {
      chunks.push({
        sectionId: section.id || `section-${index}`,
        sectionTitle: section.title || `Section ${index + 1}`,
        content: contentParts.join('. '),
        metadata: {
          type: section.type || 'content',
          order: index
        }
      });
    }
  }
  
  console.log(`\n📝 Storing ${chunks.length} enhanced chunks...`);
  
  // Store all chunks
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    
    await prisma.reportChunk.create({
      data: {
        reportId: report.id,
        sectionId: chunk.sectionId,
        sectionTitle: chunk.sectionTitle,
        content: chunk.content,
        metadata: chunk.metadata,
        chunkIndex: i,
        charCount: chunk.content.length
      }
    });
    
    if (chunk.sectionId === 'rido-visualization' || chunk.sectionId === 'scores-summary') {
      console.log(`  ✅ Stored: ${chunk.sectionTitle} (${chunk.content.length} chars)`);
    }
  }
  
  // Test that RIDO can be found
  console.log('\n🔍 Testing RIDO search...');
  
  const ridoChunks = await prisma.reportChunk.findMany({
    where: {
      reportId: report.id,
      OR: [
        { content: { contains: 'RIDO', mode: 'insensitive' } },
        { content: { contains: 'ruler spectrum', mode: 'insensitive' } },
        { content: { contains: 'scale from -30 to +30', mode: 'insensitive' } }
      ]
    }
  });
  
  console.log(`Found ${ridoChunks.length} chunks with RIDO information`);
  
  if (ridoChunks.length > 0) {
    console.log('\n📊 RIDO chunk preview:');
    const ridoChunk = ridoChunks[0];
    console.log(`  Title: ${ridoChunk.sectionTitle}`);
    console.log(`  Content: "${ridoChunk.content.substring(0, 200)}..."`);
  }
  
  console.log('\n✅ Enhanced report with RIDO data stored successfully!');
  console.log('\nThe Debrief Agent should now be able to answer questions about:');
  console.log('- RIDO ruler spectrum visualization');
  console.log('- How scores map on the -30 to +30 scale');
  console.log('- Raw scores for each dimension');
  console.log('- Net score calculations');
  console.log('- ICBS profile interpretation');
  
  await prisma.$disconnect();
}

storeRidoEnhancedReport().catch(console.error);