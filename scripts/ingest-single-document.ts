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
      input: text.substring(0, 2000),
      encoding_format: 'float'
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return new Array(1536).fill(0);
  }
}

async function processSingleDocument(filePath: string, forceReprocess: boolean = false) {
  try {
    const fileName = path.basename(filePath);
    const dirName = path.basename(path.dirname(filePath));
    
    console.log(`📄 Processing: ${fileName}`);
    
    // Check if already processed
    const { data: existing } = await supabase
      .from('Document')
      .select('id, title')
      .eq('sourcePath', filePath)
      .single();
    
    if (existing && !forceReprocess) {
      console.log(`⚠️  Document already exists: ${existing.title}`);
      console.log('Use --force flag to reprocess');
      return;
    }
    
    if (existing && forceReprocess) {
      console.log(`🗑️  Deleting existing document: ${existing.title}`);
      
      // Delete existing chunks and questionnaire items
      await supabase.from('DocumentChunk').delete().eq('documentId', existing.id);
      await supabase.from('QuestionnaireItem').delete().eq('documentId', existing.id);
      await supabase.from('Document').delete().eq('id', existing.id);
      
      console.log('✓ Existing document deleted');
    }
    
    // Read file content
    const content = await fs.readFile(filePath, 'utf-8');
    console.log(`📏 Document size: ${content.length} characters`);
    
    // Extract title
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
        content: content.substring(0, 10000),
        metadata: { fileName, dirName, fileSize: content.length }
      })
      .select()
      .single();
    
    if (docError) {
      throw new Error(`Failed to create document: ${docError.message}`);
    }
    
    console.log(`✅ Document created: ${title}`);
    
    // Process content in chunks
    const chunkSize = 500;
    const overlap = 100;
    let chunkIndex = 0;
    const totalChunks = Math.ceil(content.length / (chunkSize - overlap));
    
    console.log(`📊 Creating approximately ${totalChunks} chunks...`);
    
    for (let i = 0; i < content.length; i += (chunkSize - overlap)) {
      const chunk = content.substring(i, i + chunkSize);
      if (chunk.trim().length < 50) continue;
      
      // Store chunk
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
        console.error(`⚠️  Error storing chunk ${chunkIndex}: ${chunkError.message}`);
      }
      
      // Progress update
      if (chunkIndex % 10 === 0) {
        process.stdout.write(`\r✓ Processed ${chunkIndex} chunks (${Math.round((i / content.length) * 100)}%)...`);
      }
      
      // Delay to avoid rate limits
      if (chunkIndex % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    console.log(`\n✅ Successfully processed ${chunkIndex} chunks`);
    
  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: npx tsx scripts/ingest-single-document.ts <path-to-document> [--force]');
    console.log('Example: npx tsx scripts/ingest-single-document.ts .documentation/1-Accreditation-Handbooks/TMP\\ Accreditation\\ Handbook.md --force');
    process.exit(1);
  }
  
  const filePath = args[0];
  const forceReprocess = args.includes('--force');
  
  console.log('📚 Single Document Ingestion');
  console.log('===========================\n');
  
  // Check file exists
  try {
    await fs.access(filePath);
  } catch {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }
  
  await processSingleDocument(filePath, forceReprocess);
}

main().catch(console.error);