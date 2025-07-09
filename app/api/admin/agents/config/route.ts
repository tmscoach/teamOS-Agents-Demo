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
        try {
          const configHistory = await AgentConfigurationService.getConfigurationHistory(agentName);
          return NextResponse.json(configHistory);
        } catch (historyError) {
          // Return empty history if not found
          return NextResponse.json([]);
        }
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
      try {
        const activeConfig = await AgentConfigurationService.getActiveConfiguration(agentName);
        return NextResponse.json(activeConfig);
      } catch (configError: any) {
        // If config doesn't exist, return a default config
        if (configError.message?.includes('not found') || configError.code === 'P2025') {
          const defaultConfig = {
            id: `default-${agentName}`,
            agentName: agentName,
            version: 1,
            prompts: {
              system: `You are the ${agentName}. Configure your prompts here.`,
              greeting: 'Hello! How can I help you today?'
            },
            flowConfig: {
              states: [
                { id: 'start', name: 'start', description: 'Initial state' },
                { id: 'end', name: 'end', description: 'End state' }
              ],
              transitions: [
                { id: 't1', from: 'start', to: 'end', condition: 'true' }
              ],
              initialState: 'start'
            },
            extractionRules: {
              fields: []
            },
            active: true,
            createdBy: 'system',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          return NextResponse.json(defaultConfig);
        }
        throw configError;
      }
    }

    // Get all agent configurations
    const allConfigs = await AgentConfigurationService.getAllAgentConfigurations();
    return NextResponse.json(allConfigs);
  } catch (error: any) {
    console.error('Error fetching agent configurations:', error);
    
    // Handle missing database table error
    if (error.code === 'P2021' || error.message?.includes('table `public.AgentConfiguration` does not exist')) {
      // Return a default list of agents when DB is not initialized
      const defaultAgents = [
        { agentName: 'OnboardingAgent', activeVersion: 1, totalVersions: 1, lastUpdated: new Date().toISOString(), updatedBy: 'system' },
        { agentName: 'OrchestratorAgent', activeVersion: 1, totalVersions: 1, lastUpdated: new Date().toISOString(), updatedBy: 'system' },
        { agentName: 'DiscoveryAgent', activeVersion: 1, totalVersions: 1, lastUpdated: new Date().toISOString(), updatedBy: 'system' },
        { agentName: 'AssessmentAgent', activeVersion: 1, totalVersions: 1, lastUpdated: new Date().toISOString(), updatedBy: 'system' },
        { agentName: 'AlignmentAgent', activeVersion: 1, totalVersions: 1, lastUpdated: new Date().toISOString(), updatedBy: 'system' },
        { agentName: 'LearningAgent', activeVersion: 1, totalVersions: 1, lastUpdated: new Date().toISOString(), updatedBy: 'system' },
        { agentName: 'NudgeAgent', activeVersion: 1, totalVersions: 1, lastUpdated: new Date().toISOString(), updatedBy: 'system' },
        { agentName: 'ProgressMonitor', activeVersion: 1, totalVersions: 1, lastUpdated: new Date().toISOString(), updatedBy: 'system' },
        { agentName: 'RecognitionAgent', activeVersion: 1, totalVersions: 1, lastUpdated: new Date().toISOString(), updatedBy: 'system' },
      ];
      console.warn('Agent configuration table not initialized. Returning default agents.');
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
      prompts: body.prompts,
      flowConfig: body.flowConfig,
      extractionRules: body.extractionRules,
    };

    const config = await AgentConfigurationService.updateConfiguration(
      body.agentName,
      updates,
      userId
    );

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error updating agent configuration:', error);
    return NextResponse.json(
      { error: 'Failed to update agent configuration' },
      { status: 500 }
    );
  }
}