import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { AgentConfigurationService } from '@/src/lib/services/agent-configuration';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const agentName = searchParams.get('agentName');
    const version = searchParams.get('version');
    const history = searchParams.get('history') === 'true';
    const compare = searchParams.get('compare') === 'true';

    // Get specific agent configuration
    if (agentName) {
      // Compare versions
      if (compare) {
        const version1 = searchParams.get('version1');
        const version2 = searchParams.get('version2');
        
        if (!version1 || !version2) {
          return NextResponse.json(
            { error: 'Both version1 and version2 are required for comparison' },
            { status: 400 }
          );
        }

        const comparison = await AgentConfigurationService.compareVersions(
          agentName,
          parseInt(version1),
          parseInt(version2)
        );
        return NextResponse.json(comparison);
      }

      // Get configuration history
      if (history) {
        const configHistory = await AgentConfigurationService.getConfigurationHistory(agentName);
        return NextResponse.json(configHistory);
      }

      // Get specific version
      if (version) {
        const config = await AgentConfigurationService.getConfigurationVersion(
          agentName,
          parseInt(version)
        );
        return NextResponse.json(config);
      }

      // Get active configuration
      const activeConfig = await AgentConfigurationService.getActiveConfiguration(agentName);
      
      // If no config found, return a default configuration
      if (!activeConfig) {
        // Import default configuration
        const { SIMPLIFIED_AGENT_CONFIGS } = await import('@/src/lib/agents/config/simplified-agent-configs');
        const defaultConfig = SIMPLIFIED_AGENT_CONFIGS[agentName];
        
        if (!defaultConfig) {
          // Fallback for unknown agents
          const configResponse = {
            id: `default-${agentName}`,
            agentName: agentName,
            version: 0,
            systemPrompt: `You are the ${agentName} for teamOS. Your role is to assist with team transformation.`,
            flowConfig: { states: [], transitions: [] },
            extractionRules: {},
            active: false,
            createdBy: 'system',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          return NextResponse.json(configResponse);
        }
        
        const configResponse = {
          id: `default-${agentName}`,
          agentName: agentName,
          version: 0, // Version 0 indicates unconfigured
          systemPrompt: defaultConfig.systemPrompt,
          flowConfig: defaultConfig.flowConfig,
          extractionRules: defaultConfig.extractionRules,
          active: false,
          createdBy: 'system',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        return NextResponse.json(configResponse);
      }
      
      // Convert legacy multi-prompt format to single system prompt
      let systemPrompt = '';
      if (activeConfig.prompts && typeof activeConfig.prompts === 'object') {
        const prompts = activeConfig.prompts as Record<string, any>;
        systemPrompt = prompts.system || 
          Object.entries(prompts)
            .map(([key, value]) => `## ${key.replace(/_/g, ' ').toUpperCase()}\n${value}`)
            .join('\n\n');
      }
      
      return NextResponse.json({
        ...activeConfig,
        systemPrompt
      });
    }

    // Get all agent configurations
    const allConfigs = await AgentConfigurationService.getAllAgentConfigurations();
    
    // Define all available agents
    const ALL_AGENTS = [
      'OrchestratorAgent',
      'OnboardingAgent',
      'DiscoveryAgent',
      'AssessmentAgent',
      'AlignmentAgent',
      'LearningAgent',
      'NudgeAgent',
      'ProgressMonitor',
      'RecognitionAgent'
    ];
    
    // Create a map of configured agents
    const configuredAgentsMap = new Map(
      allConfigs.map(config => [config.agentName, config])
    );
    
    // Return all agents with their configuration status
    const agentStatuses = ALL_AGENTS.map(agentName => {
      const config = configuredAgentsMap.get(agentName);
      if (config) {
        return config;
      }
      // Return unconfigured agent
      return {
        agentName,
        activeVersion: 0,
        totalVersions: 0,
        lastUpdated: null,
        updatedBy: null,
        configured: false
      };
    });
    
    return NextResponse.json(agentStatuses);
  } catch (error: any) {
    console.error('Error fetching agent configurations:', error);
    
    // Handle database connection error or missing table
    if (error.code === 'P1001' || (error.code === 'P2021' && error.message?.includes('table `public.AgentConfiguration` does not exist'))) {
      const defaultAgents = [
        {
          agentName: 'OnboardingAgent',
          activeVersion: 1,
          totalVersions: 1,
          lastUpdated: new Date().toISOString(),
          updatedBy: 'system'
        },
        {
          agentName: 'AssessmentAgent',
          activeVersion: 1,
          totalVersions: 1,
          lastUpdated: new Date().toISOString(),
          updatedBy: 'system'
        },
        {
          agentName: 'AnalysisAgent',
          activeVersion: 1,
          totalVersions: 1,
          lastUpdated: new Date().toISOString(),
          updatedBy: 'system'
        }
      ];
      return NextResponse.json(defaultAgents);
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch agent configurations' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    if (!body.agentName || !body.prompts || !body.flowConfig || !body.extractionRules) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const config = await AgentConfigurationService.createConfiguration({
      agentName: body.agentName,
      prompts: body.prompts,
      flowConfig: body.flowConfig,
      extractionRules: body.extractionRules,
      createdBy: userId,
    });

    return NextResponse.json(config);
  } catch (error: any) {
    console.error('Error creating agent configuration:', error);
    
    // Handle missing database table error
    if (error.code === 'P2021' && error.message?.includes('table `public.AgentConfiguration` does not exist')) {
      return NextResponse.json(
        { 
          error: 'Agent configuration table not initialized. Please run database migrations.',
          instructions: 'Run: npx prisma migrate dev'
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create agent configuration' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const searchParams = req.nextUrl.searchParams;
    const action = searchParams.get('action');

    if (!body.agentName) {
      return NextResponse.json(
        { error: 'Agent name is required' },
        { status: 400 }
      );
    }

    // Handle rollback action
    if (action === 'rollback') {
      if (!body.targetVersion) {
        return NextResponse.json(
          { error: 'Target version is required for rollback' },
          { status: 400 }
        );
      }

      const config = await AgentConfigurationService.rollbackConfiguration(
        body.agentName,
        body.targetVersion
      );
      return NextResponse.json(config);
    }

    // Handle clone action
    if (action === 'clone') {
      if (!body.targetAgent) {
        return NextResponse.json(
          { error: 'Target agent is required for cloning' },
          { status: 400 }
        );
      }

      const config = await AgentConfigurationService.cloneConfiguration(
        body.agentName,
        body.targetAgent,
        userId
      );
      return NextResponse.json(config);
    }

    // Default update action
    const updates = {
      systemPrompt: body.systemPrompt,
      prompts: body.prompts, // Keep for backward compatibility
      flowConfig: body.flowConfig,
      extractionRules: body.extractionRules,
    };

    const config = await AgentConfigurationService.updateConfiguration(
      body.agentName,
      updates,
      userId
    );

    // Clear the cache for this agent so new conversations use the updated config
    const { AgentConfigLoader } = await import('@/src/lib/agents/config/agent-config-loader');
    AgentConfigLoader.clearCache(body.agentName);

    return NextResponse.json(config);
  } catch (error: any) {
    console.error('Error updating agent configuration:', error);
    
    // Handle missing database table error
    if (error.code === 'P2021' && error.message?.includes('table `public.AgentConfiguration` does not exist')) {
      return NextResponse.json(
        { 
          error: 'Agent configuration table not initialized. Please run database migrations.',
          instructions: 'Run: npx prisma migrate dev'
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update agent configuration' },
      { status: 500 }
    );
  }
}