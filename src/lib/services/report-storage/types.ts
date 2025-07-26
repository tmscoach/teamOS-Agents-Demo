/**
 * Types for Report Storage Service
 */

export interface StoreReportOptions {
  userId: string;
  teamId?: string;
  organizationId: string;
  reportType: 'TMP' | 'QO2' | 'TEAM_SIGNALS' | 'TEAM_SIGNALS_360';
  subscriptionId: string;
  templateId: string;
  rawHtml: string;
}

export interface ProcessedReport {
  id: string;
  processedHtml: string;
  images: ProcessedImage[];
  metadata: ReportMetadata;
}

export interface ProcessedImage {
  originalUrl: string;
  storagePath: string;
  imageType: 'wheel' | 'graph' | 'asset';
  altText?: string;
}

export interface ReportMetadata {
  title: string;
  subtitle?: string;
  userName?: string;
  organizationName?: string;
  completedDate?: string;
  scores?: Record<string, number>;
  profile?: {
    name: string;
    tagline?: string;
    description?: string;
    majorRole?: string;
    relatedRoles?: string[];
  };
  sections?: Array<{
    id: string;
    title: string;
  }>;
}

export interface ReportSearchOptions {
  userId: string;
  query: string;
  reportTypes?: string[];
  limit?: number;
}

export interface ReportSearchResult {
  reportId: string;
  reportType: string;
  sectionTitle: string;
  content: string;
  relevance: number;
  metadata?: any;
}