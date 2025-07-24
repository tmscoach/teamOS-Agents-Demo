#!/usr/bin/env node

import { IngestionPipeline } from '../src/lib/knowledge-base/ingestion/pipeline';
import path from 'path';
import 'dotenv/config';

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: npx tsx scripts/ingest-documents.ts <folder-path>');
    console.log('');
    console.log('Examples:');
    console.log('  npx tsx scripts/ingest-documents.ts .documentation');
    console.log('  npx tsx scripts/ingest-documents.ts ".documentation/Accreditation Handbooks"');
    console.log('  npx tsx scripts/ingest-documents.ts ".documentation/Accreditation Handbooks/TMP Accreditation Handbook"');
    process.exit(1);
  }
  
  const folderPath = path.resolve(args[0]);
  
  console.log('📚 Document Ingestion Tool');
  console.log('========================');
  console.log(`Ingesting documents from: ${folderPath}`);
  console.log('');
  
  try {
    const pipeline = new IngestionPipeline();
    await pipeline.ingestDocuments(folderPath);
    
    console.log('\n✅ Ingestion completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Run: npx tsx scripts/verify-knowledge-base.ts');
    console.log('2. Test search functionality in the chat interface');
  } catch (error) {
    console.error('\n❌ Ingestion failed:', error);
    process.exit(1);
  }
}

main();