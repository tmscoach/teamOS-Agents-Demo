import { AgentConfigurationService } from '@/src/lib/services/agent-configuration';
import { AgentConfigLoader } from '@/src/lib/agents/config/agent-config-loader';
import { AgentContext } from '@/src/lib/agents/types';
import { JourneyPhase } from '@/lib/orchestrator/journey-phases';

export interface AgentCapability {
  name: string;
  description: string;
  examples: string[];
  prerequisites?: string[];
  relevantPhases?: JourneyPhase[];
  keywords?: string[];
}

export class AgentRegistry {
  private capabilities: Map<string, AgentCapability> = new Map();
  private lastLoadTime: number = 0;
  private readonly CACHE_DURATION = 300000; // 5 minutes

  /**
   * Load capabilities from agent configurations
   */
  async loadCapabilitiesFromConfigs(): Promise<Map<string, AgentCapability>> {
    const now = Date.now();
    
    // Check if cache is still valid
    if (this.capabilities.size > 0 && (now - this.lastLoadTime) < this.CACHE_DURATION) {
      return this.capabilities;
    }

    try {
      // Get all agent configurations
      const allConfigs = await AgentConfigurationService.getAllAgentConfigurations();
      
      // Clear existing capabilities
      this.capabilities.clear();
      
      // Load capabilities for each agent
      for (const agentSummary of allConfigs) {
        const config = await AgentConfigLoader.loadConfiguration(agentSummary.agentName);
        
        if (config) {
          // Check if capabilities are stored in the config
          const capabilities = (config as any).capabilities;
          
          if (capabilities && typeof capabilities === 'object') {
            this.capabilities.set(agentSummary.agentName, {
              name: agentSummary.agentName,
              ...capabilities
            } as AgentCapability);
          } else {
            // Create default capabilities based on agent name and description
            this.capabilities.set(agentSummary.agentName, this.createDefaultCapability(agentSummary.agentName));
          }
        }
      }
      
      this.lastLoadTime = now;
      return this.capabilities;
    } catch (error) {
      console.error('Failed to load agent capabilities:', error);
      
      // Return default capabilities if loading fails
      return this.getDefaultCapabilities();
    }
  }

  /**
   * Get capabilities for routing decision
   */
  async getCapabilitiesForRouting(context: AgentContext): Promise<AgentCapability[]> {
    const capabilities = await this.loadCapabilitiesFromConfigs();
    const applicableCapabilities: AgentCapability[] = [];
    
    for (const [agentName, capability] of capabilities) {
      // Check if agent meets prerequisites
      if (this.checkPrerequisites(agentName, context)) {
        applicableCapabilities.push(capability);
      }
    }
    
    return applicableCapabilities;
  }

  /**
   * Check if agent prerequisites are met
   */
  checkPrerequisites(agentName: string, context: AgentContext): boolean {
    const capability = this.capabilities.get(agentName);
    if (!capability) return true; // No capability info means no prerequisites
    
    // Check journey phase requirements
    if (capability.relevantPhases && capability.relevantPhases.length > 0) {
      const userPhase = context.metadata.journeyPhase as JourneyPhase;
      if (userPhase && !capability.relevantPhases.includes(userPhase)) {
        return false;
      }
    }
    
    // Check specific prerequisites
    if (capability.prerequisites && capability.prerequisites.length > 0) {
      for (const prereq of capability.prerequisites) {
        switch (prereq) {
          case 'onboarding_complete':
            if (context.metadata.journeyPhase === 'ONBOARDING' || 
                context.metadata.journeyStatus === 'ONBOARDING') {
              return false;
            }
            break;
            
          case 'team_created':
            if (!context.teamId) {
              return false;
            }
            break;
            
          case 'assessment_started':
            if (context.metadata.journeyPhase !== 'ASSESSMENT' && 
                context.metadata.journeyPhase !== 'DEBRIEF' &&
                context.metadata.journeyPhase !== 'CONTINUOUS_ENGAGEMENT') {
              return false;
            }
            break;
        }
      }
    }
    
    return true;
  }

  /**
   * Get capability by agent name
   */
  async getCapabilityByAgent(agentName: string): Promise<AgentCapability | null> {
    await this.loadCapabilitiesFromConfigs();
    return this.capabilities.get(agentName) || null;
  }

  /**
   * Clear capability cache
   */
  clearCache(): void {
    this.capabilities.clear();
    this.lastLoadTime = 0;
  }

  /**
   * Create default capability based on agent name
   */
  private createDefaultCapability(agentName: string): AgentCapability {
    const defaults = this.getDefaultCapabilities();
    return defaults.get(agentName) || {
      name: agentName,
      description: `${agentName} for team transformation`,
      examples: [],
      keywords: [agentName.toLowerCase().replace('agent', '')]
    };
  }

