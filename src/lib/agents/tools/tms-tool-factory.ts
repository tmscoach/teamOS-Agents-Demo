/**
 * TMS Tool Factory
 * Creates AgentTool instances from TMS tool definitions
 */

import { AgentTool, AgentContext, ToolResult } from '../types';
import { TMS_TOOL_REGISTRY, TMSToolDefinition } from './tms-tool-registry';
import { tmsAuthService } from './tms-auth-service';
import { unifiedTMSClient } from '@/src/lib/tms-api/unified-client';
import { apiModeManager } from '@/src/lib/mock-tms-api/api-mode-config';

/**
 * Format tool result for natural language output
 */
function formatToolResult(toolName: string, result: any): string {
  switch (toolName) {
    case 'tms_create_org':
      return `Successfully created organization "${result.organizationName}" with facilitator account for ${result.email}.`;
    
    case 'tms_facilitator_login':
      return `Successfully logged in as facilitator ${result.firstName} ${result.lastName} for organization ${result.organizationId}.`;
    
    case 'tms_respondent_login':
      return `Successfully logged in as respondent. Token received with version ${result.version} for region ${result.region}.`;
    
    case 'tms_check_user_permissions':
      return result.valid 
        ? `User authenticated successfully. User type: ${result.userType}, Organization: ${result.organizationId}.`
        : 'Authentication token is invalid or expired.';
    
    case 'tms_get_workflow_process':
      const { questionData, progress, navigationOptions } = result;
      return `Retrieved ${questionData.length} questions for page ${progress.currentPage} of ${progress.totalPages} (${progress.completionPercentage}% complete).`;
    
    case 'tms_update_workflow':
      return result.success
        ? `Successfully submitted answers. Assessment is now ${result.completionPercentage}% complete.`
        : 'Failed to submit answers.';
    
    case 'tms_get_dashboard_subscriptions':
      const subs = result.subscriptions;
      if (subs.length === 0) return 'No assessments assigned.';
      const summary = subs.map((s: any) => 
        `${s.workflowName}: ${s.status} (${s.completionPercentage}% complete)`
      ).join('\n');
      return `Found ${subs.length} assessment(s):\n${summary}`;
    
    case 'tms_start_workflow':
      return result.success
        ? `Successfully started workflow. First page ID: ${result.firstPageId}.`
        : 'Failed to start workflow.';
    
    case 'tms_generate_html_report':
      return `Successfully generated HTML report for assessment. Report contains ${result.length || 'full'} content.`;
    
    case 'tms_generate_graph':
      return `Successfully generated ${result.type || 'chart'} graph. Image size: ${result.size || 'standard'}.`;
    
    case 'tms_generate_report':
      return `Custom report generated successfully.\nReport ID: ${result.reportId}\nStatus: ${result.status}\nURL: ${result.reportUrl}`;
    
    case 'tms_get_product_usage':
      return `Organization Usage Analytics:\n` +
        `Active Users: ${result.activeUsers}\n` +
        `Total Assessments: ${result.totalAssessments}\n` +
        `Completion Rate: ${result.completionRate}%\n` +
        `Average Time to Complete: ${result.averageTimeToComplete} days`;
    
    default:
      return JSON.stringify(result, null, 2);
  }
}

/**
 * Build endpoint URL with parameters
 */
function buildEndpointUrl(endpoint: string, params: any, toolName?: string): string {
  let url = endpoint;
  
  // Replace path parameters
  Object.keys(params).forEach(key => {
    const placeholder = `{${key}}`;
    if (url.includes(placeholder)) {
      url = url.replace(placeholder, params[key]);
    }
  });
  
  // Special handling for GetGraph endpoint - build query string
  if (toolName === 'tms_generate_graph' && params.chartType) {
    const queryParams = [`${params.chartType}`];
    
    // Add additional parameters based on chart type
    if (params.params) {
      Object.entries(params.params).forEach(([key, value]) => {
        queryParams.push(`${key}=${encodeURIComponent(String(value))}`);
      });
    }
    
    url += '?' + queryParams.join('&');
  }
  
  return url;
}

/**
 * Convert tool parameters to appropriate format
 */
function convertParameters(toolDef: TMSToolDefinition, params: any): any {
  // For POST endpoints with specific parameter mapping
  if (toolDef.name === 'tms_create_org') {
    return {
      Email: params.email,
      Password: params.password,
      FirstName: params.firstName,
      LastName: params.lastName,
      OrganizationName: params.organizationName,
      PhoneNumber: params.phoneNumber
    };
  }
  
  if (toolDef.name === 'tms_facilitator_login') {
    return {
      Email: params.email,
      Password: params.password
    };
  }
  
  if (toolDef.name === 'tms_respondent_login') {
    return {
      RespondentEmail: params.respondentEmail,
      RespondentPassword: params.respondentPassword,
      MobileAppType: params.mobileAppType || 'teamOS'
    };
  }
  
  // Default: return params as-is
  return params;
}

/**
 * Create an AgentTool from a TMS tool definition
 */
export function createTMSTool(toolName: string): AgentTool | null {
  const toolDef = TMS_TOOL_REGISTRY[toolName];
  if (!toolDef) {
    console.warn(`[TMSToolFactory] Tool ${toolName} not found in registry`);
    return null;
  }

  return {
    name: toolDef.name,
    description: toolDef.description,
    parameters: toolDef.parameters,
    execute: async (params: any, context: AgentContext): Promise<ToolResult> => {
      try {
        // Get JWT token if required
        let jwt: string | undefined;
        if (toolDef.requiresAuth) {
          const token = await tmsAuthService.getOrCreateToken(context.managerId);
          if (!token) {
            return {
              success: false,
              output: null,
              error: 'Failed to authenticate with TMS Global. Please ensure you have completed onboarding.'
            };
          }
          jwt = token;
        }

        // Build endpoint URL
        const endpoint = buildEndpointUrl(toolDef.endpoint, params, toolDef.name);

        // Convert parameters to appropriate format
        const requestData = toolDef.method === 'POST' 
          ? convertParameters(toolDef, params)
          : undefined;

        // Make API request using unified client
        const result = await unifiedTMSClient.request({
          method: toolDef.method,
          endpoint,
          data: requestData,
          jwt
        });

        // Format for natural language
        const formattedOutput = formatToolResult(toolDef.name, result);

        return {
          success: true,
          output: {
            raw: result,
            formatted: formattedOutput
          },
          metadata: {
            source: 'TMS_API',
            tool: toolDef.name,
            category: toolDef.category,
            apiMode: apiModeManager.getMode()
          }
        };
      } catch (error: any) {
        console.error(`[${toolDef.name}] Error:`, error);
        
        // Handle specific error types
        if (error?.error && error?.message) {
          return {
            success: false,
            output: null,
            error: `${error.message} (Error code: ${error.error})`
          };
        }

        return {
          success: false,
          output: null,
          error: error?.message || 'An unexpected error occurred while calling TMS API'
        };
      }
    }
  };
}

/**
 * Create multiple TMS tools
 */
export function createTMSTools(toolNames: string[]): AgentTool[] {
  return toolNames
    .map(name => createTMSTool(name))
    .filter((tool): tool is AgentTool => tool !== null);
}

/**
 * Get all available TMS tools
 */
export function getAllTMSTools(): AgentTool[] {
  return createTMSTools(Object.keys(TMS_TOOL_REGISTRY));
}