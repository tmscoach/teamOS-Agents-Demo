import OpenAI from 'openai';
import { DocumentChunk, EmbeddedChunk } from '../types';

export class EmbeddingService {
  private openai: OpenAI;
  private modelName = 'text-embedding-3-small';
  private batchSize = 10; // Further reduced batch size to avoid memory issues
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  
  async generateEmbeddings(chunks: DocumentChunk[]): Promise<EmbeddedChunk[]> {
    const embeddedChunks: EmbeddedChunk[] = [];
    
    for (let i = 0; i < chunks.length; i += this.batchSize) {
      const batch = chunks.slice(i, i + this.batchSize);
      const embeddings = await this.generateBatchEmbeddings(batch);
      
      for (let j = 0; j < batch.length; j++) {
        embeddedChunks.push({
          ...batch[j],
          embedding: embeddings[j]
        });
      }
    }
    
    return embeddedChunks;
  }
  
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: this.modelName,
        input: text,
        encoding_format: 'float'
      });
      
      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error('Failed to generate embedding');
    }
  }
  
  private async generateBatchEmbeddings(chunks: DocumentChunk[]): Promise<number[][]> {
    const texts = chunks.map(chunk => 
      this.prepareTextForEmbedding(chunk.content, chunk.metadata)
    );
    
    try {
      const response = await this.openai.embeddings.create({
        model: this.modelName,
        input: texts,
        encoding_format: 'float'
      });
      
      return response.data.map(item => item.embedding);
    } catch (error) {
      console.error('Error generating batch embeddings:', error);
      
      const embeddings: number[][] = [];
      for (const text of texts) {
        try {
          const embedding = await this.generateEmbedding(text);
          embeddings.push(embedding);
        } catch (err) {
          console.error('Error generating individual embedding:', err);
          embeddings.push(new Array(1536).fill(0));
        }
      }
      
      return embeddings;
    }
  }
  
  private prepareTextForEmbedding(content: string, metadata: any): string {
    const parts: string[] = [content];
    
    if (metadata.section) {
      parts.unshift(`Section: ${metadata.section}`);
    }
    
    if (metadata.headers && metadata.headers.length > 0) {
      parts.unshift(`Context: ${metadata.headers.join(' > ')}`);
    }
    
    return parts.join('\n\n');
  }
  
  cosineSimilarity(embedding1: number[], embedding2: number[]): number {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }
}