#!/usr/bin/env npx tsx
/**
 * Fix report chunking to include ALL data including nested scores
 */

import prisma from '@/lib/db';
import { EmbeddingService } from '@/src/lib/knowledge-base/ingestion/embeddings';

async function fixReportChunking() {
  const subscriptionId = '21989';
  
  console.log(`\n🔧 Fixing report chunking for subscription ${subscriptionId}...\n`);
  
  // Get the most recent report for this subscription
  const report = await prisma.userReport.findFirst({
    where: { subscriptionId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      subscriptionId: true,
      jsonData: true,
      metadata: true,
      createdAt: true
    }
  });
  
  if (!report) {
    console.log('❌ Report not found');
    return;
  }
  
  console.log(`✅ Found report: ${report.id}`);
  
  const jsonData = report.jsonData as any;
  const sections = jsonData.sections || [];
  
  // Clear existing chunks
  console.log('\n🗑️  Clearing existing chunks...');
  await prisma.reportChunk.deleteMany({
    where: { reportId: report.id }
  });
  
  // Initialize embedding service
  const embeddingService = new EmbeddingService();
  
  // Create comprehensive chunks that include ALL data
  const chunks: any[] = [];
  
  // Add a metadata chunk with all scores and profile info
  const metadataContent = [];
  
  // Extract scores from Work Preference Measures section
  const workPrefSection = sections.find((s: any) => 
    s.id === 'workpreferencemeasures' || s.title?.includes('Work Preference')
  );
  
  if (workPrefSection?.visualizations) {
    for (const viz of workPrefSection.visualizations) {
      if (viz.data?.profile) {
        if (viz.data.profile.netScores) {
          metadataContent.push(`Net Scores (ICBS): I=${viz.data.profile.netScores.I}, C=${viz.data.profile.netScores.C}, B=${viz.data.profile.netScores.B}, S=${viz.data.profile.netScores.S}`);
        }
        if (viz.data.profile.rawScores) {
          const raw = viz.data.profile.rawScores;
          metadataContent.push(`Raw Scores: Introvert=${raw.introvert}, Extrovert=${raw.extrovert}, Creative=${raw.creative}, Analytical=${raw.analytical}, Beliefs=${raw.beliefs}, Structured=${raw.structured}, Flexible=${raw.flexible}`);
        }
      }
    }
  }
  
  // Add metadata from report root
  if (jsonData.metadata) {
    const meta = jsonData.metadata;
    if (meta.userName) metadataContent.push(`User: ${meta.userName}`);
    if (meta.organizationName) metadataContent.push(`Organization: ${meta.organizationName}`);
    if (meta.scores) {
      metadataContent.push(`ICBS Scores: I=${meta.scores.I || 0}, C=${meta.scores.C || 0}, B=${meta.scores.B || 0}, S=${meta.scores.S || 0}`);
    }
  }
  
  // Create metadata chunk if we have content
  if (metadataContent.length > 0) {
    chunks.push({
      sectionId: 'metadata',
      sectionTitle: 'Report Metadata and Scores',
      content: metadataContent.join('. '),
      metadata: { type: 'metadata', includesScores: true }
    });
  }
  
  // Process each section with comprehensive data extraction
  for (let index = 0; index < sections.length; index++) {
    const section = sections[index];
    const contentParts = [];
    
    // Add title
    if (section.title) {
      contentParts.push(section.title);
    }
    
    // Add text content
    if (section.content?.text) {
      contentParts.push(section.content.text);
    }
    if (section.content?.paragraphs) {
      contentParts.push(...section.content.paragraphs);
    }
    if (section.content?.points) {
      contentParts.push(...section.content.points.map((p: any) => 
        typeof p === 'string' ? p : p.text
      ));
    }
    
    // Add vectorChunk if present
    if (section.vectorChunk) {
      contentParts.push(section.vectorChunk);
    }
    
    // Extract ALL visualization data
    if (section.visualizations && Array.isArray(section.visualizations)) {
      for (const viz of section.visualizations) {
        // Add dimension info
        if (viz.dimension) {
          contentParts.push(`${viz.dimension}: ${viz.description || ''}`);
        }
        
        // Add ALL data from visualization
        if (viz.data) {
          // Handle profile data with scores
          if (viz.data.profile) {
            const profile = viz.data.profile;
            const profileParts = [];
            
            if (profile.netScores) {
              profileParts.push(`Net Scores: Introvert(I)=${profile.netScores.I}, Creative(C)=${profile.netScores.C}, Beliefs(B)=${profile.netScores.B}, Structured(S)=${profile.netScores.S}`);
            }
            
            if (profile.rawScores) {
              const raw = profile.rawScores;
              profileParts.push(`Raw Scores: Introvert=${raw.introvert}, Extrovert=${raw.extrovert}, Creative=${raw.creative}, Analytical=${raw.analytical}, Beliefs=${raw.beliefs}, Structured=${raw.structured}, Flexible=${raw.flexible}`);
            }
            
            if (profileParts.length > 0) {
              contentParts.push(...profileParts);
            }
          }
          
          // Handle left/right scores (for RIDO visualizations)
          if (viz.data.leftScore !== undefined && viz.data.rightScore !== undefined) {
            contentParts.push(`${viz.params?.ll || 'Left'}: ${viz.data.leftScore}, ${viz.params?.rl || 'Right'}: ${viz.data.rightScore}`);
          }
          
          // Handle net direction
          if (viz.data.netDirection) {
            contentParts.push(`Net Direction: ${viz.data.netDirection} (${viz.data.netScore || 0})`);
          }
          
          // Handle interpretation
          if (viz.data.interpretation) {
            contentParts.push(viz.data.interpretation);
          }
        }
        
        // Add parameters if they contain useful info
        if (viz.params) {
          const paramInfo = [];
          if (viz.params.lv && viz.params.rv) {
            paramInfo.push(`Values: Left=${viz.params.lv}, Right=${viz.params.rv}`);
          }
          if (paramInfo.length > 0) {
            contentParts.push(...paramInfo);
          }
        }
      }
    }
    
    // Add single visualization data
    if (section.visualization) {
      const viz = section.visualization;
      if (viz.data) {
        if (viz.data.majorRole) {
          contentParts.push(`Major Role: ${viz.data.majorRole.name} (${viz.data.majorRole.percentage}%)`);
        }
        if (viz.data.relatedRoles) {
          const roles = viz.data.relatedRoles.map((r: any) => `${r.name} (${r.percentage}%)`).join(', ');
          contentParts.push(`Related Roles: ${roles}`);
        }
      }
    }
    
    // Create chunk if we have content
    if (contentParts.length > 0) {
      chunks.push({
        sectionId: section.id || `section-${index}`,
        sectionTitle: section.title || `Section ${index + 1}`,
        content: contentParts.join('. '),
        metadata: { 
          type: section.type || 'content',
          order: section.order || index,
          hasVisualization: !!(section.visualization || section.visualizations)
        }
      });
    }
  }
  
  console.log(`\n📝 Creating ${chunks.length} comprehensive chunks...`);
  
  // Store chunks with embeddings
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    
    console.log(`  ${i + 1}. ${chunk.sectionTitle} (${chunk.content.length} chars)`);
    
    // Generate embedding if API key is available
    let embedding = null;
    if (process.env.OPENAI_API_KEY) {
      try {
        const embeddingResult = await embeddingService.generateEmbedding(chunk.content);
        embedding = embeddingResult.embedding;
      } catch (error) {
        console.log(`    ⚠️  Could not generate embedding: ${error}`);
      }
    }
    
    // Store chunk
    await prisma.reportChunk.create({
      data: {
        reportId: report.id,
        sectionId: chunk.sectionId,
        sectionTitle: chunk.sectionTitle,
        content: chunk.content,
        metadata: chunk.metadata,
        chunkIndex: i,
        charCount: chunk.content.length,
        embedding: embedding || undefined
      }
    });
  }
  
  // Update report status
  await prisma.userReport.update({
    where: { id: report.id },
    data: { processingStatus: 'COMPLETED' }
  });
  
  console.log('\n✅ Report chunking fixed!');
  
  // Test search for net scores
  console.log('\n🔍 Testing search for "net scores"...');
  const testChunks = await prisma.reportChunk.findMany({
    where: {
      reportId: report.id,
      content: {
        contains: 'Net Scores',
        mode: 'insensitive'
      }
    }
  });
  
  console.log(`Found ${testChunks.length} chunks containing "Net Scores"`);
  if (testChunks.length > 0) {
    console.log('\nSample content:');
    console.log(testChunks[0].content.substring(0, 300) + '...');
  }
  
  await prisma.$disconnect();
}

fixReportChunking().catch(console.error);