import { KnowledgeEnabledAgent } from './knowledge-enabled-agent';
import { AgentContext, AgentResponse } from '../types';

export enum AlignmentState {
  STAKEHOLDER_ENGAGEMENT = "stakeholder_engagement",
  VISION_CLARIFICATION = "vision_clarification",
  GOAL_ALIGNMENT = "goal_alignment",
  STRATEGY_DEVELOPMENT = "strategy_development",
  COMMITMENT_BUILDING = "commitment_building",
  ACTION_PLANNING = "action_planning",
  KICKOFF_PREPARATION = "kickoff_preparation"
}

export interface AlignmentMetadata {
  state: AlignmentState;
  alignmentData: {
    stakeholders: Array<{ name: string; role: string; commitment: string }>;
    vision: string;
    goals: Array<{ goal: string; timeline: string; owner: string }>;
    strategy: string;
    commitments: Array<{ stakeholder: string; commitment: string }>;
    actionPlan: Array<{ action: string; owner: string; deadline: string }>;
  };
  alignmentScore: number;
}

export class AlignmentAgent extends KnowledgeEnabledAgent {
  private static readonly STATE_INSTRUCTIONS: Record<AlignmentState, string> = {
    [AlignmentState.STAKEHOLDER_ENGAGEMENT]: `
      Engage key stakeholders:
      - Identify all stakeholders
      - Understand their perspectives
      - Address concerns proactively
      - Build buy-in for transformation
    `,
    [AlignmentState.VISION_CLARIFICATION]: `
      Clarify transformation vision:
      - Define clear vision statement
      - Connect to organizational goals
      - Make vision inspiring and achievable
      - Ensure shared understanding
    `,
    [AlignmentState.GOAL_ALIGNMENT]: `
      Align on transformation goals:
      - Set SMART goals
      - Ensure goal alignment across levels
      - Define success metrics
      - Create goal ownership
    `,
    [AlignmentState.STRATEGY_DEVELOPMENT]: `
      Develop transformation strategy:
      - Create implementation approach
      - Define key initiatives
      - Plan resource allocation
      - Set milestone timeline
    `,
    [AlignmentState.COMMITMENT_BUILDING]: `
      Build stakeholder commitment:
      - Secure explicit commitments
      - Address remaining concerns
      - Create accountability structure
      - Document agreements
    `,
    [AlignmentState.ACTION_PLANNING]: `
      Create detailed action plan:
      - Break down into specific actions
      - Assign clear ownership
      - Set realistic deadlines
      - Define dependencies
    `,
    [AlignmentState.KICKOFF_PREPARATION]: `
      Prepare for transformation kickoff:
      - Plan kickoff activities
      - Prepare communication materials
      - Schedule initial activities
      - Ready for learning phase
    `
  };

  constructor() {
    super({
      name: 'AlignmentAgent',
      description: 'Facilitates goal alignment and stakeholder buy-in processes',
      handoffDescription: 'Let me help align your team on transformation goals',
      instructions: (context: AgentContext) => {
        const metadata = context.metadata as AlignmentMetadata;
        const state = metadata?.state || AlignmentState.STAKEHOLDER_ENGAGEMENT;
        const baseInstructions = AlignmentAgent.STATE_INSTRUCTIONS[state];
        
        return `You are the TMS Alignment Agent. Your role is to facilitate alignment among stakeholders and ensure everyone is committed to the transformation journey.

Current state: ${state}

${baseInstructions}

Remember to:
- Foster open dialogue
- Address concerns empathetically
- Build consensus systematically
- Create clear accountability
- Document all commitments`;
      },
      tools: [],
      handoffs: [{
        targetAgent: 'LearningAgent',
        condition: (context: AgentContext) => {
          const metadata = context.metadata as AlignmentMetadata;
          return metadata?.state === AlignmentState.KICKOFF_PREPARATION &&
                 metadata?.alignmentScore >= 80;
        }
      }]
    });
  }

  async processMessage(message: string, context: AgentContext): Promise<AgentResponse> {
    // Initialize metadata if not present
    if (!context.metadata.alignment) {
      context.metadata.alignment = this.initializeMetadata();
    }

    // Process message using parent class
    const response = await super.processMessage(message, context);

    // Add alignment-specific logic here
    this.updateAlignmentScore(context.metadata.alignment as AlignmentMetadata);

    return response;
  }

  private initializeMetadata(): AlignmentMetadata {
    return {
      state: AlignmentState.STAKEHOLDER_ENGAGEMENT,
      alignmentData: {
        stakeholders: [],
        vision: '',
        goals: [],
        strategy: '',
        commitments: [],
        actionPlan: []
      },
      alignmentScore: 0
    };
  }

  private updateAlignmentScore(metadata: AlignmentMetadata) {
    const factors = [
      metadata.alignmentData.stakeholders.length > 0,
      metadata.alignmentData.vision !== '',
      metadata.alignmentData.goals.length > 0,
      metadata.alignmentData.strategy !== '',
      metadata.alignmentData.commitments.length > 0,
      metadata.alignmentData.actionPlan.length > 0
    ];

    const score = factors.filter(Boolean).length;
    metadata.alignmentScore = (score / factors.length) * 100;
  }
}

export function createAlignmentAgent(): AlignmentAgent {
  return new AlignmentAgent();
}