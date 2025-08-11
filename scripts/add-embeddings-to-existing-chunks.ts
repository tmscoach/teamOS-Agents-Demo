/**
 * Utility script to add embeddings to existing report chunks
 * Run with: npx tsx scripts/add-embeddings-to-existing-chunks.ts
 */

import { PrismaClient } from '@/lib/generated/prisma';
import { EmbeddingService } from '@/src/lib/knowledge-base/ingestion/embeddings';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function addEmbeddingsToExistingChunks() {
  const prisma = new PrismaClient();
  const embeddingService = new EmbeddingService();
  
  try {
    console.log('🔍 Finding chunks without embeddings...\n');
    
    // Find chunks without embeddings
    const chunksWithoutEmbeddings = await prisma.$queryRaw<any[]>`
      SELECT id, "sectionTitle", content
      FROM "ReportChunk"
      WHERE embedding IS NULL
      ORDER BY "createdAt" DESC
      LIMIT 20
    `;
    
    if (chunksWithoutEmbeddings.length === 0) {
      console.log('✅ All chunks already have embeddings!');
      return;
    }
    
    console.log(`Found ${chunksWithoutEmbeddings.length} chunks without embeddings\n`);
    
    if (!process.env.OPENAI_API_KEY) {
      console.log('⚠️  No OpenAI API key found. Cannot generate embeddings.');
      return;
    }
    
    // Process each chunk
    let successCount = 0;
    let errorCount = 0;
    
    for (const chunk of chunksWithoutEmbeddings) {
      try {
        console.log(`Processing: ${chunk.sectionTitle}...`);
        
        // Generate embedding
        const embedding = await embeddingService.generateEmbedding(chunk.content);
        
        if (embedding && embedding.length > 0) {
          // Store embedding
          const vectorString = `[${embedding.join(',')}]`;
          await prisma.$executeRawUnsafe(
            `UPDATE "ReportChunk" SET embedding = $1::vector WHERE id = $2`,
            vectorString,
            chunk.id
          );
          console.log(`  ✓ Embedding added (${embedding.length} dimensions)`);
          successCount++;
        }
      } catch (error) {
        console.error(`  ✗ Failed:`, error instanceof Error ? error.message : error);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Results:`);
    console.log(`  ✓ Successfully added embeddings: ${successCount}`);
    if (errorCount > 0) {
      console.log(`  ✗ Failed: ${errorCount}`);
    }
    
    // Verify the updates
    const verifyResult = await prisma.$queryRaw<any[]>`
      SELECT 
        COUNT(*) as total_chunks,
        COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) as chunks_with_embeddings
      FROM "ReportChunk"
    `;
    
    console.log(`\n📈 Database status:`);
    console.log(`  Total chunks: ${verifyResult[0].total_chunks}`);
    console.log(`  Chunks with embeddings: ${verifyResult[0].chunks_with_embeddings}`);
    
  } catch (error) {
    console.error('\n❌ Script failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addEmbeddingsToExistingChunks();