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
  
  // Get chunks without embeddings
  const { data: chunks, error } = await supabase
    .from('DocumentChunk')
    .select('id, content')
    .is('embedding', null)
    .limit(100);
  
  if (error || !chunks) {
    console.error('Error fetching chunks:', error);
    return;
  }
  
  console.log(`Found ${chunks.length} chunks without embeddings\n`);
  
  // Process in batches
  const batchSize = 10;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(chunks.length/batchSize)}`);
    
    try {
      // Generate embeddings
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: batch.map(c => c.content.substring(0, 2000))
      });
      
      // Update chunks with embeddings
      for (let j = 0; j < batch.length; j++) {
        const embedding = response.data[j].embedding;
        
        // For now, store as JSON string
        // Later we'll update to use proper vector column
        await supabase
          .from('DocumentChunk')
          .update({ 
            embedding: JSON.stringify(embedding)
          })
          .eq('id', batch[j].id);
      }
      
    } catch (error) {
      console.error('Error generating embeddings:', error);
    }
    
    // Delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n✅ Embedding addition complete!');
}

addEmbeddingsToChunks().catch(console.error);