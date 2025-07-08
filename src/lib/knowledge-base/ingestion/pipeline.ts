import fs from 'fs/promises';
import path from 'path';
import { PrismaClient } from '@/lib/generated/prisma';
import { DocumentParser } from './parser';
import { DocumentChunker } from './chunker';
import { EmbeddingService } from './embeddings';
import { ProcessedDocument } from '../types';

export class IngestionPipeline {
  private prisma: PrismaClient;
  private parser: DocumentParser;
  private chunker: DocumentChunker;
  private embeddingService: EmbeddingService;
  
  constructor() {
    this.prisma = new PrismaClient();
    this.parser = new DocumentParser();
    this.chunker = new DocumentChunker();
    this.embeddingService = new EmbeddingService();
  }
  
  async ingestDocuments(folderPath: string): Promise<void> {
    console.log(`Starting document ingestion from: ${folderPath}`);
    
    try {
      const documents = await this.scanDocumentFolder(folderPath);
      console.log(`Found ${documents.length} documents to process`);
      
      // Process documents in batches to avoid memory issues
      const batchSize = 5;
      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        console.log(`\nProcessing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(documents.length / batchSize)}`);
        
        for (const docPath of batch) {
          try {
            await this.processDocument(docPath);
            console.log(`✓ Successfully processed: ${path.basename(docPath)}`);
            
            // Force garbage collection between documents
            if (global.gc) {
              global.gc();
            }
          } catch (error) {
            console.error(`✗ Error processing ${path.basename(docPath)}:`, error);
          }
        }
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log('\n✅ Document ingestion completed');
    } catch (error) {
      console.error('Ingestion pipeline error:', error);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }
  
  private async scanDocumentFolder(folderPath: string): Promise<string[]> {
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
    
    await scan(folderPath);
    return documents;
  }
  
  private async processDocument(docPath: string): Promise<void> {
    const parsed = await this.parser.parseDocument(docPath);
    
    const existingDoc = await this.prisma.document.findUnique({
      where: { sourcePath: parsed.sourcePath }
    });
    
    if (existingDoc) {
      console.log(`Document already exists: ${parsed.title}, updating...`);
      await this.updateDocument(existingDoc.id, parsed);
    } else {
      await this.createDocument(parsed);
    }
  }
  
  private async createDocument(document: ProcessedDocument): Promise<void> {
    const chunks = await this.chunker.chunkDocument(document);
    const embeddedChunks = await this.embeddingService.generateEmbeddings(chunks);
    
    const createdDoc = await this.prisma.document.create({
      data: {
        title: document.title,
        sourcePath: document.sourcePath,
        documentType: document.documentType as any,
        content: document.content,
        metadata: document.metadata
      }
    });
    
    for (const chunk of embeddedChunks) {
      await this.prisma.$executeRaw`
        INSERT INTO "DocumentChunk" (id, "documentId", "chunkIndex", content, embedding, metadata, "createdAt")
        VALUES (
          gen_random_uuid(),
          ${createdDoc.id}::uuid,
          ${chunk.chunkIndex},
          ${chunk.content},
          ${chunk.embedding}::vector,
          ${JSON.stringify(chunk.metadata)}::jsonb,
          NOW()
        )
      `;
    }
    
    if (document.documentType === 'QUESTIONNAIRE' && document.metadata.assessmentType) {
      const questionnaires = this.parser.extractQuestionnaires(
        document.content, 
        document.metadata.assessmentType
      );
      
      for (const q of questionnaires) {
        await this.prisma.questionnaireItem.create({
          data: {
            documentId: createdDoc.id,
            questionId: q.questionId,
            questionText: q.questionText,
            responseOptions: q.responseOptions,
            scoringFormula: q.scoringFormula,
            category: q.category,
            assessmentType: q.assessmentType,
            metadata: q.metadata
          }
        });
      }
    }
  }
  
  private async updateDocument(documentId: string, document: ProcessedDocument): Promise<void> {
    await this.prisma.documentChunk.deleteMany({
      where: { documentId }
    });
    
    await this.prisma.questionnaireItem.deleteMany({
      where: { documentId }
    });
    
    await this.prisma.document.update({
      where: { id: documentId },
      data: {
        title: document.title,
        content: document.content,
        metadata: document.metadata,
        updatedAt: new Date()
      }
    });
    
    const chunks = await this.chunker.chunkDocument(document);
    const embeddedChunks = await this.embeddingService.generateEmbeddings(chunks);
    
    for (const chunk of embeddedChunks) {
      await this.prisma.$executeRaw`
        INSERT INTO "DocumentChunk" (id, "documentId", "chunkIndex", content, embedding, metadata, "createdAt")
        VALUES (
          gen_random_uuid(),
          ${documentId}::uuid,
          ${chunk.chunkIndex},
          ${chunk.content},
          ${chunk.embedding}::vector,
          ${JSON.stringify(chunk.metadata)}::jsonb,
          NOW()
        )
      `;
    }
    
    if (document.documentType === 'QUESTIONNAIRE' && document.metadata.assessmentType) {
      const questionnaires = this.parser.extractQuestionnaires(
        document.content, 
        document.metadata.assessmentType
      );
      
      for (const q of questionnaires) {
        await this.prisma.questionnaireItem.create({
          data: {
            documentId: documentId,
            questionId: q.questionId,
            questionText: q.questionText,
            responseOptions: q.responseOptions,
            scoringFormula: q.scoringFormula,
            category: q.category,
            assessmentType: q.assessmentType,
            metadata: q.metadata
          }
        });
      }
    }
  }
}