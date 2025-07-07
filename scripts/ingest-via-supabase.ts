#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { DocumentParser } from '../src/lib/knowledge-base/ingestion/parser';
import { DocumentChunker } from '../src/lib/knowledge-base/ingestion/chunker';
import { EmbeddingService } from '../src/lib/knowledge-base/ingestion/embeddings';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function processDocumentSafely(
  filePath: string,
  parser: DocumentParser,
  chunker: DocumentChunker,
  embeddingService: EmbeddingService
) {
  try {
    // Parse document
    const parsed = await parser.parseDocument(filePath);
    
    // Check if document already exists
    const { data: existingDoc } = await supabase
      .from('Document')
      .select('id')
      .eq('sourcePath', parsed.sourcePath)
      .single();
    
    if (existingDoc) {
      console.log(`  ⚠️  Document already exists, skipping: ${path.basename(filePath)}`);
      return;
    }
    
    // Create document record
    const { data: createdDoc, error: docError } = await supabase
      .from('Document')
      .insert({
        title: parsed.title,
        sourcePath: parsed.sourcePath,
        documentType: parsed.documentType,
        content: parsed.content.substring(0, 10000), // Limit stored content size
        metadata: parsed.metadata
      })
      .select()
      .single();
    
    if (docError) {
      throw new Error(`Failed to create document: ${docError.message}`);
    }
    
    // Chunk document with smaller chunks
    const chunks = await chunker.chunkDocument(parsed, {
      chunkSize: 400, // Even smaller chunks
      chunkOverlap: 100
    });
    
    console.log(`  📄 Processing ${chunks.length} chunks...`);
    
    // Process chunks in very small batches
    const chunkBatchSize = 5;
    for (let i = 0; i < chunks.length; i += chunkBatchSize) {
      const chunkBatch = chunks.slice(i, i + chunkBatchSize);
      
      // Generate embeddings for this batch
      const embeddedChunks = await embeddingService.generateEmbeddings(chunkBatch);
      
      // Prepare chunk data for insertion
      const chunkData = embeddedChunks.map(chunk => ({
        documentId: createdDoc.id,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
        embedding: JSON.stringify(chunk.embedding), // Store as JSON string for now
        metadata: chunk.metadata
      }));
      
      // Insert chunks
      const { error: chunkError } = await supabase
        .from('DocumentChunk')
        .insert(chunkData);
      
      if (chunkError) {
        console.error(`  ⚠️  Error inserting chunks: ${chunkError.message}`);
      }
      
      // Show progress
      process.stdout.write(`\r  ✓ Processed ${Math.min(i + chunkBatchSize, chunks.length)}/${chunks.length} chunks`);
    }
    
    console.log(''); // New line after progress
    
    // Process questionnaires if applicable
    if (parsed.documentType === 'QUESTIONNAIRE' && parsed.metadata.assessmentType) {
      const questionnaires = parser.extractQuestionnaires(
        parsed.content,
        parsed.metadata.assessmentType
      );
      
      if (questionnaires.length > 0) {
        const { error: qError } = await supabase
          .from('QuestionnaireItem')
          .insert(questionnaires.map(q => ({
            documentId: createdDoc.id,
            questionId: q.questionId,
            questionText: q.questionText,
            responseOptions: q.responseOptions,
            scoringFormula: q.scoringFormula,
            category: q.category,
            assessmentType: q.assessmentType,
            metadata: q.metadata
          })));
        
        if (qError) {
          console.error(`  ⚠️  Error inserting questionnaires: ${qError.message}`);
        }
      }
    }
    
    console.log(`  ✅ Successfully processed: ${path.basename(filePath)}`);
  } catch (error: any) {
    console.error(`  ❌ Error processing ${path.basename(filePath)}: ${error.message}`);
  }
}

async function main() {
  console.log('📚 TMS Knowledge Base Document Ingestion (Supabase)');
  console.log('==================================================\n');
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Error: Supabase environment variables are not set');
    process.exit(1);
  }
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY environment variable is not set');
    process.exit(1);
  }
  
  const parser = new DocumentParser();
  const chunker = new DocumentChunker();
  const embeddingService = new EmbeddingService();
  
  const documentationPath = path.join(process.cwd(), '.documentation');
  
  try {
    // Get all markdown files
    const documents: string[] = [];
    
    async function scan(dir: string): Promise<void> {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await scan(fullPath);
        } else if (entry.name.endsWith('.md')) {
          documents.push(fullPath);
        }
      }
    }
    
    await scan(documentationPath);
    console.log(`Found ${documents.length} documents to process\n`);
    
    // Process documents one at a time
    for (let i = 0; i < documents.length; i++) {
      console.log(`\n[${i + 1}/${documents.length}] Processing: ${path.basename(documents[i])}`);
      
      await processDocumentSafely(
        documents[i],
        parser,
        chunker,
        embeddingService
      );
      
      // Add a small delay between documents
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n✅ Document ingestion completed successfully!');
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
  }
}

// Run the ingestion
main().catch(console.error);