#!/usr/bin/env npx tsx
/**
 * Chunk and embed the ENTIRE report (all 14 sections) so the Debrief Agent can find everything
 */

import prisma from '@/lib/db';
import { readFileSync } from 'fs';
import { join } from 'path';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return [];
  }
}

async function chunkEntireReport() {
  const subscriptionId = '21989';
  
  console.log('📊 Chunking and embedding ENTIRE report...\n');
  
  // Get the report
  const report = await prisma.userReport.findFirst({
    where: { subscriptionId },
    orderBy: { createdAt: 'desc' }
  });
  
  if (!report) {
    console.log('❌ No report found');
    return;
  }
  
  console.log(`✅ Found report: ${report.id}`);
  
  // Delete ALL existing chunks to start fresh
  const deletedCount = await prisma.reportChunk.deleteMany({
    where: { reportId: report.id }
  });
  
  console.log(`🗑️  Deleted ${deletedCount.count} existing chunks`);
  
  // Load the complete JSON
  const jsonPath = join(process.cwd(), 'docs/tms-api-spec/examples/tmp-report-response-complete.json');
  const jsonResponse = JSON.parse(readFileSync(jsonPath, 'utf-8'));
  const reportData = jsonResponse.data;
  
  console.log(`\n📋 Processing ${reportData.sections.length} sections...\n`);
  
  let chunkIndex = 0;
  const chunks: any[] = [];
  
  // Process each section
  for (const section of reportData.sections) {
    console.log(`Processing section: ${section.title || section.id}`);
    
    // Build content from section
    let content = '';
    
    // Add title
    if (section.title) {
      content += `${section.title.toUpperCase()}\n\n`;
    }
    
    // Add text content
    if (section.content) {
      // Handle paragraphs
      if (section.content.paragraphs) {
        content += section.content.paragraphs.join('\n\n') + '\n\n';
      }
      
      // Handle introduction field
      if (section.content.introduction) {
        content += section.content.introduction + '\n\n';
      }
      
      // Handle points (like in Areas for Self-Assessment)
      if (section.content.points) {
        for (const point of section.content.points) {
          if (typeof point === 'string') {
            content += `• ${point}\n`;
          } else if (point.text) {
            content += `• ${point.text}\n\n`;
          } else if (point.title && point.content) {
            content += `\n${point.title}\n${point.content}\n`;
          }
        }
        content += '\n';
      }
      
      // Handle conclusion field
      if (section.content.conclusion) {
        content += section.content.conclusion + '\n\n';
      }
      
      // Handle main text
      if (section.content.mainText) {
        content += section.content.mainText + '\n\n';
      }
      
      // Handle text field
      if (section.content.text) {
        content += section.content.text + '\n\n';
      }
      
      // Handle subsections
      if (section.content.subsections) {
        for (const subsection of section.content.subsections) {
          if (subsection.title) {
            content += `${subsection.title}\n`;
          }
          if (subsection.content) {
            content += `${subsection.content}\n\n`;
          }
          // Handle points within subsections
          if (subsection.points) {
            for (const point of subsection.points) {
              content += `• ${point}\n`;
            }
            content += '\n';
          }
        }
      }
      
      // Handle userData
      if (section.content.userData) {
        content += `User: ${section.content.userData.name}\n`;
        content += `Organization: ${section.content.userData.organization}\n`;
        if (section.content.userData.keyPreferenceAreas) {
          content += `Key Preference Areas: ${section.content.userData.keyPreferenceAreas}\n\n`;
        }
      }
      
      // Handle activities (for Introduction section)
      if (section.content.nineActivities) {
        content += `${section.content.nineActivities.introduction}\n\n`;
        for (const activity of section.content.nineActivities.activities) {
          content += `- ${activity.name}: ${activity.description}\n`;
        }
        content += '\n';
      }
      
      // Handle sections array (like in Team-Building)
      if (section.content.sections) {
        for (const subSection of section.content.sections) {
          if (subSection.title) {
            content += `\n${subSection.title}\n`;
          }
          if (subSection.content) {
            content += `${subSection.content}\n`;
          }
          if (subSection.points) {
            for (const point of subSection.points) {
              content += `• ${point}\n`;
            }
          }
        }
        content += '\n';
      }
      
      // Handle explanation fields
      if (section.content.explanation) {
        content += section.content.explanation + '\n\n';
      }
      if (section.content.interpretationGuide) {
        content += section.content.interpretationGuide + '\n\n';
      }
      if (section.content.profileExplanation) {
        content += section.content.profileExplanation + '\n\n';
      }
      
      // Handle items array (for lists)
      if (section.content.items) {
        for (const item of section.content.items) {
          if (typeof item === 'string') {
            content += `• ${item}\n`;
          } else if (item.title && item.description) {
            content += `\n${item.title}:\n${item.description}\n`;
          }
        }
        content += '\n';
      }
    }
    
    // Add vectorChunk if available (pre-summarized content)
    if (section.vectorChunk) {
      content += '\nSummary: ' + section.vectorChunk + '\n';
    }
    
    // Handle visualizations
    if (section.visualizations) {
      for (const viz of section.visualizations) {
        if (viz.data) {
          // Handle RIDO scores
          if (viz.data.rawScores) {
            content += '\nRAW SCORES:\n';
            for (const [key, value] of Object.entries(viz.data.rawScores)) {
              content += `- ${key}: ${value}\n`;
            }
          }
          if (viz.data.netScores) {
            content += '\nNET SCORES:\n';
            for (const [key, value] of Object.entries(viz.data.netScores)) {
              content += `- ${key}: ${value}\n`;
            }
          }
          if (viz.data.profile) {
            content += `\nProfile: ${viz.data.profile}\n`;
          }
          
          // Handle major role
          if (viz.data.majorRole) {
            content += `\nMajor Role: ${viz.data.majorRole.name} (${viz.data.majorRole.code})\n`;
            content += `Score: ${viz.data.majorRole.score}, Percentage: ${viz.data.majorRole.percentage}%\n`;
          }
          
          // Handle related roles
          if (viz.data.relatedRoles) {
            content += '\nRelated Roles:\n';
            for (const role of viz.data.relatedRoles) {
              content += `- ${role.name} (${role.code}): Score ${role.score}, ${role.percentage}%\n`;
            }
          }
          
          // Handle interpretations
          if (viz.data.interpretation) {
            content += `Interpretation: ${viz.data.interpretation}\n`;
          }
        }
        
        // Handle dimension info
        if (viz.dimension) {
          content += `\n${viz.dimension}: ${viz.description || ''}\n`;
        }
      }
    }
    
    // Skip empty chunks
    if (!content.trim()) {
      console.log(`  ⚠️  Skipping empty section: ${section.title || section.id}`);
      continue;
    }
    
    chunks.push({
      id: uuidv4(),
      sectionId: section.id || `section-${chunkIndex}`,
      sectionTitle: section.title || `Section ${chunkIndex + 1}`,
      content: content.trim(),
      chunkIndex: chunkIndex++
    });
  }
  
  console.log(`\n📦 Created ${chunks.length} chunks to process\n`);
  
  // Store chunks with embeddings
  console.log('🔄 Generating embeddings and storing chunks...\n');
  
  for (const chunk of chunks) {
    console.log(`  Processing: ${chunk.sectionTitle}`);
    
    // Generate embedding
    const embedding = await generateEmbedding(chunk.content);
    
    if (embedding.length === 0) {
      console.log(`    ❌ Failed to generate embedding, storing without`);
      
      // Store without embedding
      await prisma.reportChunk.create({
        data: {
          id: chunk.id,
          reportId: report.id,
          sectionId: chunk.sectionId,
          sectionTitle: chunk.sectionTitle,
          content: chunk.content,
          chunkIndex: chunk.chunkIndex,
          charCount: chunk.content.length,
          metadata: {
            type: 'report-section',
            hasEmbedding: false
          }
        }
      });
    } else {
      console.log(`    ✅ Generated embedding (${embedding.length} dimensions)`);
      
      // Store with embedding using raw SQL
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
          ${report.id},
          ${chunk.sectionId},
          ${chunk.sectionTitle},
          ${chunk.content},
          ${chunk.chunkIndex},
          ${chunk.content.length},
          ${embedding}::vector,
          ${JSON.stringify({ type: 'report-section', hasEmbedding: true })}::jsonb,
          NOW()
        )
      `;
    }
    
    console.log(`    ✅ Stored: ${chunk.sectionTitle}`);
  }
  
  // Test searches for common queries
  console.log('\n🔍 Testing searches...\n');
  
  const testQueries = [
    'areas for self-assessment',
    'team building',
    'key points of note',
    'leadership strengths',
    'decision making',
    'interpersonal skills',
    'RIDO scales',
    'work preferences',
    'major role',
    'net scores'
  ];
  
  for (const query of testQueries) {
    const queryEmbedding = await generateEmbedding(query);
    
    if (queryEmbedding.length > 0) {
      const results = await prisma.$queryRaw`
        SELECT 
          "sectionTitle",
          1 - (embedding <=> ${queryEmbedding}::vector) as similarity
        FROM "ReportChunk"
        WHERE "reportId" = ${report.id}
        AND embedding IS NOT NULL
        ORDER BY embedding <=> ${queryEmbedding}::vector
        LIMIT 1
      `;
      
      const topResult = (results as any[])[0];
      if (topResult) {
        console.log(`  ✅ "${query}" → ${topResult.sectionTitle} (${topResult.similarity.toFixed(3)})`);
      } else {
        console.log(`  ❌ "${query}" → No results`);
      }
    }
  }
  
  // Final summary
  const finalCount = await prisma.reportChunk.count({
    where: { reportId: report.id }
  });
  
  const withEmbeddings = await prisma.$queryRaw`
    SELECT COUNT(*) as count
    FROM "ReportChunk"
    WHERE "reportId" = ${report.id}
    AND embedding IS NOT NULL
  `;
  
  console.log('\n✅ REPORT CHUNKING COMPLETE!');
  console.log('═'.repeat(60));
  console.log(`Total chunks: ${finalCount}`);
  console.log(`Chunks with embeddings: ${(withEmbeddings as any[])[0].count}`);
  console.log('\nThe Debrief Agent can now search and find:');
  console.log('- Areas for Self-Assessment');
  console.log('- Team-Building preferences');
  console.log('- Key Points of Note');
  console.log('- Leadership Strengths');
  console.log('- Decision-Making approach');
  console.log('- Interpersonal Skills');
  console.log('- Work Preferences');
  console.log('- RIDO scores and explanations');
  console.log('- And all other report content!');
  
  await prisma.$disconnect();
}

chunkEntireReport().catch(console.error);