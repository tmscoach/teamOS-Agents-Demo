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
  const { reportType, subscriptionId, visibleSection, reportSummary } = metadata;

  let contextString = `You are helping the user understand their ${reportType || 'assessment'} report.`;
  
  if (subscriptionId) {
    contextString += ` The report is from subscription ${subscriptionId}.`;
  }
  
  if (visibleSection && visibleSection !== 'overview') {
    contextString += ` The user is currently viewing the ${visibleSection} section of the report.`;
  }

  // Add report summary data if available
  if (reportSummary) {
    contextString += `\n\nReport Details:`;
    if (reportSummary.name) {
      contextString += `\n- Name: ${reportSummary.name}`;
    }
    if (reportSummary.majorRole) {
      contextString += `\n- Major Role: ${reportSummary.majorRole}`;
    }
    if (reportSummary.relatedRoles?.length > 0) {
      contextString += `\n- Related Roles: ${reportSummary.relatedRoles.join(', ')}`;
    }
    if (reportSummary.scores && Object.keys(reportSummary.scores).length > 0) {
      contextString += `\n- Scores:`;
      Object.entries(reportSummary.scores).forEach(([key, value]) => {
        contextString += `\n  - ${key}: ${value}`;
      });
    }
    
    // Add current section content if viewing a specific section
    if (visibleSection && visibleSection !== 'overview' && reportSummary.fullContent) {
      const sectionRegex = new RegExp(`## ${visibleSection}\\n([^#]+)`, 'i');
      const sectionMatch = reportSummary.fullContent.match(sectionRegex);
      if (sectionMatch) {
        contextString += `\n\nCurrent Section Content:\n${sectionMatch[1].trim().substring(0, 1000)}...`;
      }
    }
  }

  contextString += `\n\nProvide insights and answer questions about their results. Be specific and reference the actual data from their report when possible.`;
  contextString += `\n\nIMPORTANT: When asked about TMS concepts (like "E:15" which refers to Extrovert score of 15), use your knowledge base to explain these properly.`;

  return contextString;
}