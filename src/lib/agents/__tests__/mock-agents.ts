/**
 * Mock agent implementations for testing and demonstration
 */

import { OpenAIAgent, OpenAIAgentConfig } from '../implementations/base-openai-agent';
import { AgentContext, AgentTool } from '../types';

/**
 * Mock Onboarding Agent
 * Demonstrates basic agent implementation with tools and handoffs
 */
export class MockOnboardingAgent extends OpenAIAgent {
  constructor() {
    const config: OpenAIAgentConfig = {
      name: 'OnboardingAgent',
      description: 'Engages team managers in the TMS transformation journey',
      handoffDescription: 'Hand off to this agent to start the team transformation process',
      instructions: (context: AgentContext) => `
        You are the Onboarding Agent for the Team Management Systems (TMS) transformation platform.
        
        Your role is to:
        1. Welcome managers to the TMS transformation journey
        2. Explain the benefits of team transformation
        3. Gather initial information about their team
        4. Determine the appropriate assessment tool to start with
        5. Hand off to the Profile Analysis Agent when ready
        
        Current team: ${context.teamId}
        Manager: ${context.managerId}
        Phase: ${context.transformationPhase}
        
        Be friendly, professional, and encouraging. Help managers understand the value
        of the transformation journey for their team.
      `,
      tools: [
        {
          name: 'collect_team_info',
          description: 'Collect basic team information',
          parameters: {
            type: 'object',
            properties: {
              teamSize: {
                type: 'number',
                description: 'Number of team members',
              },
              teamType: {
                type: 'string',
                description: 'Type of team (e.g., engineering, sales, support)',
              },
              challenges: {
                type: 'array',
                items: { type: 'string' },
                description: 'Main challenges the team is facing',
              },
            },
            required: ['teamSize', 'teamType'],
          },
          execute: async (params, context) => {
            // Mock implementation - in real app, this would save to database
            return {
              success: true,
              output: {
                message: 'Team information collected successfully',
                data: params,
              },
              metadata: {
                timestamp: new Date().toISOString(),
              },
            };
          },
        },
        {
          name: 'recommend_assessment',
          description: 'Recommend the most appropriate assessment tool',
          parameters: {
            type: 'object',
            properties: {
              teamInfo: {
                type: 'object',
                description: 'Team information to base recommendation on',
              },
            },
            required: ['teamInfo'],
          },
          execute: async (params, context) => {
            // Mock logic for assessment recommendation
            const { teamSize, teamType } = params.teamInfo;
            
            let recommendation = 'TMP'; // Default
            
            if (teamSize > 20) {
              recommendation = 'QO2'; // For larger teams
            } else if (teamType === 'remote' || teamType === 'distributed') {
              recommendation = 'WoWV'; // For virtual teams
            }

            return {
              success: true,
              output: {
                recommendation,
                reason: `Based on your team size of ${teamSize} and type ${teamType}`,
                nextSteps: 'Ready to begin the assessment process',
              },
            };
          },
        },
      ],
      handoffs: [
        {
          targetAgent: 'ProfileAnalysisAgent',
          condition: (context) => {
            // Only handoff if we have team info
            return context.metadata.teamInfoCollected === true;
          },
        },
      ],
      inputGuardrails: [
        {
          name: 'greeting-check',
          description: 'Ensure polite interaction',
          validate: async (input, context) => {
            const lowercaseInput = input.toLowerCase();
            const hasProfanity = ['damn', 'hell'].some(word => lowercaseInput.includes(word));
            
            return {
              passed: !hasProfanity,
              reason: hasProfanity ? 'Please maintain professional communication' : undefined,
            };
          },
        },
      ],
      llmConfig: {
        model: 'gpt-4-turbo-preview',
        temperature: 0.7,
        maxTokens: 1000,
      },
    };

    super(config);
  }
}

/**
 * Mock Profile Analysis Agent
 * Demonstrates agent with complex tool usage
 */
