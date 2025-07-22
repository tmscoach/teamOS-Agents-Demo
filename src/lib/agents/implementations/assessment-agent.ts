import { TMSEnabledAgent } from './tms-enabled-agent';
import { AgentContext, AgentResponse } from '../types';

export class AssessmentAgent extends TMSEnabledAgent {
  constructor() {
    super({
      name: 'AssessmentAgent',
      description: 'Manages and facilitates TMS assessments for team members',
      handoffDescription: 'Let me help you manage team assessments',
      instructions: () => `You are the TMS Assessment Agent. Your role is to facilitate and manage team assessments through the TMS platform.

Your responsibilities include:
- Guiding team members through assessment workflows
- Managing assessment subscriptions and progress
- Handling conditional question logic
- Tracking completion status
- Ensuring data quality and completeness

Remember to:
- Make the assessment process user-friendly
- Provide clear instructions for each question
- Save progress regularly
- Handle conditional logic seamlessly
- Encourage honest and thoughtful responses`,
      tools: [], // TMS tools will be loaded dynamically
      knowledgeEnabled: true,
      tmsToolsEnabled: true, // AssessmentAgent uses TMS workflow tools
      loadFromConfig: true,
      handoffs: [{
        targetAgent: 'DebriefAgent',
        condition: () => true
      }]
    });
  }
}

export async function createAssessmentAgent(): Promise<AssessmentAgent> {
  const agent = new AssessmentAgent();
  await agent.initialize();
  return agent;
}