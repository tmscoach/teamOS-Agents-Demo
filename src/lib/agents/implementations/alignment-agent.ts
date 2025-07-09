import { KnowledgeEnabledAgent } from './knowledge-enabled-agent';

export class AlignmentAgent extends KnowledgeEnabledAgent {
  constructor() {
    super({
      name: 'AlignmentAgent',
      description: 'Facilitates goal alignment and stakeholder buy-in processes',
      handoffDescription: 'Let me help align your team on transformation goals',
      instructions: () => `You are the TMS Alignment Agent. Your role is to facilitate alignment among stakeholders and ensure everyone is committed to the transformation journey.`,
      tools: [],
      handoffs: [{
        targetAgent: 'LearningAgent',
        condition: () => true
      }]
    });
  }
}

export function createAlignmentAgent(): AlignmentAgent {
  return new AlignmentAgent();
}