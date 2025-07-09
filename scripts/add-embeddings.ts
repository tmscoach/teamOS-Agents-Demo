#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import 'dotenv/config';


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function addEmbeddingsToChunks() {
  console.log('🔄 Adding embeddings to existing chunks\n');
  
  let processedTotal = 0;
  let hasMore = true;
  
  while (hasMore) {
    // Get chunks without embeddings in batches of 1000
    const { data: chunks, error } = await supabase
      .from('DocumentChunk')
      .select('id, content')
      .is('embedding', null)
      .limit(1000);
    
    if (error || !chunks || chunks.length === 0) {
      if (error) console.error('Error fetching chunks:', error);
      hasMore = false;
      break;
    }
    
    console.log(`\n📦 Processing batch of ${chunks.length} chunks...`);
    
    // Process in smaller batches for embeddings
    const batchSize = 10;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      
      // Show progress
      process.stdout.write(`\rProcessing: ${i + batch.length}/${chunks.length} chunks (${processedTotal + i + batch.length} total)`);
      
      try {
        // Generate embeddings
        const response = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: batch.map(c => c.content.substring(0, 2000))
        });
        
        // Update chunks with embeddings
        for (let j = 0; j < batch.length; j++) {
          const embedding = response.data[j].embedding;
          
          await supabase
            .from('DocumentChunk')
            .update({ 
              embedding: JSON.stringify(embedding)
            })
            .eq('id', batch[j].id);
        }
        
      } catch (error) {
        console.error('\nError generating embeddings:', error);
      }
      
      // Small delay to avoid rate limits
      if (i % 50 === 0 && i > 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    processedTotal += chunks.length;
    console.log(`\n✅ Batch complete. Total processed: ${processedTotal}`);
    
    // If we got less than 1000, we're probably done
    if (chunks.length < 1000) {
      hasMore = false;
    }
  }
  
  console.log(`\n🎉 All embeddings complete! Total chunks processed: ${processedTotal}`);
}

addEmbeddingsToChunks().catch(console.error);