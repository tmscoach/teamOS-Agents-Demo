#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyKnowledgeBase() {
  console.log('🔍 Verifying Knowledge Base Setup\n');
  
  // 1. Check document count
  const { count: docCount } = await supabase
    .from('Document')
    .select('*', { count: 'exact', head: true });
  
  console.log(`📄 Documents: ${docCount}`);
  
  // 2. Check chunk count and embeddings
  const { data: chunkStats } = await supabase
    .from('DocumentChunk')
    .select('id, embedding');
  
  const totalChunks = chunkStats?.length || 0;
  const chunksWithEmbeddings = chunkStats?.filter(c => c.embedding !== null).length || 0;
  const chunksWithoutEmbeddings = totalChunks - chunksWithEmbeddings;
  
  console.log(`\n📊 Chunk Statistics:`);
  console.log(`- Total chunks: ${totalChunks}`);
  console.log(`- With embeddings: ${chunksWithEmbeddings}`);
  console.log(`- Without embeddings: ${chunksWithoutEmbeddings}`);
  
  if (chunksWithoutEmbeddings > 0) {
    console.log(`\n⚠️  ${chunksWithoutEmbeddings} chunks still need embeddings!`);
    console.log(`Run: npx tsx scripts/add-embeddings.ts`);
  } else {
    console.log(`\n✅ All chunks have embeddings!`);
  }
  
  // 3. Check document types
  const { data: docTypes } = await supabase
    .from('Document')
    .select('documentType');
  
  const typeCounts = docTypes?.reduce((acc: any, doc: any) => {
    acc[doc.documentType] = (acc[doc.documentType] || 0) + 1;
    return acc;
  }, {});
  
  console.log(`\n📚 Document Types:`);
  Object.entries(typeCounts || {}).forEach(([type, count]) => {
    console.log(`- ${type}: ${count}`);
  });
  
  // 4. Check questionnaire items
  const { count: qCount } = await supabase
    .from('QuestionnaireItem')
    .select('*', { count: 'exact', head: true });
  
  console.log(`\n❓ Questionnaire Items: ${qCount}`);
  
  // 5. Test a sample embedding
  const { data: sampleChunk } = await supabase
    .from('DocumentChunk')
    .select('embedding')
    .not('embedding', 'is', null)
    .limit(1)
    .single();
  
  if (sampleChunk?.embedding) {
    const embedding = typeof sampleChunk.embedding === 'string' 
      ? JSON.parse(sampleChunk.embedding) 
      : sampleChunk.embedding;
    console.log(`\n🔢 Sample embedding dimension: ${Array.isArray(embedding) ? embedding.length : 'Invalid'}`);
  }
  
  // Summary
  console.log('\n📋 Summary:');
  if (chunksWithoutEmbeddings === 0 && docCount > 0 && totalChunks > 0) {
    console.log('✅ Knowledge base is fully set up and ready!');
    console.log('\nNext steps:');
    console.log('1. Test vector search functionality');
    console.log('2. Integrate with agent tools');
    console.log('3. Create PR for this work');
  } else {
    console.log('❌ Knowledge base setup incomplete');
    if (docCount === 0) console.log('- No documents found');
    if (totalChunks === 0) console.log('- No chunks found');
    if (chunksWithoutEmbeddings > 0) console.log(`- ${chunksWithoutEmbeddings} chunks need embeddings`);
  }
}

verifyKnowledgeBase().catch(console.error);