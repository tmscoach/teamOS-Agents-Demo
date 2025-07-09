import { KnowledgeEnabledAgent } from './knowledge-enabled-agent';
import { AgentContext, AgentResponse } from '../types';

export enum LearningState {
  NEEDS_ASSESSMENT = "needs_assessment",
  CURRICULUM_DESIGN = "curriculum_design",
  RESOURCE_SELECTION = "resource_selection",
  DELIVERY_PLANNING = "delivery_planning",
  LEARNING_FACILITATION = "learning_facilitation",
  PROGRESS_TRACKING = "progress_tracking",
  EFFECTIVENESS_EVALUATION = "effectiveness_evaluation"
}

export interface LearningMetadata {
  state: LearningState;
  learningData: {
    learningNeeds: Array<{ skill: string; priority: string; audience: string }>;
    curriculum: Array<{ module: string; duration: string; format: string }>;
    resources: Array<{ type: string; title: string; source: string }>;
    deliveryPlan: Array<{ session: string; date: string; participants: string[] }>;
    progress: Record<string, number>;
    effectiveness: Record<string, any>;
  };
  completionRate: number;
}

export class LearningAgent extends KnowledgeEnabledAgent {
  private static readonly STATE_INSTRUCTIONS: Record<LearningState, string> = {
    [LearningState.NEEDS_ASSESSMENT]: `
      Assess learning needs:
      - Identify skill gaps
      - Prioritize learning areas
      - Map to TMS competencies
      - Define learning objectives
    `,
    [LearningState.CURRICULUM_DESIGN]: `
      Design learning curriculum:
      - Create learning modules
      - Sequence content logically
      - Balance theory and practice
      - Include TMS methodologies
    `,
    [LearningState.RESOURCE_SELECTION]: `
      Select learning resources:
      - Choose appropriate materials
      - Mix learning formats
      - Ensure resource quality
      - Align with learning styles
    `,
    [LearningState.DELIVERY_PLANNING]: `
      Plan learning delivery:
      - Schedule learning sessions
      - Assign facilitators
      - Plan logistics
      - Communicate schedule
    `,
    [LearningState.LEARNING_FACILITATION]: `
      Facilitate learning experiences:
      - Guide learning activities
      - Encourage participation
      - Address questions
      - Foster application
    `,
    [LearningState.PROGRESS_TRACKING]: `
      Track learning progress:
      - Monitor participation
      - Assess comprehension
      - Track skill development
      - Identify struggling learners
    `,
    [LearningState.EFFECTIVENESS_EVALUATION]: `
      Evaluate learning effectiveness:
      - Measure learning outcomes
      - Gather feedback
      - Assess behavior change
      - Plan improvements
    `
  };

  constructor() {
    super({
      name: 'LearningAgent',
      description: 'Manages learning paths and educational resources for team transformation',
      handoffDescription: 'Let me guide your team\'s learning journey',
      instructions: (context: AgentContext) => {
        const metadata = context.metadata as LearningMetadata;
        const state = metadata?.state || LearningState.NEEDS_ASSESSMENT;
        const baseInstructions = LearningAgent.STATE_INSTRUCTIONS[state];
        
        return `You are the TMS Learning Agent. Your role is to design and facilitate learning experiences that support team transformation.

Current state: ${state}

${baseInstructions}

Remember to:
- Make learning engaging and practical
- Adapt to different learning styles
- Connect learning to real work
- Measure learning effectiveness
- Support continuous development`;
      },
      tools: [],
      handoffs: [{
        targetAgent: 'NudgeAgent',
        condition: (context: AgentContext) => {
          const metadata = context.metadata as LearningMetadata;
          return metadata?.state === LearningState.LEARNING_FACILITATION;
        }
      }]
    });
  }

  async processMessage(message: string, context: AgentContext): Promise<AgentResponse> {
    // Initialize metadata if not present
    if (!context.metadata.learning) {
      context.metadata.learning = this.initializeMetadata();
    }

    // Process message using parent class
    const response = await super.processMessage(message, context);

    // Add learning-specific logic here
    this.updateCompletionRate(context.metadata.learning as LearningMetadata);

    return response;
  }

  private initializeMetadata(): LearningMetadata {
    return {
      state: LearningState.NEEDS_ASSESSMENT,
      learningData: {
        learningNeeds: [],
        curriculum: [],
        resources: [],
        deliveryPlan: [],
        progress: {},
        effectiveness: {}
      },
      completionRate: 0
    };
  }

  private updateCompletionRate(metadata: LearningMetadata) {
    const progressValues = Object.values(metadata.learningData.progress);
    if (progressValues.length === 0) {
      metadata.completionRate = 0;
      return;
    }

    const totalProgress = progressValues.reduce((sum, progress) => sum + progress, 0);
    metadata.completionRate = totalProgress / progressValues.length;
  }
}

export function createLearningAgent(): LearningAgent {
  return new LearningAgent();
}