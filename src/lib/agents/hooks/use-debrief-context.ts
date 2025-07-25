import { AgentContext } from '../types';

/**
 * Hook to inject debrief-specific context into agent processing
 */
export function useDebriefContext(context: AgentContext): AgentContext {
  // Extract debrief-specific metadata
  const { reportType, subscriptionId, visibleSection } = context as any;

  // Build enhanced context for DebriefAgent
  const enhancedContext: AgentContext = {
    ...context,
    metadata: {
      ...context.metadata,
      reportType: reportType || 'TMP',
      subscriptionId: subscriptionId || context.metadata?.subscriptionId,
      visibleSection: visibleSection || 'overview',
      isDebriefMode: true,
      // Add context about what the user is looking at
      userContext: `The user is viewing their ${reportType || 'TMP'} report${
        visibleSection && visibleSection !== 'overview' 
          ? `, specifically the ${visibleSection} section` 
          : ''
      }.`
    }
  };

  return enhancedContext;
}

/**
 * Format debrief context for system message
 */
export function formatDebriefContext(context: AgentContext): string {
  const metadata = context.metadata || {};
  const { reportType, subscriptionId, visibleSection } = metadata;

  let contextString = `You are helping the user understand their ${reportType || 'assessment'} report.`;
  
  if (subscriptionId) {
    contextString += ` The report is from subscription ${subscriptionId}.`;
  }
  
  if (visibleSection && visibleSection !== 'overview') {
    contextString += ` The user is currently viewing the ${visibleSection} section of the report.`;
  }

  contextString += ` Provide insights and answer questions about their results. Be specific and reference the actual data from their report when possible.`;

  return contextString;
}