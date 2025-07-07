import { PrismaClient } from '@/lib/generated/prisma';
import { EmbeddingService } from '../ingestion/embeddings';
import { SearchResult } from '../types';

export interface SearchOptions {
  limit?: number;
  documentTypes?: string[];
  minRelevance?: number;
  includeMetadata?: boolean;
}

export class KnowledgeBaseSearch {
  private prisma: PrismaClient;
  private embeddingService: EmbeddingService;
  
  constructor() {
    this.prisma = new PrismaClient();
    this.embeddingService = new EmbeddingService();
  }
  
  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const {
      limit = 5,
      documentTypes = [],
      minRelevance = 0.7,
      includeMetadata = true
    } = options;
    
    try {
      const queryEmbedding = await this.embeddingService.generateEmbedding(query);
      
      let whereClause = '';
      if (documentTypes.length > 0) {
        const types = documentTypes.map(t => `'${t}'`).join(',');
        whereClause = `WHERE d."documentType" IN (${types})`;
      }
      
      const results = await this.prisma.$queryRaw<any[]>`
        SELECT 
          dc.content,
          dc.metadata,
          d.title as source,
          d."sourcePath",
          d."documentType",
          1 - (dc.embedding <=> ${queryEmbedding}::vector) as similarity
        FROM "DocumentChunk" dc
        JOIN "Document" d ON d.id = dc."documentId"
        ${whereClause ? whereClause : ''}
        ORDER BY similarity DESC
        LIMIT ${limit}
      `;
      
      return results
        .filter(r => r.similarity >= minRelevance)
        .map(r => ({
          content: r.content,
          source: r.source,
          relevance: r.similarity,
          citation: this.generateCitation(r),
          metadata: includeMetadata ? {
            ...r.metadata,
            documentType: r.documentType,
            sourcePath: r.sourcePath
          } : undefined
        }));
    } catch (error) {
      console.error('Search error:', error);
      throw new Error('Failed to perform search');
    }
  }
  
  async hybridSearch(
    query: string, 
    keywords: string[], 
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    const vectorResults = await this.search(query, options);
    const keywordResults = await this.keywordSearch(keywords, options);
    
    const combinedResults = new Map<string, SearchResult>();
    
    for (const result of vectorResults) {
      const key = `${result.source}-${result.content.substring(0, 50)}`;
      combinedResults.set(key, result);
    }
    
    for (const result of keywordResults) {
      const key = `${result.source}-${result.content.substring(0, 50)}`;
      if (combinedResults.has(key)) {
        const existing = combinedResults.get(key)!;
        existing.relevance = (existing.relevance + result.relevance) / 2;
      } else {
        combinedResults.set(key, result);
      }
    }
    
    return Array.from(combinedResults.values())
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, options.limit || 5);
  }
  
  private async keywordSearch(
    keywords: string[], 
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    const {
      limit = 5,
      documentTypes = [],
      includeMetadata = true
    } = options;
    
    try {
      const searchPattern = keywords.join(' | ');
      
      let whereConditions = [`to_tsvector('english', dc.content) @@ to_tsquery('english', $1)`];
      const params: any[] = [searchPattern];
      
      if (documentTypes.length > 0) {
        whereConditions.push(`d."documentType" = ANY($2::text[])`);
        params.push(documentTypes);
      }
      
      const whereClause = whereConditions.join(' AND ');
      
      const results = await this.prisma.$queryRaw<any[]>`
        SELECT 
          dc.content,
          dc.metadata,
          d.title as source,
          d."sourcePath",
          d."documentType",
          ts_rank(to_tsvector('english', dc.content), to_tsquery('english', ${searchPattern})) as rank
        FROM "DocumentChunk" dc
        JOIN "Document" d ON d.id = dc."documentId"
        WHERE ${whereClause}
        ORDER BY rank DESC
        LIMIT ${limit}
      `;
      
      return results.map(r => ({
        content: r.content,
        source: r.source,
        relevance: Math.min(r.rank, 1),
        citation: this.generateCitation(r),
        metadata: includeMetadata ? {
          ...r.metadata,
          documentType: r.documentType,
          sourcePath: r.sourcePath
        } : undefined
      }));
    } catch (error) {
      console.error('Keyword search error:', error);
      return [];
    }
  }
  
  async getDocumentSection(documentId: string, section: string): Promise<SearchResult | null> {
    try {
      const result = await this.prisma.documentChunk.findFirst({
        where: {
          documentId,
          metadata: {
            path: ['section'],
            equals: section
          }
        },
        include: {
          document: true
        }
      });
      
      if (!result) return null;
      
      return {
        content: result.content,
        source: result.document.title,
        relevance: 1,
        citation: `${result.document.title}, ${section}`,
        metadata: result.metadata as any
      };
    } catch (error) {
      console.error('Get document section error:', error);
      return null;
    }
  }
  
  async getQuestionnaireItems(
    assessmentType?: string,
    category?: string,
    questionIds?: string[]
  ): Promise<any[]> {
    try {
      const where: any = {};
      
      if (assessmentType) {
        where.assessmentType = assessmentType;
      }
      
      if (category) {
        where.category = category;
      }
      
      if (questionIds && questionIds.length > 0) {
        where.questionId = { in: questionIds };
      }
      
      const items = await this.prisma.questionnaireItem.findMany({
        where,
        include: {
          document: true
        }
      });
      
      return items.map(item => ({
        questionId: item.questionId,
        questionText: item.questionText,
        responseOptions: item.responseOptions,
        scoringFormula: item.scoringFormula,
        category: item.category,
        assessmentType: item.assessmentType,
        source: item.document.title,
        metadata: item.metadata
      }));
    } catch (error) {
      console.error('Get questionnaire items error:', error);
      return [];
    }
  }
  
  private generateCitation(result: any): string {
    const parts = [result.source];
    
    if (result.metadata?.section) {
      parts.push(result.metadata.section);
    }
    
    if (result.metadata?.subsection) {
      parts.push(result.metadata.subsection);
    }
    
    return parts.join(', ');
  }
  
  async close(): Promise<void> {
    await this.prisma.$disconnect();
  }
}