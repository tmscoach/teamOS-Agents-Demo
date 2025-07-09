import { KnowledgeEnabledAgent } from './knowledge-enabled-agent';
import { AgentContext, AgentResponse } from '../types';

export enum RecognitionState {
  ACHIEVEMENT_IDENTIFICATION = "achievement_identification",
  RECOGNITION_PLANNING = "recognition_planning",
  CELEBRATION_DESIGN = "celebration_design",
  RECOGNITION_DELIVERY = "recognition_delivery",
  IMPACT_ASSESSMENT = "impact_assessment",
  CULTURE_REINFORCEMENT = "culture_reinforcement"
}

export interface RecognitionMetadata {
  state: RecognitionState;
  recognitionData: {
    achievements: Array<{ 
      type: string; 
      description: string; 
      contributors: string[]; 
      impact: string 
    }>;
    recognitionPlans: Array<{ 
      achievement: string; 
      method: string; 
      timing: string 
    }>;
    celebrations: Array<{ 
      event: string; 
      participants: string[]; 
      date: string 
    }>;
    recognitions: Array<{ 
      recipient: string; 
      type: string; 
      deliveredAt: string; 
      response: string 
    }>;
    cultureMetrics: Record<string, any>;
  };
  recognitionsSent: number;
  engagementScore: number;
}

export class RecognitionAgent extends KnowledgeEnabledAgent {
  private static readonly STATE_INSTRUCTIONS: Record<RecognitionState, string> = {
    [RecognitionState.ACHIEVEMENT_IDENTIFICATION]: `
      Identify achievements to recognize:
      - Monitor team accomplishments
      - Identify individual contributions
      - Note milestone achievements
      - Recognize behavior changes
    `,
    [RecognitionState.RECOGNITION_PLANNING]: `
      Plan recognition approach:
      - Match recognition to achievement
      - Consider cultural preferences
      - Plan timing and format
      - Ensure inclusiveness
    `,
    [RecognitionState.CELEBRATION_DESIGN]: `
      Design celebration activities:
      - Create memorable experiences
      - Foster team connection
      - Align with team values
      - Make it meaningful
    `,
    [RecognitionState.RECOGNITION_DELIVERY]: `
      Deliver recognition effectively:
      - Be specific and genuine
      - Highlight impact
      - Share publicly when appropriate
      - Create lasting memory
    `,
    [RecognitionState.IMPACT_ASSESSMENT]: `
      Assess recognition impact:
      - Measure team morale
      - Track engagement changes
      - Gather feedback
      - Identify improvements
    `,
    [RecognitionState.CULTURE_REINFORCEMENT]: `
      Reinforce positive culture:
      - Connect to team values
      - Build recognition habits
      - Encourage peer recognition
      - Sustain momentum
    `
  };

  constructor() {
    super({
      name: 'RecognitionAgent',
      description: 'Manages team recognition and celebration of achievements',
      handoffDescription: 'Let me help celebrate your team\'s achievements',
      instructions: (context: AgentContext) => {
        const metadata = context.metadata as RecognitionMetadata;
        const state = metadata?.state || RecognitionState.ACHIEVEMENT_IDENTIFICATION;
        const baseInstructions = RecognitionAgent.STATE_INSTRUCTIONS[state];
        
        return `You are the TMS Recognition Agent. Your role is to identify, plan, and deliver meaningful recognition that reinforces positive team transformation.

Current state: ${state}

${baseInstructions}

Remember to:
- Be authentic and specific
- Celebrate both big and small wins
- Include everyone appropriately
- Connect recognition to values
- Build a culture of appreciation`;
      },
      tools: [],
      handoffs: [{
        targetAgent: 'OrchestratorAgent',
        condition: (context: AgentContext) => {
          const metadata = context.metadata as RecognitionMetadata;
          return metadata?.state === RecognitionState.CULTURE_REINFORCEMENT;
        }
      }]
    });
  }

  async processMessage(message: string, context: AgentContext): Promise<AgentResponse> {
    // Initialize metadata if not present
    if (!context.metadata.recognition) {
      context.metadata.recognition = this.initializeMetadata();
    }

    // Process message using parent class
    const response = await super.processMessage(message, context);

    // Add recognition-specific logic here
    this.updateEngagementScore(context.metadata.recognition as RecognitionMetadata);

    return response;
  }

  private initializeMetadata(): RecognitionMetadata {
    return {
      state: RecognitionState.ACHIEVEMENT_IDENTIFICATION,
      recognitionData: {
        achievements: [],
        recognitionPlans: [],
        celebrations: [],
        recognitions: [],
        cultureMetrics: {}
      },
      recognitionsSent: 0,
      engagementScore: 0
    };
  }

  private updateEngagementScore(metadata: RecognitionMetadata) {
    // Calculate engagement based on recognition activity
    const factors = [
      metadata.recognitionData.achievements.length > 0,
      metadata.recognitionData.recognitions.length > 0,
      metadata.recognitionData.celebrations.length > 0,
      metadata.recognitionsSent > 0,
      metadata.recognitionData.recognitions.some(r => r.response === 'positive')
    ];

    const score = factors.filter(Boolean).length;
    metadata.engagementScore = (score / factors.length) * 100;
  }
}

export function createRecognitionAgent(): RecognitionAgent {
  return new RecognitionAgent();
}