export class MockProfileAnalysisAgent extends OpenAIAgent {
  constructor() {
    const config: OpenAIAgentConfig = {
      name: 'ProfileAnalysisAgent',
      description: 'Analyzes team and individual profiles using TMS assessments',
      handoffDescription: 'Hand off to this agent to analyze team profiles and assessments',
      instructions: `
        You are the Profile Analysis Agent. Your role is to:
        1. Guide managers through TMS assessments (TMP, QO2, WoWV, LLP)
        2. Analyze assessment results
        3. Identify team strengths and areas for improvement
        4. Provide actionable insights
        5. Hand off to appropriate specialist agents based on findings
        
        Use the assessment tools to gather data and provide evidence-based recommendations.
      `,
      tools: [
        {
          name: 'run_assessment',
          description: 'Run a specific TMS assessment',
          parameters: {
            type: 'object',
            properties: {
              assessmentType: {
                type: 'string',
                enum: ['TMP', 'QO2', 'WoWV', 'LLP'],
                description: 'Type of assessment to run',
              },
              teamId: {
                type: 'string',
                description: 'ID of the team to assess',
              },
            },
            required: ['assessmentType', 'teamId'],
          },
          execute: async (params, context) => {
            // Mock assessment execution
            const mockResults = {
              TMP: { maturityLevel: 3.5, strengths: ['communication'], gaps: ['planning'] },
              QO2: { effectiveness: 0.75, topFactors: ['clarity', 'alignment'] },
              WoWV: { virtualReadiness: 4.2, bestPractices: ['async-communication'] },
              LLP: { leadershipStyle: 'collaborative', developmentAreas: ['delegation'] },
            };

            return {
              success: true,
              output: {
                assessmentType: params.assessmentType,
                results: mockResults[params.assessmentType as keyof typeof mockResults] || {},
                status: 'completed',
                timestamp: new Date().toISOString(),
              },
            };
          },
        },
        {
          name: 'generate_insights',
          description: 'Generate insights from assessment results',
          parameters: {
            type: 'object',
            properties: {
              assessmentData: {
                type: 'object',
                description: 'Assessment results to analyze',
              },
            },
            required: ['assessmentData'],
          },
          execute: async (params, context) => {
            return {
              success: true,
              output: {
                insights: [
                  'Team shows strong communication patterns',
                  'Planning processes need structured improvement',
                  'Virtual collaboration tools are well-adopted',
                ],
                recommendations: [
                  'Implement weekly planning sessions',
                  'Introduce OKR framework for goal alignment',
                  'Schedule monthly retrospectives',
                ],
                priority: 'medium',
              },
            };
          },
        },
      ],
      handoffs: [
        {
          targetAgent: 'TeamDevelopmentAgent',
          condition: (context) => context.assessmentResults !== undefined,
        },
        {
          targetAgent: 'ReportingAgent',
        },
        {
          targetAgent: 'OnboardingAgent', // Can go back if needed
        },
      ],
      llmConfig: {
        model: 'gpt-4-turbo-preview',
        temperature: 0.5, // Lower temperature for more consistent analysis
        maxTokens: 2000,
      },
    };

    super(config);
  }
}

/**
 * Simple Echo Agent for basic testing
 */
export class MockEchoAgent extends OpenAIAgent {
  constructor() {
    const config: OpenAIAgentConfig = {
      name: 'EchoAgent',
      description: 'Simple agent that echoes messages (for testing)',
      handoffDescription: 'Test agent that echoes messages',
      instructions: 'Simply echo back what the user says, prefixed with "Echo: "',
      llmConfig: {
        model: 'gpt-3.5-turbo', // Use cheaper model for simple echo
        temperature: 0,
        maxTokens: 100,
      },
    };

    super(config);
  }
}

/**
 * Create and register all mock agents with a router
 */
export function createMockAgentSystem() {
  const { AgentRouter } = require('../router');
  
  const router = new AgentRouter();
  
  // Register all mock agents
  router.registerAgent(new MockOnboardingAgent());
  router.registerAgent(new MockProfileAnalysisAgent());
  router.registerAgent(new MockEchoAgent());
  
  return router;
}

