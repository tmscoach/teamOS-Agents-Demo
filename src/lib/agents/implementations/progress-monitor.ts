import { KnowledgeEnabledAgent } from './knowledge-enabled-agent';
import { AgentContext, AgentResponse } from '../types';

export enum ProgressMonitorState {
  METRIC_SETUP = "metric_setup",
  DATA_COLLECTION = "data_collection",
  PROGRESS_ANALYSIS = "progress_analysis",
  TREND_IDENTIFICATION = "trend_identification",
  REPORT_GENERATION = "report_generation",
  STAKEHOLDER_COMMUNICATION = "stakeholder_communication"
}

export interface ProgressMonitorMetadata {
  state: ProgressMonitorState;
  monitoringData: {
    metrics: Array<{ name: string; type: string; target: number; current: number }>;
    dataPoints: Array<{ metric: string; value: number; timestamp: string }>;
    trends: Array<{ metric: string; trend: 'improving' | 'declining' | 'stable' }>;
    insights: string[];
    reports: Array<{ id: string; type: string; generatedAt: string }>;
  };
  overallProgress: number;
  healthScore: number;
}

export class ProgressMonitor extends KnowledgeEnabledAgent {
  private static readonly STATE_INSTRUCTIONS: Record<ProgressMonitorState, string> = {
    [ProgressMonitorState.METRIC_SETUP]: `
      Set up monitoring metrics:
      - Define key performance indicators
      - Set measurement baselines
      - Establish targets
      - Create measurement plan
    `,
    [ProgressMonitorState.DATA_COLLECTION]: `
      Collect progress data:
      - Gather metric data
      - Ensure data quality
      - Track multiple sources
      - Maintain consistency
    `,
    [ProgressMonitorState.PROGRESS_ANALYSIS]: `
      Analyze progress data:
      - Calculate progress rates
      - Compare against targets
      - Identify achievements
      - Spot delays or issues
    `,
    [ProgressMonitorState.TREND_IDENTIFICATION]: `
      Identify trends and patterns:
      - Analyze data trends
      - Predict future progress
      - Identify risk areas
      - Highlight opportunities
    `,
    [ProgressMonitorState.REPORT_GENERATION]: `
      Generate progress reports:
      - Create visual dashboards
      - Summarize key findings
      - Highlight achievements
      - Document challenges
    `,
    [ProgressMonitorState.STAKEHOLDER_COMMUNICATION]: `
      Communicate with stakeholders:
      - Share progress updates
      - Celebrate successes
      - Address concerns
      - Plan next steps
    `
  };

  constructor() {
    super({
      name: 'ProgressMonitor',
      description: 'Tracks transformation progress and reports on key metrics',
      handoffDescription: 'Let me monitor and report on your transformation progress',
      instructions: (context: AgentContext) => {
        const metadata = context.metadata as ProgressMonitorMetadata;
        const state = metadata?.state || ProgressMonitorState.METRIC_SETUP;
        const baseInstructions = ProgressMonitor.STATE_INSTRUCTIONS[state];
        
        return `You are the TMS Progress Monitor. Your role is to track transformation progress, analyze trends, and communicate insights to stakeholders.

Current state: ${state}

${baseInstructions}

Remember to:
- Maintain objective measurement
- Present data clearly
- Highlight both successes and challenges
- Provide actionable insights
- Support data-driven decisions`;
      },
      tools: [],
      handoffs: [{
        targetAgent: 'RecognitionAgent',
        condition: (context: AgentContext) => {
          const metadata = context.metadata as ProgressMonitorMetadata;
          return metadata?.overallProgress >= 75 ||
                 metadata.monitoringData.metrics.some(m => m.current >= m.target);
        }
      }]
    });
  }

  async processMessage(message: string, context: AgentContext): Promise<AgentResponse> {
    // Initialize metadata if not present
    if (!context.metadata.progressMonitor) {
      context.metadata.progressMonitor = this.initializeMetadata();
    }

    // Process message using parent class
    const response = await super.processMessage(message, context);

    // Add progress monitoring-specific logic here
    this.updateProgressScores(context.metadata.progressMonitor as ProgressMonitorMetadata);

    return response;
  }

  private initializeMetadata(): ProgressMonitorMetadata {
    return {
      state: ProgressMonitorState.METRIC_SETUP,
      monitoringData: {
        metrics: [],
        dataPoints: [],
        trends: [],
        insights: [],
        reports: []
      },
      overallProgress: 0,
      healthScore: 100
    };
  }

  private updateProgressScores(metadata: ProgressMonitorMetadata) {
    if (metadata.monitoringData.metrics.length === 0) {
      metadata.overallProgress = 0;
      return;
    }

    // Calculate overall progress
    const progressValues = metadata.monitoringData.metrics.map(m => 
      m.target > 0 ? (m.current / m.target) * 100 : 0
    );
    metadata.overallProgress = progressValues.reduce((sum, val) => sum + val, 0) / progressValues.length;

    // Calculate health score based on trends
    const decliningTrends = metadata.monitoringData.trends.filter(t => t.trend === 'declining').length;
    const totalTrends = metadata.monitoringData.trends.length;
    
    if (totalTrends > 0) {
      metadata.healthScore = 100 - (decliningTrends / totalTrends) * 50;
    }
  }
}

export function createProgressMonitor(): ProgressMonitor {
  return new ProgressMonitor();
}