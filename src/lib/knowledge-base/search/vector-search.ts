import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

export interface SearchResult {
  id: string;
  content: string;
  documentId: string;
  documentTitle: string;
  documentType: string;
  similarity: number;
  metadata?: any;
}

export class VectorSearch {
  private supabase: any;
  private openai: OpenAI;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Search for similar content using vector similarity
   */
  async search(query: string, options?: {
    limit?: number;
    threshold?: number;
    documentTypes?: string[];
  }): Promise<SearchResult[]> {
    const { limit = 10, threshold = 0.7, documentTypes } = options || {};

    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);

      // Try to use the database function first
      const { data, error } = await this.supabase.rpc('search_similar_chunks', {
        query_embedding: queryEmbedding,
        match_count: limit * 2 // Get more results to filter later
      });

      if (error) {
        // Fallback to client-side similarity calculation
        return await this.fallbackSearch(queryEmbedding, limit, threshold, documentTypes);
      }

      // Join with document data and filter
      const results: SearchResult[] = [];
      
      for (const chunk of data || []) {
        if (chunk.similarity < threshold) continue;

        // Get document details
        const { data: doc } = await this.supabase
          .from('Document')
          .select('title, documentType')
          .eq('id', chunk.documentId)
          .single();

        if (doc && (!documentTypes || documentTypes.includes(doc.documentType))) {
          results.push({
            id: chunk.id,
            content: chunk.content,
            documentId: chunk.documentId,
            documentTitle: doc.title,
            documentType: doc.documentType,
            similarity: chunk.similarity
          });
        }

        if (results.length >= limit) break;
      }

      return results;

    } catch (error) {
      console.error('Vector search error:', error);
      throw error;
    }
  }

  /**
   * Search with additional context (hybrid search)
   */
  async hybridSearch(query: string, keywords?: string[], options?: {
    limit?: number;
    threshold?: number;
  }): Promise<SearchResult[]> {
    const { limit = 10, threshold = 0.7 } = options || {};

    // Get vector search results
    const vectorResults = await this.search(query, { limit: limit * 2, threshold });

    if (!keywords || keywords.length === 0) {
      return vectorResults.slice(0, limit);
    }

    // Boost results that contain keywords
    const boostedResults = vectorResults.map(result => {
      let boost = 0;
      const lowerContent = result.content.toLowerCase();
      
      for (const keyword of keywords) {
        if (lowerContent.includes(keyword.toLowerCase())) {
          boost += 0.1; // 10% boost per keyword match
        }
      }

      return {
        ...result,
        similarity: Math.min(1, result.similarity + boost)
      };
    });

    // Re-sort by boosted similarity
    boostedResults.sort((a, b) => b.similarity - a.similarity);

    return boostedResults.slice(0, limit);
  }

  /**
   * Get similar chunks to a given chunk (for context expansion)
   */
  async getSimilarChunks(chunkId: string, limit: number = 5): Promise<SearchResult[]> {
    // Get the chunk's content
    const { data: chunk } = await this.supabase
      .from('DocumentChunk')
      .select('content, embedding')
      .eq('id', chunkId)
      .single();

    if (!chunk) {
      throw new Error('Chunk not found');
    }

    // Use the chunk's embedding if available, otherwise generate it
    let embedding: number[];
    if (chunk.embedding) {
      embedding = typeof chunk.embedding === 'string' 
        ? JSON.parse(chunk.embedding) 
        : chunk.embedding;
    } else {
      embedding = await this.generateEmbedding(chunk.content);
    }

    // Search using the embedding
    return await this.searchByEmbedding(embedding, { limit, excludeId: chunkId });
  }

  /**
   * Generate embedding for text
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.substring(0, 2000)
    });
    
    return response.data[0].embedding;
  }

  /**
   * Search using a pre-computed embedding
   */
  private async searchByEmbedding(embedding: number[], options?: {
    limit?: number;
    excludeId?: string;
  }): Promise<SearchResult[]> {
    const { limit = 10, excludeId } = options || {};

    // Try database function
    const { data, error } = await this.supabase.rpc('search_similar_chunks', {
      query_embedding: embedding,
      match_count: limit + (excludeId ? 1 : 0)
    });

    if (error) {
      return await this.fallbackSearch(embedding, limit);
    }

    // Process results
    const results: SearchResult[] = [];
    
    for (const chunk of data || []) {
      if (chunk.id === excludeId) continue;

      const { data: doc } = await this.supabase
        .from('Document')
        .select('title, documentType')
        .eq('id', chunk.documentId)
        .single();

      if (doc) {
        results.push({
          id: chunk.id,
          content: chunk.content,
          documentId: chunk.documentId,
          documentTitle: doc.title,
          documentType: doc.documentType,
          similarity: chunk.similarity
        });
      }

      if (results.length >= limit) break;
    }

    return results;
  }

  /**
   * Fallback search using client-side similarity calculation
   */
  private async fallbackSearch(
    queryEmbedding: number[], 
    limit: number,
    threshold: number = 0,
    documentTypes?: string[]
  ): Promise<SearchResult[]> {
    // Fetch chunks with embeddings
    const { data: chunks } = await this.supabase
      .from('DocumentChunk')
      .select(`
        id,
        content,
        embedding,
        documentId,
        document:Document(title, documentType)
      `)
      .not('embedding', 'is', null)
      .limit(1000); // Reasonable limit for client-side processing

    if (!chunks) return [];

    // Calculate similarities
    const results = [];
    
    for (const chunk of chunks) {
      if (documentTypes && !documentTypes.includes(chunk.document.documentType)) {
        continue;
      }

      const chunkEmbedding = typeof chunk.embedding === 'string' 
        ? JSON.parse(chunk.embedding) 
        : chunk.embedding;

      const similarity = this.cosineSimilarity(queryEmbedding, chunkEmbedding);
      
      if (similarity >= threshold) {
        results.push({
          id: chunk.id,
          content: chunk.content,
          documentId: chunk.documentId,
          documentTitle: chunk.document.title,
          documentType: chunk.document.documentType,
          similarity
        });
      }
    }

    // Sort by similarity and return top results
    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, limit);
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

// Export a singleton instance
export const vectorSearch = new VectorSearch();