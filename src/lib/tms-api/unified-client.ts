/**
 * Unified TMS API Client
 * Provides a single interface that can switch between mock and live API implementations
 */

import { apiModeManager } from '../mock-tms-api/api-mode-config';
import { mockTMSClient } from '../mock-tms-api/mock-api-client';
import { 
  TMSAuthResponse, 
  TMSValidateResponse,
  TMSDashboardSubscription,
  TMSWorkflowProcess,
  TMSReportSummary,
  TMSReportTemplate,
  TMSProductUsage,
  TMSErrorResponse
} from '../mock-tms-api/types';

export interface TMSAPIRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  data?: any;
  jwt?: string;
  headers?: Record<string, string>;
}

export class UnifiedTMSClient {
  private static instance: UnifiedTMSClient;

  private constructor() {}

  static getInstance(): UnifiedTMSClient {
    if (!UnifiedTMSClient.instance) {
      UnifiedTMSClient.instance = new UnifiedTMSClient();
    }
    return UnifiedTMSClient.instance;
  }

  /**
   * Make an API request that automatically routes to mock or live implementation
   */
  async request<T = any>(options: TMSAPIRequestOptions): Promise<T> {
    apiModeManager.log(`${options.method} ${options.endpoint}`, { 
      hasData: !!options.data,
      hasAuth: !!options.jwt 
    });

    if (apiModeManager.isMockMode()) {
      return this.mockRequest<T>(options);
    } else {
      return this.liveRequest<T>(options);
    }
  }

  /**
   * Mock API request handler
   */
  private async mockRequest<T>(options: TMSAPIRequestOptions): Promise<T> {
    try {
      const result = await mockTMSClient.request<T>(options);
      apiModeManager.log('Mock response received', { 
        endpoint: options.endpoint,
        hasData: !!result 
      });
      return result;
    } catch (error) {
      apiModeManager.log('Mock request failed', { 
        endpoint: options.endpoint,
        error 
      });
      throw error;
    }
  }

  /**
   * Live API request handler
   */
  private async liveRequest<T>(options: TMSAPIRequestOptions): Promise<T> {
    const baseUrl = apiModeManager.getApiBaseUrl();
    if (!baseUrl) {
      throw new Error('Live API URL not configured. Set NEXT_PUBLIC_TMS_API_URL environment variable.');
    }

    const url = `${baseUrl}${options.endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (options.jwt) {
      headers['Authorization'] = `Bearer ${options.jwt}`;
    }

    try {
      const fetchOptions: RequestInit = {
        method: options.method,
        headers
      };

      if (options.data && options.method !== 'GET') {
        fetchOptions.body = JSON.stringify(options.data);
      }

      apiModeManager.log(`Live API request: ${url}`, { method: options.method });

      const response = await fetch(url, fetchOptions);
      const responseData = await response.json();

      if (!response.ok) {
        const error: TMSErrorResponse = {
          error: responseData.error || 'API_ERROR',
          message: responseData.message || `Request failed with status ${response.status}`,
          details: responseData.details
        };
        throw error;
      }

      apiModeManager.log('Live response received', { 
        endpoint: options.endpoint,
        status: response.status 
      });

      return responseData as T;
    } catch (error) {
      apiModeManager.log('Live request failed', { 
        endpoint: options.endpoint,
        error 
      });
      throw error;
    }
  }

  /**
   * Convenience methods for common operations
   */

  async login(email: string, password: string): Promise<TMSAuthResponse> {
    return this.request<TMSAuthResponse>({
      method: 'POST',
      endpoint: '/api/v1/auth/login',
      data: { Email: email, Password: password }
    });
  }

  async validateToken(jwt: string): Promise<TMSValidateResponse> {
    return this.request<TMSValidateResponse>({
      method: 'GET',
      endpoint: '/api/v1/team-os/auth/validate',
      jwt
    });
  }

  async getDashboardSubscriptions(jwt: string): Promise<TMSDashboardSubscription[]> {
    return this.request<TMSDashboardSubscription[]>({
      method: 'GET',
      endpoint: '/Respondent/GetDashboardSubscription',
      jwt
    });
  }

  async getWorkflowProcess(
    jwt: string,
    subscriptionId: string,
    baseContentId: string,
    sectionId: string,
    pageId: string
  ): Promise<TMSWorkflowProcess> {
    return this.request<TMSWorkflowProcess>({
      method: 'GET',
      endpoint: `/Workflow/Process/${subscriptionId}/${baseContentId}/${sectionId}/${pageId}`,
      jwt
    });
  }

  async updateWorkflow(
    jwt: string,
    subscriptionID: number,
    pageID: number,
    questions: Array<{ questionID: number; value: string }>
  ): Promise<boolean> {
    return this.request<boolean>({
      method: 'POST',
      endpoint: '/Workflow/Update',
      data: { subscriptionID, pageID, questions },
      jwt
    });
  }

  async getReportSummary(jwt: string, subscriptionId: string): Promise<TMSReportSummary> {
    return this.request<TMSReportSummary>({
      method: 'GET',
      endpoint: `/api/v1/workflow/report-summary/${subscriptionId}`,
      jwt
    });
  }

  async getReportTemplates(jwt: string, subscriptionId: string): Promise<TMSReportTemplate[]> {
    return this.request<TMSReportTemplate[]>({
      method: 'GET',
      endpoint: `/api/v1/workflow/report-templates/${subscriptionId}`,
      jwt
    });
  }

  async generateReport(
    jwt: string,
    subscriptionId: string,
    templateId: string
  ): Promise<{ reportId: string; reportUrl: string; status: string }> {
    return this.request({
      method: 'POST',
      endpoint: '/api/v1/workflow/generate-report',
      data: { subscriptionId, templateId },
      jwt
    });
  }

  async getProductUsage(jwt: string): Promise<TMSProductUsage> {
    return this.request<TMSProductUsage>({
      method: 'GET',
      endpoint: '/api/v1/reports/product-usage',
      jwt
    });
  }
}

// Export singleton instance
export const unifiedTMSClient = UnifiedTMSClient.getInstance();