import { KnowledgeEnabledAgent } from './knowledge-enabled-agent';
import { AgentContext, AgentResponse } from '../types';

export class AssessmentAgent extends KnowledgeEnabledAgent {
  constructor() {
    super({
      name: 'AssessmentAgent',
      description: 'Analyzes team data and generates insights and recommendations',
      handoffDescription: 'Let me assess your team and provide insights',
      instructions: () => `You are the TMS Assessment Agent. Your role is to analyze team data and generate actionable insights and recommendations.

Remember to:
- Base all assessments on data
- Be objective and balanced
- Provide actionable insights
- Link recommendations to TMS framework
- Prepare clear, concise reports`,
      tools: [],
      handoffs: [{
        targetAgent: 'AlignmentAgent',
        condition: () => true
      }]
    });
  }
}

export function createAssessmentAgent(): AssessmentAgent {
  return new AssessmentAgent();
}