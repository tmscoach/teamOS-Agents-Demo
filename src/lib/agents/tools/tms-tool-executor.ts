/**
 * TMS Tool Executor
 * Provides direct execution of TMS API tools
 */

import { MockTMSAPIClient } from '@/src/lib/mock-tms-api/mock-api-client';
import { unifiedTMSClient } from '@/src/lib/tms-api/unified-client';
import { TMS_TOOL_REGISTRY } from './tms-tool-registry';

export interface ExecuteTMSToolOptions {
  tool: string;
  parameters: Record<string, any>;
  jwt?: string;
  headers?: Record<string, string>;
}

export interface ExecuteTMSToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Execute a TMS tool directly
 */
export async function executeTMSTool(options: ExecuteTMSToolOptions): Promise<ExecuteTMSToolResult> {
  const { tool, parameters, jwt, headers = {} } = options;

  try {
    // Validate tool exists
    const toolDef = TMS_TOOL_REGISTRY[tool];
    if (!toolDef) {
      return {
        success: false,
        error: `Invalid tool: ${tool}`
      };
    }

    // Build endpoint URL with path parameters
    let endpoint = toolDef.endpoint;
    const pathParams = endpoint.match(/{(\w+)}/g);
    if (pathParams) {
      pathParams.forEach(param => {
        const key = param.slice(1, -1);
        if (parameters[key]) {
          endpoint = endpoint.replace(param, parameters[key]);
        }
      });
    }

    // Separate path params from body params
    const bodyParams = { ...parameters };
    if (pathParams) {
      pathParams.forEach(param => {
        const key = param.slice(1, -1);
        delete bodyParams[key];
      });
    }

    // Convert parameters based on tool type
    let convertedParams = bodyParams;
    if (toolDef.method !== 'GET') {
      // Apply parameter conversion for specific tools
      if (tool === 'tms_create_org') {
        convertedParams = {
          Email: bodyParams.email,
          Password: bodyParams.password,
          FirstName: bodyParams.firstName,
          LastName: bodyParams.lastName,
          OrganizationName: bodyParams.organizationName,
          PhoneNumber: bodyParams.phoneNumber,
          ClerkUserId: bodyParams.clerkUserId
        };
      } else if (tool === 'tms_facilitator_login') {
        convertedParams = {
          Email: bodyParams.email,
          Password: bodyParams.password
        };
      } else if (tool === 'tms_respondent_login') {
        convertedParams = {
          RespondentEmail: bodyParams.respondentEmail,
          RespondentPassword: bodyParams.respondentPassword,
          MobileAppType: bodyParams.mobileAppType || 'teamOS'
        };
      } else if (tool === 'tms_create_respondent' || tool === 'tms_create_facilitator') {
        convertedParams = {
          email: bodyParams.email,
          firstName: bodyParams.firstName,
          lastName: bodyParams.lastName,
          organizationId: bodyParams.organizationId,
          clerkUserId: bodyParams.clerkUserId,
          userType: bodyParams.userType || (tool === 'tms_create_respondent' ? 'Respondent' : 'Facilitator'),
          respondentName: bodyParams.respondentName
        };
      } else if (tool === 'tms_token_exchange') {
        convertedParams = {
          clerkUserId: bodyParams.clerkUserId
        };
      } else if (tool === 'tms_assign_subscription') {
        convertedParams = {
          userId: bodyParams.userId,
          workflowId: bodyParams.workflowId,
          organizationId: bodyParams.organizationId
        };
      }
    }

    // Execute request using appropriate client
    let response;
    if (process.env.NEXT_PUBLIC_USE_MOCK_TMS_API === 'true') {
      // Use mock API client
      const mockApi = new MockTMSAPIClient();
      response = await mockApi.request({
        method: toolDef.method,
        endpoint,
        data: toolDef.method !== 'GET' ? convertedParams : undefined,
        jwt: toolDef.requiresAuth ? jwt : undefined,
        headers
      });
    } else {
      // Use real TMS API client
      response = await unifiedTMSClient.request({
        method: toolDef.method,
        endpoint,
        data: toolDef.method !== 'GET' ? convertedParams : undefined,
        jwt: toolDef.requiresAuth ? jwt : undefined,
        headers
      });
    }

    return {
      success: true,
      data: response
    };
  } catch (error: any) {
    console.error(`[executeTMSTool] Error executing ${tool}:`, error);
    
    // Handle specific error types
    if (error?.error && error?.message) {
      return {
        success: false,
        error: `${error.message} (Error code: ${error.error})`
      };
    }

    return {
      success: false,
      error: error?.message || 'An unexpected error occurred while calling TMS API'
    };
  }
}