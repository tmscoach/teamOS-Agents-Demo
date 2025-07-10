import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

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

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      console.error('Unauthorized access attempt to agent config');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const agentName = searchParams.get('agentName');
    const version = searchParams.get('version');
    const history = searchParams.get('history') === 'true';
    const compare = searchParams.get('compare') === 'true';

    console.log('Agent config request:', { agentName, version, history, compare });

    // Try to use the database service
    try {
      const { AgentConfigurationService } = await import('@/src/lib/services/agent-configuration');
      
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
              guardrailConfig: {},
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
            guardrailConfig: defaultConfig.guardrailConfig || {},
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
          const prompts = activeConfig.prompts as Record<string, unknown>;
          systemPrompt = (typeof prompts.system === 'string' ? prompts.system : '') || 
            Object.entries(prompts)
              .map(([key, value]) => `## ${key.replace(/_/g, ' ').toUpperCase()}\n${value}`)
              .join('\n\n');
        }
        
        return NextResponse.json({
          ...activeConfig,
          systemPrompt,
          guardrailConfig: activeConfig.guardrailConfig || {}
        });
      }

      // Get all agent configurations
      console.log('Fetching all agent configurations...');
      const allConfigs = await AgentConfigurationService.getAllAgentConfigurations();
      console.log('Fetched configurations:', allConfigs);
      
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
    } catch (dbError: any) {
      // If database fails, return default agents
      console.error('Database error in agent config API:', {
        message: dbError?.message,
        code: dbError?.code,
        stack: dbError?.stack,
        name: dbError?.name,
        fullError: dbError
      });
      
      // Check for specific Prisma errors
      if (dbError?.code === 'P2022') {
        console.error('Missing database column:', dbError.meta?.column_name || 'unknown');
      } else if (dbError?.code === 'P2021') {
        console.error('Missing database table:', dbError.meta?.table || 'unknown');
      } else if (dbError?.code === 'P1001' || dbError?.code === 'P1002') {
        console.error('Database connection error');
      }
      
      // Return all agents with default status
      const defaultAgents = ALL_AGENTS.map(agentName => ({
        agentName,
        activeVersion: 0,
        totalVersions: 0,
        lastUpdated: null,
        updatedBy: null,
        configured: false
      }));
      
      return NextResponse.json(defaultAgents);
    }
  } catch (error: any) {
    console.error('Outer error in agent config API:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack
    });
    
    // Return basic fallback
    const defaultAgents = ALL_AGENTS.map(agentName => ({
      agentName,
      activeVersion: 0,
      totalVersions: 0,
      lastUpdated: null,
      updatedBy: null,
      configured: false
    }));
    
    return NextResponse.json(defaultAgents);
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

    const { AgentConfigurationService } = await import('@/src/lib/services/agent-configuration');
    const config = await AgentConfigurationService.createConfiguration({
      agentName: body.agentName,
      prompts: body.prompts,
      flowConfig: body.flowConfig,
      extractionRules: body.extractionRules,
      createdBy: userId,
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error creating agent configuration:', error);
    
    // Handle missing database table error
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2021' && error.message?.includes('table `public.AgentConfiguration` does not exist')) {
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

    const { AgentConfigurationService } = await import('@/src/lib/services/agent-configuration');

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
      guardrailConfig: body.guardrailConfig,
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
  } catch (error) {
    console.error('Error updating agent configuration:', error);
    
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
        meta: (error as any).meta
      });
    }
    
    // Handle missing database table error
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2021' && error.message?.includes('table `public.AgentConfiguration` does not exist')) {
      return NextResponse.json(
        { 
          error: 'Agent configuration table not initialized. Please run database migrations.',
          instructions: 'Run: npx prisma migrate dev'
        },
        { status: 503 }
      );
    }
    
    // Handle missing column error
    if (error instanceof Error && error.message?.includes('Unknown column')) {
      return NextResponse.json(
        { 
          error: 'Database schema out of date. The guardrailConfig column might be missing.',
          instructions: 'Run: npx prisma migrate dev --name add-guardrail-config',
          details: error.message
        },
        { status: 503 }
      );
    }
    
    // Handle database connection errors
    if (error instanceof Error && 'code' in error && ((error as any).code === 'P1001' || (error as any).code === 'P1002')) {
      return NextResponse.json(
        { 
          error: 'Cannot connect to database',
          details: 'Please check your database connection'
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to update agent configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}