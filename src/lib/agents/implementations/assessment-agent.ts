import { KnowledgeEnabledAgent } from './knowledge-enabled-agent';
import { AgentContext, AgentResponse } from '../types';

export enum AssessmentState {
  DATA_REVIEW = "data_review",
  PATTERN_ANALYSIS = "pattern_analysis",
  STRENGTH_IDENTIFICATION = "strength_identification",
  GAP_ANALYSIS = "gap_analysis",
  PRIORITY_SETTING = "priority_setting",
  RECOMMENDATION_GENERATION = "recommendation_generation",
  REPORT_PREPARATION = "report_preparation"
}

export interface AssessmentMetadata {
  state: AssessmentState;
  assessmentData: {
    dataQuality: number;
    patterns: string[];
    strengths: string[];
    gaps: string[];
    priorities: Array<{ item: string; urgency: 'high' | 'medium' | 'low' }>;
    recommendations: string[];
  };
  reportReady: boolean;
}

export class AssessmentAgent extends KnowledgeEnabledAgent {
  private static readonly STATE_INSTRUCTIONS: Record<AssessmentState, string> = {
    [AssessmentState.DATA_REVIEW]: `
      Review discovered data:
      - Validate data completeness
      - Check data quality
      - Identify missing information
      - Prepare for analysis
    `,
    [AssessmentState.PATTERN_ANALYSIS]: `
      Analyze patterns in team data:
      - Identify behavioral patterns
      - Spot recurring themes
      - Analyze team dynamics
      - Document correlations
    `,
    [AssessmentState.STRENGTH_IDENTIFICATION]: `
      Identify team strengths:
      - Recognize existing capabilities
      - Highlight successful practices
      - Document positive patterns
      - Identify leverageable assets
    `,
    [AssessmentState.GAP_ANALYSIS]: `
      Conduct gap analysis:
      - Compare current vs desired state
      - Identify capability gaps
      - Analyze resource needs
      - Document improvement areas
    `,
    [AssessmentState.PRIORITY_SETTING]: `
      Set transformation priorities:
      - Rank improvement areas
      - Consider impact vs effort
      - Align with team goals
      - Create priority matrix
    `,
    [AssessmentState.RECOMMENDATION_GENERATION]: `
      Generate recommendations:
      - Create actionable recommendations
      - Link to TMS framework
      - Suggest implementation approach
      - Define success metrics
    `,
    [AssessmentState.REPORT_PREPARATION]: `
      Prepare assessment report:
      - Summarize findings
      - Present recommendations
      - Create implementation roadmap
      - Prepare for alignment phase
    `
  };

  constructor() {
    super({
      name: 'AssessmentAgent',
      description: 'Analyzes team data and generates insights and recommendations',
      handoffDescription: 'Let me assess your team and provide insights',
      instructions: (context: AgentContext) => {
        const metadata = context.metadata as AssessmentMetadata;
        const state = metadata?.state || AssessmentState.DATA_REVIEW;
        const baseInstructions = AssessmentAgent.STATE_INSTRUCTIONS[state];
        
        return `You are the TMS Assessment Agent. Your role is to analyze team data and generate actionable insights and recommendations.

Current state: ${state}

${baseInstructions}

Remember to:
- Base all assessments on data
- Be objective and balanced
- Provide actionable insights
- Link recommendations to TMS framework
- Prepare clear, concise reports`;
      },
      tools: [],
      handoffs: [{
        targetAgent: 'AlignmentAgent',
        condition: (context: AgentContext) => {
          const metadata = context.metadata as AssessmentMetadata;
          return metadata?.state === AssessmentState.REPORT_PREPARATION &&
                 metadata?.reportReady === true;
        }
      }]
    });
  }

  async processMessage(message: string, context: AgentContext): Promise<AgentResponse> {
    // Initialize metadata if not present
    if (!context.metadata.assessment) {
      context.metadata.assessment = this.initializeMetadata();
    }

    // Process message using parent class
    const response = await super.processMessage(message, context);

    // Add assessment-specific logic here

    return response;
  }

  private initializeMetadata(): AssessmentMetadata {
    return {
      state: AssessmentState.DATA_REVIEW,
      assessmentData: {
        dataQuality: 0,
        patterns: [],
        strengths: [],
        gaps: [],
        priorities: [],
        recommendations: []
      },
      reportReady: false
    };
  }
}

export function createAssessmentAgent(): AssessmentAgent {
  return new AssessmentAgent();
}