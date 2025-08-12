#!/usr/bin/env npx tsx
/**
 * Add RIDO chunks with embeddings using raw SQL
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
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text
  });
  return response.data[0].embedding;
}

async function addRidoChunksWithSQL() {
  const subscriptionId = '21989';
  
  console.log('📊 Adding RIDO chunks with embeddings using SQL...\n');
  
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
  
  // Load the complete JSON to get RIDO data
  const jsonPath = join(process.cwd(), 'docs/tms-api-spec/examples/tmp-report-response-complete.json');
  const jsonResponse = JSON.parse(readFileSync(jsonPath, 'utf-8'));
  const completeJsonData = jsonResponse.data;
  
  // Find the Individual Summary section with RIDO visualization
  const individualSummary = completeJsonData.sections.find((s: any) => s.id === 'individual_summary');
  
  if (!individualSummary?.visualizations) {
    console.log('❌ Individual Summary visualizations not found');
    return;
  }
  
  // Find CreateTMPQRidoSummary visualization
  const ridoViz = individualSummary.visualizations.find((v: any) => 
    v.type === 'CreateTMPQRidoSummary'
  );
  
  if (!ridoViz) {
    console.log('❌ RIDO visualization not found');
    return;
  }
  
  console.log('✅ Found RIDO visualization data');
  
  // Delete existing RIDO chunks
  await prisma.$executeRaw`
    DELETE FROM "ReportChunk" 
    WHERE "reportId" = ${report.id} 
    AND "sectionId" IN ('rido-visualization', 'rido-scale-explanation', 'rido-scores-detail')
  `;
  
  // Get max chunk index
  const maxChunkResult = await prisma.$queryRaw<{max: number}[]>`
    SELECT COALESCE(MAX("chunkIndex"), 0) as max 
    FROM "ReportChunk" 
    WHERE "reportId" = ${report.id}
  `;
  
  let nextIndex = (maxChunkResult[0]?.max || 0) + 1;
  
  // Create RIDO content chunks
  const chunks = [
    {
      id: uuidv4(),
      sectionId: 'rido-visualization',
      sectionTitle: 'RIDO Ruler Spectrum Visualization',
      content: `RIDO RULER SPECTRUM VISUALIZATION
The RIDO scales show your Work Preference Measures on a ruler spectrum from -30 to +30.

WHAT RIDO STANDS FOR:
- R = Relationships (how you relate to others at work)
- I = Information (how you gather and use information)
- D = Decisions (how you make decisions)
- O = Organisation (how you organize yourself and others)

YOUR RAW SCORES:
- Extrovert: ${ridoViz.data.rawScores.extrovert} vs Introvert: ${ridoViz.data.rawScores.introvert}
- Practical: ${ridoViz.data.rawScores.practical} vs Creative: ${ridoViz.data.rawScores.creative}
- Analytical: ${ridoViz.data.rawScores.analytical} vs Beliefs: ${ridoViz.data.rawScores.beliefs}
- Structured: ${ridoViz.data.rawScores.structured} vs Flexible: ${ridoViz.data.rawScores.flexible}

YOUR NET SCORES:
- Relationships: Introvert (I) = ${ridoViz.data.netScores.I}
- Information: Creative (C) = ${ridoViz.data.netScores.C}
- Decisions: Beliefs (B) = ${ridoViz.data.netScores.B}
- Organisation: Structured (S) = ${ridoViz.data.netScores.S}

Your ICBS Profile: ${ridoViz.data.profile}`
    },
    {
      id: uuidv4(),
      sectionId: 'rido-scale-explanation',
      sectionTitle: 'Understanding the RIDO Scale',
      content: `HOW THE RIDO SCALE WORKS

THE -30 TO +30 SCALE:
- Each RIDO dimension is measured on a scale from -30 to +30
- The scale represents the spectrum between two opposing preferences
- Zero (0) represents perfect balance between the two preferences

READING YOUR POSITION:
- Negative scores (-30 to -1): Preference for the left side
  • Relationships: Extrovert (E)
  • Information: Practical (P)
  • Decisions: Analytical (A)
  • Organisation: Flexible (F)

- Positive scores (+1 to +30): Preference for the right side
  • Relationships: Introvert (I)
  • Information: Creative (C)
  • Decisions: Beliefs (B)
  • Organisation: Structured (S)

STRENGTH OF PREFERENCE:
- 0-5: Slight preference
- 6-15: Moderate preference
- 16-25: Strong preference
- 26-30: Very strong preference`
    },
    {
      id: uuidv4(),
      sectionId: 'rido-scores-detail',
      sectionTitle: 'Your RIDO Scores Explained',
      content: `YOUR RIDO PROFILE ANALYSIS

RELATIONSHIPS - Introvert (Net Score: ${ridoViz.data.netScores.I})
Raw Scores: Extrovert ${ridoViz.data.rawScores.extrovert} vs Introvert ${ridoViz.data.rawScores.introvert}
Net Calculation: ${ridoViz.data.rawScores.introvert} - ${ridoViz.data.rawScores.extrovert} = ${ridoViz.data.netScores.I}
This indicates a moderate preference for introverted work styles.

INFORMATION - Creative (Net Score: ${ridoViz.data.netScores.C})
Raw Scores: Practical ${ridoViz.data.rawScores.practical} vs Creative ${ridoViz.data.rawScores.creative}
Net Calculation: ${ridoViz.data.rawScores.creative} - ${ridoViz.data.rawScores.practical} = ${ridoViz.data.netScores.C}
This shows a slight preference for creative information gathering.

DECISIONS - Beliefs (Net Score: ${ridoViz.data.netScores.B})
Raw Scores: Analytical ${ridoViz.data.rawScores.analytical} vs Beliefs ${ridoViz.data.rawScores.beliefs}
Net Calculation: ${ridoViz.data.rawScores.beliefs} - ${ridoViz.data.rawScores.analytical} = ${ridoViz.data.netScores.B}
This indicates a moderate preference for values-based decision making.

ORGANISATION - Structured (Net Score: ${ridoViz.data.netScores.S})
Raw Scores: Structured ${ridoViz.data.rawScores.structured} vs Flexible ${ridoViz.data.rawScores.flexible}
Net Calculation: ${ridoViz.data.rawScores.structured} - ${ridoViz.data.rawScores.flexible} = ${ridoViz.data.netScores.S}
This shows a moderate preference for structured organization.`
    }
  ];
  
  console.log('\n🔄 Generating embeddings and storing chunks...');
  
  for (const chunk of chunks) {
    console.log(`\n  Processing: ${chunk.sectionTitle}`);
    
    // Generate embedding
    const embedding = await generateEmbedding(chunk.content);
    console.log(`    ✅ Generated embedding (${embedding.length} dimensions)`);
    
    // Store chunk with embedding using raw SQL
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
        ${nextIndex++},
        ${chunk.content.length},
        ${embedding}::vector,
        ${JSON.stringify({ type: 'rido', searchable: true, hasEmbedding: true })}::jsonb,
        NOW()
      )
    `;
    
    console.log(`    ✅ Stored chunk with embedding: ${chunk.id}`);
  }
  
  // Test search
  console.log('\n🔍 Testing vector search...');
  
  const testQueries = [
    'RIDO scales',
    'ruler spectrum -30 to +30',
    'net scores',
    'raw scores'
  ];
  
  for (const query of testQueries) {
    const queryEmbedding = await generateEmbedding(query);
    
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
    }
  }
  
  console.log('\n✅ RIDO chunks added with embeddings!');
  console.log('\nThe Debrief Agent should now be able to find:');
  console.log('- RIDO scales and ruler spectrum');
  console.log('- Your raw and net scores');
  console.log('- Explanations of the -30 to +30 scale');
  console.log('- How your scores are calculated');
  
  await prisma.$disconnect();
}

addRidoChunksWithSQL().catch(console.error);