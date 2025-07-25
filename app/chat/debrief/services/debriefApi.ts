import { ParsedReport } from '@/src/lib/utils/report-parser';

export interface DebriefApiRequest {
  message: string;
  conversationId: string | null;
  agentName: string;
  reportType: string;
  subscriptionId: string | null;
  visibleSection: string;
  reportData?: {
    type: string;
    title: string;
    profile: any;
    sections?: Array<{
      id: string;
      title: string;
      content: string;
    }>;
  };
}

export interface StreamChunk {
  content?: string;
  conversationId?: string;
  error?: string;
  done?: boolean;
}

export class DebriefApiService {
  static async sendMessage(
    request: DebriefApiRequest,
    signal?: AbortSignal
  ): Promise<ReadableStreamDefaultReader<Uint8Array>> {
    const response = await fetch('/api/chat/debrief', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    return response.body.getReader();
  }

  static parseStreamChunk(line: string): StreamChunk | null {
    if (!line.startsWith('data: ')) return null;
    
    const data = line.slice(6);
    if (data === '[DONE]') {
      return { done: true };
    }
    
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Error parsing stream chunk:', e);
      return null;
    }
  }

  static prepareReportData(reportData?: ParsedReport) {
    if (!reportData) return undefined;

    return {
      type: reportData.type,
      title: reportData.title,
      profile: reportData.profile,
      sections: reportData.sections?.map(s => ({
        id: s.id,
        title: s.title,
        content: s.content.substring(0, 500) // Limit content size
      }))
    };
  }
}