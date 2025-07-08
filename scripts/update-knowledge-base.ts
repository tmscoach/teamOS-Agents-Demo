#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import 'dotenv/config';


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getFileHash(filePath: string): Promise<string> {
  const content = await fs.readFile(filePath, 'utf-8');
  return crypto.createHash('md5').update(content).digest('hex');
}

async function checkForUpdates() {
  console.log('🔍 Checking for document updates...\n');
  
  const docsPath = path.join(process.cwd(), '.documentation');
  const updates: string[] = [];
  
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
  
  // Check each file
  for (const file of files) {
    const currentHash = await getFileHash(file);
    
    // Get stored document
    const { data: doc } = await supabase
      .from('Document')
      .select('id, metadata')
      .eq('sourcePath', file)
      .single();
    
    if (!doc) {
      console.log(`📄 New document: ${path.basename(file)}`);
      updates.push(file);
    } else if (doc.metadata?.fileHash !== currentHash) {
      console.log(`📝 Updated document: ${path.basename(file)}`);
      updates.push(file);
      
      // Delete old version
      await supabase.from('DocumentChunk')
        .delete()
        .eq('documentId', doc.id);
      
      await supabase.from('QuestionnaireItem')
        .delete()
        .eq('documentId', doc.id);
        
      await supabase.from('Document')
        .delete()
        .eq('id', doc.id);
    }
  }
  
  if (updates.length === 0) {
    console.log('✅ All documents are up to date!');
    return;
  }
  
  console.log(`\n📊 Found ${updates.length} documents to update`);
  console.log('Run the ingestion script to process these updates:');
  console.log('npx tsx scripts/ingest-minimal.ts');
  
  // Optionally, save the list of files to update
  await fs.writeFile(
    'updates-pending.txt',
    updates.join('\n'),
    'utf-8'
  );
}

checkForUpdates().catch(console.error);