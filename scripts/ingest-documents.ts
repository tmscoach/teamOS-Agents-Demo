#!/usr/bin/env node

import { IngestionPipeline } from '../src/lib/knowledge-base';
import path from 'path';

// Environment variables should be loaded by Next.js

async function main() {
  console.log('📚 TMS Knowledge Base Document Ingestion');
  console.log('========================================\n');
  
  // Check for required environment variables
  if (!process.env.DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY environment variable is not set');
    process.exit(1);
  }
  
  const documentationPath = path.join(process.cwd(), '.documentation');
  
  console.log(`📁 Documentation path: ${documentationPath}`);
  console.log('⏳ Starting document ingestion...\n');
  
  try {
    const pipeline = new IngestionPipeline();
    await pipeline.ingestDocuments(documentationPath);
    
    console.log('\n✅ Document ingestion completed successfully!');
  } catch (error) {
    console.error('\n❌ Error during ingestion:', error);
    process.exit(1);
  }
}

// Run the ingestion
main().catch(console.error);