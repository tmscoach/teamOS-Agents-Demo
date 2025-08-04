import { AgentTool, ToolResult, AgentContext } from '../types';

/**
 * Tool for navigating to specific sections in the report
 */
export function createNavigateToSectionTool(): AgentTool {
  return {
    name: 'navigate_to_section',
    description: 'Navigate to a specific section in the report viewer. Use this when the user wants to see a particular part of their report.',
    parameters: {
      type: 'object',
      properties: {
        section: {
          type: 'string',
          description: 'Section ID or name to navigate to (e.g., "major_role", "work_preferences", "sector_1")'
        }
      },
      required: ['section']
    },
    execute: async (params: any): Promise<ToolResult> => {
      const { section } = params;
      
      // Return a special action tag that the UI can interpret
      return {
        success: true,
        output: `[REPORT_ACTION:SCROLL_TO:${section}]Navigating to the ${section.replace(/_/g, ' ')} section of your report.`
      };
    }
  };
}

/**
 * Tool for highlighting specific scores or elements in the report
 */
export function createHighlightScoreTool(): AgentTool {
  return {
    name: 'highlight_score',
    description: 'Highlight a specific score or element in the report to draw attention to it.',
    parameters: {
      type: 'object',
      properties: {
        element: {
          type: 'string',
          description: 'Element to highlight (e.g., "major_role_score", "sector_1_percentage", "icbs_scores")'
        },
        description: {
          type: 'string',
          description: 'Brief description of what is being highlighted'
        }
      },
      required: ['element']
    },
    execute: async (params: any): Promise<ToolResult> => {
      const { element, description } = params;
      
      return {
        success: true,
        output: `[REPORT_ACTION:HIGHLIGHT:${element}]Highlighting ${description || element.replace(/_/g, ' ')} in your report.`
      };
    }
  };
}

/**
 * Tool for summarizing key findings from the report
 */
export function createSummarizeKeyFindingsTool(): AgentTool {
  return {
    name: 'summarize_key_findings',
    description: 'Provide a structured summary of the key findings from the user\'s report.',
    parameters: {
      type: 'object',
      properties: {
        reportType: {
          type: 'string',
          description: 'Type of report (TMP, Team Signals, QO2)'
        }
      },
      required: ['reportType']
    },
    execute: async (params: any, context: AgentContext): Promise<ToolResult> => {
      const { reportType } = params;
      
      // This would normally search the report and extract key findings
      // For now, return a structured format that the agent can fill in
      
      const templates: Record<string, string> = {
        TMP: `Key Findings from your Team Management Profile:
1. **Major Role**: [Agent will fill based on report search]
2. **Related Roles**: [Agent will fill based on report search]
3. **Work Preferences (ICBS)**: [Agent will fill based on report search]
4. **Team Implications**: [Agent will provide insights]
5. **Development Areas**: [Agent will identify from report]`,
        
        'Team Signals': `Key Findings from your Team Signals Assessment:
1. **Overall Team Health**: [Agent will assess from colors]
2. **Strongest Sectors**: [Agent will identify green sectors]
3. **Development Areas**: [Agent will identify red/amber sectors]
4. **Priority Actions**: [Agent will suggest based on scores]
5. **Team Dynamics**: [Agent will interpret patterns]`,
        
        QO2: `Key Findings from your Quadrant of Opportunity:
1. **Current Quadrant**: [Agent will identify from report]
2. **Organizational Strengths**: [Agent will extract from report]
3. **Improvement Opportunities**: [Agent will identify from scores]
4. **Strategic Recommendations**: [Agent will provide based on analysis]
5. **Next Steps**: [Agent will suggest actions]`
      };
      
      return {
        success: true,
        output: templates[reportType] || 'Please search the report for key findings and provide a structured summary.'
      };
    }
  };
}

/**
 * Tool for generating action items based on report results
 */
export function createGenerateActionItemsTool(): AgentTool {
  return {
    name: 'generate_action_items',
    description: 'Generate specific, actionable next steps based on the assessment results.',
    parameters: {
      type: 'object',
      properties: {
        focus_area: {
          type: 'string',
          description: 'Specific area to focus on (e.g., "communication", "team_alignment", "leadership_development")'
        },
        timeframe: {
          type: 'string',
          description: 'Timeframe for actions (immediate, short-term, long-term)',
          enum: ['immediate', 'short-term', 'long-term']
        }
      },
      required: ['focus_area']
    },
    execute: async (params: any): Promise<ToolResult> => {
      const { focus_area, timeframe = 'short-term' } = params;
      
      const timeframeLabels = {
        immediate: 'This Week',
        'short-term': 'Next 30 Days',
        'long-term': 'Next Quarter'
      };
      
      return {
        success: true,
        output: `[REPORT_ACTION:SHOW_ACTIONS]
Action Items for ${focus_area.replace(/_/g, ' ')} (${timeframeLabels[timeframe as keyof typeof timeframeLabels]}):

The agent will now search your report and generate specific action items based on your assessment results and the ${focus_area} focus area.`
      };
    }
  };
}

/**
 * Tool for comparing scores to benchmarks or ideals
 */
export function createCompareScoresTool(): AgentTool {
  return {
    name: 'compare_scores',
    description: 'Compare the user\'s scores to benchmarks, team averages, or ideal profiles.',
    parameters: {
      type: 'object',
      properties: {
        comparison_type: {
          type: 'string',
          description: 'Type of comparison to make',
          enum: ['benchmark', 'team_average', 'ideal_profile', 'previous_assessment']
        },
        section: {
          type: 'string',
          description: 'Specific section or score to compare (optional)'
        }
      },
      required: ['comparison_type']
    },
    execute: async (params: any): Promise<ToolResult> => {
      const { comparison_type, section } = params;
      
      return {
        success: true,
        output: `[REPORT_ACTION:SHOW_COMPARISON]
Preparing ${comparison_type.replace(/_/g, ' ')} comparison${section ? ` for ${section}` : ''}...

The agent will analyze your scores and provide insights on how they compare.`
      };
    }
  };
}

/**
 * Export all debrief-specific tools
 */
export function getDebriefReportTools(): AgentTool[] {
  return [
    createNavigateToSectionTool(),
    createHighlightScoreTool(),
    createSummarizeKeyFindingsTool(),
    createGenerateActionItemsTool(),
    createCompareScoresTool()
  ];
}