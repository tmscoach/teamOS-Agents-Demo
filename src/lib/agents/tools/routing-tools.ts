import { z } from 'zod';
import { LangChainTool } from '../types';
import { AgentRegistry } from '../registry/AgentRegistry';
import { RoutingService } from '../routing/RoutingService';
import { AgentConfigLoader } from '../config/agent-config-loader';

// Initialize services (these would normally be injected)
const agentRegistry = new AgentRegistry();
const routingService = new RoutingService(agentRegistry, AgentConfigLoader);

export const routingTools: LangChainTool[] = [
  {
    name: 'analyze_user_intent',
    description: 'Analyze user message to determine intent and appropriate agent for routing',
    schema: z.object({
      message: z.string().describe('The user message to analyze'),
      context: z.object({
        journeyPhase: z.string().optional().describe('Current journey phase'),
        currentAgent: z.string().optional().describe('Current active agent'),
        teamId: z.string().optional().describe('Team ID if available')
      }).describe('Current user context')
    }),
    func: async ({ message, context }) => {
      try {
        // Create a minimal agent context for routing
        const agentContext = {
          conversationId: 'temp-routing',
          teamId: context.teamId || '',
          managerId: '',
          currentAgent: context.currentAgent || 'OrchestratorAgent',
          messages: [],
          metadata: {
            journeyPhase: context.journeyPhase
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const routingDecision = await routingService.routeMessage(message, agentContext);
        
        return JSON.stringify({
          success: true,
          decision: routingDecision
        });
      } catch (error) {
        console.error('Error in analyze_user_intent:', error);
        return JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  },
  
  {
    name: 'get_agent_capabilities',
    description: 'Retrieve capabilities of all available agents for routing decisions',
    schema: z.object({
      includePrerequisites: z.boolean().optional().describe('Include prerequisite information')
    }),
    func: async ({ includePrerequisites = true }) => {
      try {
        const capabilities = await agentRegistry.loadCapabilitiesFromConfigs();
        
        const capabilityList = Array.from(capabilities.values()).map(cap => ({
          name: cap.name,
          description: cap.description,
          examples: cap.examples,
          keywords: cap.keywords,
          prerequisites: includePrerequisites ? cap.prerequisites : undefined,
          relevantPhases: cap.relevantPhases
        }));
        
        return JSON.stringify({
          success: true,
          capabilities: capabilityList
        });
      } catch (error) {
        console.error('Error in get_agent_capabilities:', error);
        return JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  },
  
  {
    name: 'check_user_journey_status',
    description: 'Check user journey phase and progress for routing context',
    schema: z.object({
      userId: z.string().describe('User or manager ID'),
      teamId: z.string().optional().describe('Team ID if available')
    }),
    func: async ({ userId, teamId }) => {
      try {
        // This would normally query the database for user journey status
        // For now, return a mock response
        return JSON.stringify({
          success: true,
          journey: {
            userId,
            teamId,
            phase: 'ONBOARDING', // Would be fetched from DB
            status: 'ACTIVE',
            completedSteps: [],
            currentAgent: 'OnboardingAgent'
          }
        });
      } catch (error) {
        console.error('Error in check_user_journey_status:', error);
        return JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  },
  
  {
    name: 'check_agent_prerequisites',
    description: 'Check if a specific agent\'s prerequisites are met for a user',
    schema: z.object({
      agentName: z.string().describe('Name of the agent to check'),
      context: z.object({
        journeyPhase: z.string().optional(),
        teamId: z.string().optional(),
        journeyStatus: z.string().optional()
      }).describe('User context to check against prerequisites')
    }),
    func: async ({ agentName, context }) => {
      try {
        const agentContext = {
          conversationId: 'temp-prereq-check',
          teamId: context.teamId || '',
          managerId: '',
          currentAgent: 'OrchestratorAgent',
          messages: [],
          metadata: {
            journeyPhase: context.journeyPhase,
            journeyStatus: context.journeyStatus
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const meetsPrerequisites = agentRegistry.checkPrerequisites(agentName, agentContext);
        const capability = await agentRegistry.getCapabilityByAgent(agentName);
        
        return JSON.stringify({
          success: true,
          result: {
            agentName,
            meetsPrerequisites,
            prerequisites: capability?.prerequisites || [],
            reason: meetsPrerequisites 
              ? 'All prerequisites are met' 
              : `Missing prerequisites: ${capability?.prerequisites?.join(', ') || 'unknown'}`
          }
        });
      } catch (error) {
        console.error('Error in check_agent_prerequisites:', error);
        return JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }
];