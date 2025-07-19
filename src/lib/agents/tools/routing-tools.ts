import { AgentTool, AgentContext, ToolResult } from '../types';
import { AgentRegistry } from '../registry/AgentRegistry';
import { RoutingService } from '../routing/RoutingService';
import { AgentConfigLoader } from '../config/agent-config-loader';

// Initialize services (these would normally be injected)
const agentRegistry = new AgentRegistry();
const routingService = new RoutingService(agentRegistry, AgentConfigLoader);

export const routingTools: AgentTool[] = [
  {
    name: 'analyze_user_intent',
    description: 'Analyze user message to determine intent and appropriate agent for routing',
    parameters: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'The user message to analyze'
        },
        context: {
          type: 'object',
          description: 'Current user context',
          properties: {
            journeyPhase: {
              type: 'string',
              description: 'Current journey phase'
            },
            currentAgent: {
              type: 'string',
              description: 'Current active agent'
            },
            teamId: {
              type: 'string',
              description: 'Team ID if available'
            }
          }
        }
      },
      required: ['message']
    },
    execute: async (params: any, context: AgentContext): Promise<ToolResult> => {
      try {
        // Create a minimal agent context for routing
        const agentContext = {
          conversationId: 'temp-routing',
          teamId: params.context?.teamId || '',
          managerId: '',
          currentAgent: params.context?.currentAgent || 'OrchestratorAgent',
          transformationPhase: context.transformationPhase || 'discovery',
          messageHistory: [],
          metadata: {
            journeyPhase: params.context?.journeyPhase
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const routingDecision = await routingService.routeMessage(params.message, agentContext);
        
        return {
          success: true,
          output: {
            decision: routingDecision
          }
        };
      } catch (error) {
        console.error('Error in analyze_user_intent:', error);
        return {
          success: false,
          output: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  },
  
  {
    name: 'get_agent_capabilities',
    description: 'Retrieve capabilities of all available agents for routing decisions',
    parameters: {
      type: 'object',
      properties: {
        includePrerequisites: {
          type: 'boolean',
          description: 'Include prerequisite information'
        }
      }
    },
    execute: async (params: any, context: AgentContext): Promise<ToolResult> => {
      try {
        const capabilities = await agentRegistry.loadCapabilitiesFromConfigs();
        
        const capabilityList = Array.from(capabilities.values()).map(cap => ({
          name: cap.name,
          description: cap.description,
          examples: cap.examples,
          keywords: cap.keywords,
          prerequisites: params.includePrerequisites !== false ? cap.prerequisites : undefined,
          relevantPhases: cap.relevantPhases
        }));
        
        return {
          success: true,
          output: {
            capabilities: capabilityList
          }
        };
      } catch (error) {
        console.error('Error in get_agent_capabilities:', error);
        return {
          success: false,
          output: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  },
  
  {
    name: 'check_user_journey_status',
    description: 'Check user journey phase and progress for routing context',
    parameters: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User or manager ID'
        },
        teamId: {
          type: 'string',
          description: 'Team ID if available'
        }
      },
      required: ['userId']
    },
    execute: async (params: any, context: AgentContext): Promise<ToolResult> => {
      try {
        // This would normally query the database for user journey status
        // For now, return a mock response
        return {
          success: true,
          output: {
            journey: {
              userId: params.userId,
              teamId: params.teamId,
              phase: 'ONBOARDING', // Would be fetched from DB
              status: 'ACTIVE',
              completedSteps: [],
              currentAgent: 'OnboardingAgent'
            }
          }
        };
      } catch (error) {
        console.error('Error in check_user_journey_status:', error);
        return {
          success: false,
          output: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  },
  
  {
    name: 'check_agent_prerequisites',
    description: 'Check if a specific agent\'s prerequisites are met for a user',
    parameters: {
      type: 'object',
      properties: {
        agentName: {
          type: 'string',
          description: 'Name of the agent to check'
        },
        context: {
          type: 'object',
          description: 'User context to check against prerequisites',
          properties: {
            journeyPhase: {
              type: 'string'
            },
            teamId: {
              type: 'string'
            },
            journeyStatus: {
              type: 'string'
            }
          }
        }
      },
      required: ['agentName']
    },
    execute: async (params: any, context: AgentContext): Promise<ToolResult> => {
      try {
        const agentContext = {
          conversationId: 'temp-prereq-check',
          teamId: params.context?.teamId || '',
          managerId: '',
          currentAgent: 'OrchestratorAgent',
          transformationPhase: context.transformationPhase || 'discovery',
          messageHistory: [],
          metadata: {
            journeyPhase: params.context?.journeyPhase,
            journeyStatus: params.context?.journeyStatus
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const meetsPrerequisites = agentRegistry.checkPrerequisites(params.agentName, agentContext);
        const capability = await agentRegistry.getCapabilityByAgent(params.agentName);
        
        return {
          success: true,
          output: {
            result: {
              agentName: params.agentName,
              meetsPrerequisites,
              prerequisites: capability?.prerequisites || [],
              reason: meetsPrerequisites 
                ? 'All prerequisites are met' 
                : `Missing prerequisites: ${capability?.prerequisites?.join(', ') || 'unknown'}`
            }
          }
        };
      } catch (error) {
        console.error('Error in check_agent_prerequisites:', error);
        return {
          success: false,
          output: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  }
];