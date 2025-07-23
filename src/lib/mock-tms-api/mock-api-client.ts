/**
 * Mock TMS API Client
 * Simulates the TMS Global API with JWT authentication
 */

import { TMSErrorResponse, TMSJWTClaims } from './types';

export class MockTMSAPIClient {
  private baseUrl: string;
  private mockDelay: number = 100; // Simulate network delay

  constructor(baseUrl: string = 'https://localhost:8001') {
    this.baseUrl = baseUrl;
  }

  /**
   * Generate a mock JWT token
   */
  generateJWT(claims: Partial<TMSJWTClaims>): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      ...claims,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
    }));
    const signature = btoa('mock-signature');
    return `${header}.${payload}.${signature}`;
  }

  /**
   * Decode a JWT token (mock implementation)
   */
  decodeJWT(token: string): TMSJWTClaims | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = JSON.parse(atob(parts[1]));
      return payload as TMSJWTClaims;
    } catch (error) {
      return null;
    }
  }

  /**
   * Validate JWT token expiration
   */
  isTokenExpired(token: string): boolean {
    const claims = this.decodeJWT(token);
    if (!claims) return true;
    
    const now = Math.floor(Date.now() / 1000);
    return claims.exp < now;
  }

  /**
   * Simulate API delay
   */
  private async simulateDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, this.mockDelay));
  }

  /**
   * Make a mock API request
   */
  async request<T>(options: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    endpoint: string;
    data?: any;
    jwt?: string;
    headers?: Record<string, string>;
  }): Promise<T> {
    await this.simulateDelay();

    // Check JWT if required
    if (options.jwt && this.isTokenExpired(options.jwt)) {
      throw this.createError('AUTH_TOKEN_EXPIRED', 'Authentication token has expired');
    }

    // Route to appropriate mock handler
    const handler = this.getHandler(options.method, options.endpoint);
    if (!handler) {
      throw this.createError('ENDPOINT_NOT_FOUND', `Endpoint ${options.method} ${options.endpoint} not found`);
    }

    try {
      return await handler(options);
    } catch (error) {
      console.error('Mock API error:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
      if (error && typeof error === 'object' && 'error' in error) {
        throw error; // Already formatted error
      }
      throw this.createError('INTERNAL_ERROR', 'An internal error occurred', error);
    }
  }

  /**
   * Create a standardized error response
   */
  private createError(code: string, message: string, details?: any): TMSErrorResponse {
    return {
      error: code,
      message,
      details
    };
  }

  /**
   * Get the appropriate handler for an endpoint
   */
  private getHandler(method: string, endpoint: string): Function | null {
    // Strip query string for path matching
    const [path] = endpoint.split('?');
    
    // Import handlers dynamically to avoid circular dependencies
    const handlers = {
      'POST:/api/v1/auth/signup': () => import('./endpoints/auth').then(m => m.signup),
      'POST:/api/v1/auth/login': () => import('./endpoints/auth').then(m => m.login),
      'POST:/Authenticate': () => import('./endpoints/auth').then(m => m.respondentLogin),
      'GET:/api/v1/team-os/auth/validate': () => import('./endpoints/auth').then(m => m.validate),
      'POST:/api/v1/auth/create-respondent': () => import('./endpoints/auth').then(m => m.createRespondentPasswordless),
      'POST:/api/v1/auth/create-facilitator': () => import('./endpoints/auth').then(m => m.createFacilitatorPasswordless),
      'POST:/api/v1/auth/token-exchange': () => import('./endpoints/auth').then(m => m.tokenExchange),
      'GET:/Workflow/Process/*': () => import('./endpoints/workflows').then(m => m.getWorkflowProcess),
      'POST:/Workflow/Update': () => import('./endpoints/workflows').then(m => m.updateWorkflow),
      'GET:/Workflow/Start/*': () => import('./endpoints/workflows').then(m => m.startWorkflow),
      'POST:/Question/GetActions': () => import('./endpoints/questions').then(m => m.getQuestionActions),
      'GET:/Question/GetQuestionIdsThatHaveActions/*': () => import('./endpoints/questions').then(m => m.getQuestionIdsWithActions),
      'GET:/Respondent/GetDashboardSubscription': () => import('./endpoints/subscriptions').then(m => m.getDashboardSubscriptions),
      'POST:/api/v1/subscriptions/assign': () => import('./endpoints/subscriptions').then(m => m.assignSubscription),
      'GET:/Subscription/GetHTMLView/*': () => import('./endpoints/reports').then(m => m.getHTMLReport),
      'GET:/GetGraph': () => import('./endpoints/reports').then(m => m.generateGraph),
      'POST:/api/v1/tms/generate-html-report': () => import('./endpoints/reports').then(m => m.generateHTMLReport),
      'POST:/api/v1/tms/generate-graph': () => import('./endpoints/reports').then(m => m.generateGraphAPI),
    };

    // Find matching handler
    for (const [pattern, handlerLoader] of Object.entries(handlers)) {
      const [handlerMethod, handlerPath] = pattern.split(':');
      if (handlerMethod !== method) continue;

      // Check if pattern matches path (without query string)
      if (handlerPath.includes('*')) {
        const regex = new RegExp('^' + handlerPath.replace(/\*/g, '.*') + '$');
        if (regex.test(path)) {
          return async (options: any) => {
            const handler = await handlerLoader();
            return handler(options);
          };
        }
      } else if (handlerPath === path) {
        return async (options: any) => {
          const handler = await handlerLoader();
          return handler(options);
        };
      }
    }

    return null;
  }

  /**
   * Set mock delay for testing
   */
  setMockDelay(delay: number) {
    this.mockDelay = delay;
  }
}

// Export singleton instance
export const mockTMSClient = new MockTMSAPIClient();