export interface DocumentMetadata {
  title: string;
  sourcePath: string;
  documentType: 'HANDBOOK' | 'QUESTIONNAIRE' | 'REPORT' | 'RESEARCH';
  section?: string;
  subsection?: string;
  chapter?: string;
  assessmentType?: string;
  [key: string]: any;
}

export interface DocumentChunk {
  content: string;
  chunkIndex: number;
  metadata: ChunkMetadata;
}

export interface ChunkMetadata {
  startOffset: number;
  endOffset: number;
  section?: string;
  subsection?: string;
  headers: string[];
  context?: string;
  [key: string]: any;
}

export interface ProcessedDocument {
  title: string;
  sourcePath: string;
  documentType: string;
  content: string;
  metadata: DocumentMetadata;
  chunks: DocumentChunk[];
}

export interface EmbeddedChunk extends DocumentChunk {
  embedding: number[];
}

export interface SearchResult {
  content: string;
  source: string;
  relevance: number;
  citation: string;
  metadata: any;
}

export interface QuestionnaireData {
  questionId: string;
  questionText: string;
  responseOptions?: any;
  scoringFormula?: string;
  category?: string;
  assessmentType: string;
  metadata?: any;
}