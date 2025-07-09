import { KnowledgeEnabledAgent } from './knowledge-enabled-agent';

export class LearningAgent extends KnowledgeEnabledAgent {
  constructor() {
    super({
      name: 'LearningAgent',
      description: 'Manages learning paths and educational resources for team transformation',
      handoffDescription: 'Let me guide your team\'s learning journey',
      instructions: () => `You are the TMS Learning Agent. Your role is to design and facilitate learning experiences that support team transformation.`,
      tools: [],
      handoffs: [{
        targetAgent: 'NudgeAgent',
        condition: () => true
      }]
    });
  }
}

export function createLearningAgent(): LearningAgent {
  return new LearningAgent();
}