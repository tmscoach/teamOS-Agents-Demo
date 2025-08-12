#!/usr/bin/env npx tsx
/**
 * Store the COMPLETE JSON report with all scores from the example file
 */

import prisma from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';
import { ReportStorageService } from '@/src/lib/services/report-storage/report-storage.service';

async function storeCompleteJsonReport() {
  const subscriptionId = '21989';
  
  console.log('📁 Loading complete JSON report from example file...\n');
  
  // Load the complete example JSON
  const examplePath = path.join(
    process.cwd(),
    'docs/tms-api-spec/examples/tmp-report-response-complete.json'
  );
  
  const exampleContent = await fs.readFile(examplePath, 'utf-8');
  const exampleJson = JSON.parse(exampleContent);
  
  // Use the data from the example (which has the complete structure)
  const completeJsonData = exampleJson.data;
  
  // Update subscription ID to match
  completeJsonData.subscriptionId = subscriptionId;
  
  console.log('✅ Loaded complete JSON with:');
  console.log('  - Sections:', completeJsonData.sections.length);
  
  // Check that we have the scores
  const workPrefSection = completeJsonData.sections[2]; // Work Preference Measures
  if (workPrefSection?.visualizations?.[0]?.data?.profile) {
    const profile = workPrefSection.visualizations[0].data.profile;
    console.log('\n✅ Verified scores in loaded data:');
    if (profile.rawScores) {
      console.log('  - Raw Scores:', Object.keys(profile.rawScores).join(', '));
    }
    if (profile.netScores) {
      console.log('  - Net Scores:', Object.keys(profile.netScores).join(', '));
    }
  }
  
  // Find or create the report
  console.log('\n📊 Updating database report...');
  
  let report = await prisma.userReport.findFirst({
    where: { subscriptionId },
    orderBy: { createdAt: 'desc' }
  });
  
  if (!report) {
    console.log('❌ No report found, creating new one...');
    
    // Find user
    const user = await prisma.user.findFirst({
      where: { email: 'rowan@teammanagementsystems.com' }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    report = await prisma.userReport.create({
      data: {
        userId: user.id,
        organizationId: user.organizationId,
        subscriptionId,
        reportType: 'TMP',
        templateId: null,
        jsonData: completeJsonData,
        metadata: completeJsonData.metadata || {},
        processingStatus: 'PENDING',
        rawHtml: ''
      }
    });
    console.log('✅ Created new report:', report.id);
  } else {
    console.log('✅ Found existing report:', report.id);
    
    // Update with complete JSON data
    await prisma.userReport.update({
      where: { id: report.id },
      data: {
        jsonData: completeJsonData,
        metadata: completeJsonData.metadata || {},
        processingStatus: 'PENDING'
      }
    });
    console.log('✅ Updated report with complete JSON data');
  }
  
  // Clear existing chunks
  console.log('\n🗑️  Clearing existing chunks...');
  await prisma.reportChunk.deleteMany({
    where: { reportId: report.id }
  });
  
  // Process with comprehensive chunking
  console.log('\n🔄 Creating comprehensive vector chunks...');
  
  const chunks: any[] = [];
  
  // Add a comprehensive metadata chunk with ALL scores
  const metadataContent = [];
  
  // Extract scores from Individual Summary section (last section)
  const individualSummary = completeJsonData.sections.find((s: any) => s.id === 'individual_summary');
  console.log('\n🔍 Looking for scores in Individual Summary...');
  console.log('  Has Individual Summary:', !!individualSummary);
  console.log('  Has visualizations:', !!individualSummary?.visualizations);
  console.log('  Visualization count:', individualSummary?.visualizations?.length);
  
  if (individualSummary?.visualizations?.[1]) {
    const viz1 = individualSummary.visualizations[1];
    console.log('  Visualization[1] type:', viz1.type);
    console.log('  Has data:', !!viz1.data);
    console.log('  Data keys:', viz1.data ? Object.keys(viz1.data).join(', ') : 'none');
    
    // The scores are directly in data, not in data.profile
    if (viz1.data?.netScores) {
      console.log('  ✅ Found netScores directly in data!');
      metadataContent.push(`NET SCORES: Introvert(I)=${viz1.data.netScores.I}, Creative(C)=${viz1.data.netScores.C}, Beliefs(B)=${viz1.data.netScores.B}, Structured(S)=${viz1.data.netScores.S}`);
    }
    
    if (viz1.data?.rawScores) {
      console.log('  ✅ Found rawScores directly in data!');
      const raw = viz1.data.rawScores;
      metadataContent.push(`RAW SCORES: Introvert=${raw.introvert}, Extrovert=${raw.extrovert}, Creative=${raw.creative}, Analytical=${raw.analytical}, Beliefs=${raw.beliefs}, Structured=${raw.structured}, Flexible=${raw.flexible}`);
    }
  } else if (individualSummary?.visualizations?.[1]?.data?.profile) {
    const profile = individualSummary.visualizations[1].data.profile;
    
    if (profile.netScores) {
      metadataContent.push(`NET SCORES: Introvert(I)=${profile.netScores.I}, Creative(C)=${profile.netScores.C}, Beliefs(B)=${profile.netScores.B}, Structured(S)=${profile.netScores.S}`);
    }
    
    if (profile.rawScores) {
      const raw = profile.rawScores;
      metadataContent.push(`RAW SCORES: Introvert=${raw.introvert}, Extrovert=${raw.extrovert}, Creative=${raw.creative}, Analytical=${raw.analytical}, Beliefs=${raw.beliefs}, Structured=${raw.structured}, Flexible=${raw.flexible}`);
    }
  }
  
  // Add metadata from report
  const meta = completeJsonData.metadata;
  if (meta) {
    metadataContent.push(`User: ${meta.userName}, Organization: ${meta.organizationName}`);
  }
  
  // Create the scores chunk
  if (metadataContent.length > 0) {
    chunks.push({
      sectionId: 'scores-metadata',
      sectionTitle: 'Scores and Metadata',
      content: metadataContent.join('. '),
      metadata: { type: 'scores', searchable: true }
    });
  }
  
  // Process each section comprehensively
  for (let index = 0; index < completeJsonData.sections.length; index++) {
    const section = completeJsonData.sections[index];
    const contentParts = [];
    
    // Add title
    if (section.title) {
      contentParts.push(section.title);
    }
    
    // Add vectorChunk
    if (section.vectorChunk) {
      contentParts.push(section.vectorChunk);
    }
    
    // Add text content
    if (section.content) {
      if (section.content.text) contentParts.push(section.content.text);
      if (section.content.paragraphs) {
        contentParts.push(...section.content.paragraphs);
      }
      if (section.content.points) {
        contentParts.push(...section.content.points.map((p: any) => 
          typeof p === 'string' ? p : p.text
        ));
      }
    }
    
    // Extract ALL visualization data for Individual Summary (contains scores)
    if (section.id === 'individual_summary' && section.visualizations) {
      console.log(`  Processing Individual Summary with ${section.visualizations.length} visualizations`);
      
      // The CreateTMPQRidoSummary visualization contains the scores (index 1)
      const summaryViz = section.visualizations[1];
      if (summaryViz?.data) {
        // Scores are directly in data, not in data.profile
        if (summaryViz.data.netScores) {
          contentParts.push(`NET SCORES (ICBS): I=${summaryViz.data.netScores.I} (Introvert), C=${summaryViz.data.netScores.C} (Creative), B=${summaryViz.data.netScores.B} (Beliefs), S=${summaryViz.data.netScores.S} (Structured)`);
        }
        
        if (summaryViz.data.rawScores) {
          const raw = summaryViz.data.rawScores;
          contentParts.push(`RAW SCORES: Introvert=${raw.introvert}, Extrovert=${raw.extrovert}, Creative=${raw.creative}, Analytical=${raw.analytical}, Beliefs=${raw.beliefs}, Structured=${raw.structured}, Flexible=${raw.flexible}`);
        }
      }
      
      // Add RIDO scores from other visualizations
      for (const viz of section.visualizations) {
        if (viz.dimension && viz.params) {
          const leftLabel = viz.params.ll || 'Left';
          const rightLabel = viz.params.rl || 'Right';
          const leftValue = viz.params.lv || viz.data?.leftScore;
          const rightValue = viz.params.rv || viz.data?.rightScore;
          
          if (leftValue && rightValue) {
            contentParts.push(`${viz.dimension}: ${leftLabel}=${leftValue}, ${rightLabel}=${rightValue}`);
          }
          
          if (viz.data?.netDirection) {
            contentParts.push(`${viz.dimension} Net: ${viz.data.netDirection} (${viz.data.netScore})`);
          }
        }
      }
    }
    
    // Create chunk
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
  
  console.log(`\n📝 Storing ${chunks.length} comprehensive chunks...`);
  
  // Store chunks
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
    
    console.log(`  ${i + 1}. ${chunk.sectionTitle} (${chunk.content.length} chars)`);
  }
  
  // Update report status
  await prisma.userReport.update({
    where: { id: report.id },
    data: { 
      processingStatus: 'COMPLETED',
      jsonData: completeJsonData 
    }
  });
  
  console.log('\n✅ Complete JSON report stored with all scores!');
  
  // Test search
  console.log('\n🔍 Testing searches...');
  
  const testSearches = ['net scores', 'raw scores', 'NET SCORES', 'RAW SCORES'];
  for (const query of testSearches) {
    const results = await prisma.reportChunk.findMany({
      where: {
        reportId: report.id,
        content: {
          contains: query,
          mode: 'insensitive'
        }
      }
    });
    console.log(`  "${query}": ${results.length} chunks found`);
  }
  
  console.log('\n🎯 View the report at: http://localhost:3000/reports/json/21989');
  
  await prisma.$disconnect();
}

storeCompleteJsonReport().catch(console.error);