  /**
   * Get default capabilities for all agents
   */
  private getDefaultCapabilities(): Map<string, AgentCapability> {
    const defaults = new Map<string, AgentCapability>();
    
    defaults.set('OnboardingAgent', {
      name: 'OnboardingAgent',
      description: 'Guides managers through initial TMS platform setup with personalized onboarding',
      examples: [
        "Hi, I'm new here",
        "How do I get started?",
        "What is TMS?",
        "Help me set up my team"
      ],
      prerequisites: [],
      relevantPhases: [JourneyPhase.ONBOARDING],
      keywords: ['start', 'begin', 'new', 'setup', 'onboarding', 'welcome', 'introduction']
    });
    
    defaults.set('AssessmentAgent', {
      name: 'AssessmentAgent',
      description: 'Analyzes team data and generates insights and recommendations',
      examples: [
        "How does the assessment work?",
        "Start team assessment",
        "What assessments are available?",
        "Help me evaluate my team"
      ],
      prerequisites: ['onboarding_complete'],
      relevantPhases: [JourneyPhase.ASSESSMENT],
      keywords: ['assessment', 'evaluate', 'analyze', 'test', 'questionnaire', 'tmp', 'team signals']
    });
    
    defaults.set('DiscoveryAgent', {
      name: 'DiscoveryAgent',
      description: 'Conducts team assessment and gathers comprehensive data',
      examples: [
        "Gather team information",
        "Discover team dynamics",
        "Collect team data"
      ],
      prerequisites: ['onboarding_complete'],
      relevantPhases: [JourneyPhase.ASSESSMENT],
      keywords: ['discover', 'gather', 'collect', 'explore', 'understand']
    });
    
    defaults.set('AlignmentAgent', {
      name: 'AlignmentAgent',
      description: 'Facilitates goal alignment and stakeholder buy-in processes',
      examples: [
        "Help align team goals",
        "Create team alignment",
        "Stakeholder management"
      ],
      prerequisites: ['assessment_started'],
      relevantPhases: [JourneyPhase.DEBRIEF, JourneyPhase.CONTINUOUS_ENGAGEMENT],
      keywords: ['align', 'goals', 'objectives', 'stakeholder', 'consensus']
    });
    
    defaults.set('LearningAgent', {
      name: 'LearningAgent',
      description: 'Manages learning paths and educational resources for team transformation',
      examples: [
        "What training is available?",
        "Learning resources",
        "Team development courses"
      ],
      prerequisites: ['onboarding_complete'],
      relevantPhases: [JourneyPhase.CONTINUOUS_ENGAGEMENT],
      keywords: ['learn', 'training', 'education', 'development', 'courses', 'resources']
    });
    
    defaults.set('NudgeAgent', {
      name: 'NudgeAgent',
      description: 'Sends behavioral nudges and reminders to support transformation',
      examples: [
        "Remind my team",
        "Send nudges",
        "Behavioral prompts"
      ],
      prerequisites: ['team_created'],
      relevantPhases: [JourneyPhase.CONTINUOUS_ENGAGEMENT],
      keywords: ['nudge', 'remind', 'prompt', 'encourage', 'motivate']
    });
    
    defaults.set('ProgressMonitor', {
      name: 'ProgressMonitor',
      description: 'Tracks transformation progress and reports on key metrics',
      examples: [
        "Show team progress",
        "Progress report",
        "How is my team doing?",
        "Transformation metrics"
      ],
      prerequisites: ['assessment_started'],
      relevantPhases: [JourneyPhase.CONTINUOUS_ENGAGEMENT],
      keywords: ['progress', 'track', 'monitor', 'metrics', 'report', 'status']
    });
    
    defaults.set('RecognitionAgent', {
      name: 'RecognitionAgent',
      description: 'Manages team recognition and celebration of achievements',
      examples: [
        "Celebrate achievements",
        "Recognize team members",
        "Team accomplishments"
      ],
      prerequisites: ['team_created'],
      relevantPhases: [JourneyPhase.CONTINUOUS_ENGAGEMENT],
      keywords: ['recognize', 'celebrate', 'achievement', 'accomplishment', 'reward']
    });
    
    defaults.set('OrchestratorAgent', {
      name: 'OrchestratorAgent',
      description: 'Manages overall transformation workflow and coordinates other agents',
      examples: [
        "General questions",
        "Help me",
        "What can you do?",
        "Guide me"
      ],
      prerequisites: [],
      relevantPhases: [
        JourneyPhase.ONBOARDING,
        JourneyPhase.ASSESSMENT,
        JourneyPhase.DEBRIEF,
        JourneyPhase.CONTINUOUS_ENGAGEMENT
      ],
      keywords: ['help', 'guide', 'orchestrate', 'coordinate', 'manage']
    });
    
    defaults.set('DebriefAgent', {
      name: 'DebriefAgent',
      description: 'Provides assessment debriefs and generates reports for completed assessments',
      examples: [
        "Show me assessment results",
        "Generate assessment report",
        "Debrief my assessment",
        "What do my results mean?"
      ],
      prerequisites: ['assessment_started'],
      relevantPhases: [JourneyPhase.DEBRIEF],
      keywords: ['debrief', 'results', 'report', 'feedback', 'insights', 'assessment results']
    });
    
    defaults.set('ReportingAgent', {
      name: 'ReportingAgent',
      description: 'Generates organization-wide reports and analytics',
      examples: [
        "Generate organization report",
        "Show usage analytics",
        "Team transformation metrics",
        "Executive summary"
      ],
      prerequisites: ['onboarding_complete'],
      relevantPhases: [JourneyPhase.CONTINUOUS_ENGAGEMENT],
      keywords: ['report', 'analytics', 'metrics', 'usage', 'organization report', 'executive']
    });
    
    return defaults;
  }
}