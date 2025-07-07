#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.substring(0, 2000), // Limit text length
      encoding_format: 'float'
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return new Array(1536).fill(0);
  }
}

async function processDocument(filePath: string) {
  try {
    const fileName = path.basename(filePath);
    const dirName = path.basename(path.dirname(filePath));
    
    // Check if already processed
    const { data: existing } = await supabase
      .from('Document')
      .select('id')
      .eq('sourcePath', filePath)
      .single();
    
    if (existing) {
      console.log(`  ⚠️  Already processed: ${fileName}`);
      return;
    }
    
    // Read file content
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Extract title from first line
    const lines = content.split('\n');
    const title = lines[0].startsWith('#') ? lines[0].replace(/^#+\s*/, '').trim() : fileName;
    
    // Determine document type
    let documentType = 'HANDBOOK';
    if (dirName.toLowerCase().includes('questionnaire') || fileName.toLowerCase().includes('questionnaire')) {
      documentType = 'QUESTIONNAIRE';
    } else if (dirName.toLowerCase().includes('report') || fileName.toLowerCase().includes('report')) {
      documentType = 'REPORT';
    } else if (dirName.toLowerCase().includes('research')) {
      documentType = 'RESEARCH';
    }
    
    // Create document
    const { data: doc, error: docError } = await supabase
      .from('Document')
      .insert({
        title,
        sourcePath: filePath,
        documentType,
        content: content.substring(0, 10000), // Store only first 10k chars
        metadata: { fileName, dirName }
      })
      .select()
      .single();
    
    if (docError) {
      throw new Error(`Failed to create document: ${docError.message}`);
    }
    
    console.log(`  📄 Created document: ${title}`);
    
    // Process content in small chunks
    const chunkSize = 500;
    const overlap = 100;
    let chunkIndex = 0;
    
    for (let i = 0; i < content.length; i += (chunkSize - overlap)) {
      const chunk = content.substring(i, i + chunkSize);
      if (chunk.trim().length < 50) continue; // Skip very small chunks
      
      // Generate embedding for this chunk
      const embedding = await generateEmbedding(chunk);
      
      // Store chunk with retry logic
      let retries = 3;
      let stored = false;
      
      while (retries > 0 && !stored) {
        const { error: chunkError } = await supabase
          .from('DocumentChunk')
          .insert({
            documentId: doc.id,
            chunkIndex: chunkIndex++,
            content: chunk,
            metadata: { 
              startOffset: i,
              endOffset: Math.min(i + chunkSize, content.length)
            }
          });
        
        if (chunkError) {
          retries--;
          if (retries > 0) {
            console.log(`\n  ⚠️  Error storing chunk, retrying... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
            console.error(`\n  ❌ Failed to store chunk after 3 attempts`);
          }
        } else {
          stored = true;
        }
      }
      
      // Update progress
      if (chunkIndex % 10 === 0) {
        process.stdout.write(`\r  ✓ Processed ${chunkIndex} chunks...`);
      }
      
      // Longer delay to avoid rate limits
      if (chunkIndex % 3 === 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Even longer delay every 20 chunks
      if (chunkIndex % 20 === 0 && chunkIndex > 0) {
        console.log('\n  ⏸️  Pausing to avoid rate limits...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log(`\n  ✅ Completed: ${fileName} (${chunkIndex} chunks)`);
    
  } catch (error: any) {
    console.error(`  ❌ Error: ${error.message}`);
  }
}

async function main() {
  console.log('📚 TMS Knowledge Base Document Ingestion (Minimal)');
  console.log('=================================================\n');
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Error: Supabase environment variables are not set');
    process.exit(1);
  }
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY environment variable is not set');
    process.exit(1);
  }
  
  const docsPath = path.join(process.cwd(), '.documentation');
  
  try {
    // Get all markdown files
    const files: string[] = [];
    
    async function scan(dir: string): Promise<void> {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await scan(fullPath);
        } else if (entry.name.endsWith('.md')) {
          files.push(fullPath);
        }
      }
    }
    
    await scan(docsPath);
    console.log(`Found ${files.length} documents\n`);
    
    // Process one at a time
    for (let i = 0; i < files.length; i++) {
      console.log(`\n[${i + 1}/${files.length}] ${path.basename(files[i])}`);
      await processDocument(files[i]);
      
      // Longer delay between documents
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n✅ Ingestion complete!');
    
  } catch (error) {
    console.error('Fatal error:', error);
  }
}

main().catch(console.error);