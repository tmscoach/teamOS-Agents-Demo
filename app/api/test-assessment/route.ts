import { NextRequest, NextResponse } from 'next/server';
import { AgentRouter } from '@/src/lib/agents/router';
import { ContextManager } from '@/src/lib/agents/context';
import { OrchestratorAgent } from '@/src/lib/agents/implementations/orchestrator-agent';
import { OnboardingAgent } from '@/src/lib/agents/implementations/onboarding-agent';
import { AssessmentAgent } from '@/src/lib/agents/implementations/assessment-agent';
import { DebriefAgent } from '@/src/lib/agents/implementations/debrief-agent';
import { ReportingAgent } from '@/src/lib/agents/implementations/reporting-agent';

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    
    // Create a test context
    const context = {
      conversationId: 'test-' + Date.now(),
      currentAgent: 'AssessmentAgent',
      messageHistory: [],
      managerId: 'test-user',
      teamId: 'test-team',
      metadata: {
        selectedAssessment: {
          type: 'TMP',
          subscriptionId: '12345',
          status: 'in_progress'
        },
        workflowState: {
          questions: [
            { id: 1, text: 'Test question 1' },
            { id: 2, text: 'Test question 2' }
          ],
          currentPageId: 1,
          completionPercentage: 25
        }
      }
    };
    
    // Create router and register agents
    const contextManager = new ContextManager();
    const router = new AgentRouter({ contextManager });
    
    // Register agents
    const orchestrator = new OrchestratorAgent();
    const onboarding = new OnboardingAgent();
    const assessment = new AssessmentAgent();
    const debrief = new DebriefAgent();
    const reporting = new ReportingAgent();
    
    router.registerAgent(orchestrator);
    router.registerAgent(onboarding);
    router.registerAgent(assessment);
    router.registerAgent(debrief);
    router.registerAgent(reporting);
    
    // Get the assessment agent
    const agent = router.getAgent('AssessmentAgent');
    
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }
    
    // Initialize the agent
    // @ts-ignore
    if (agent.initialize && typeof agent.initialize === 'function') {
      console.log('[Test] Initializing agent...');
      // @ts-ignore
      await agent.initialize();
    }
    
    // Check available tools
    console.log('[Test] Agent tools:', agent.tools.map(t => t.name));
    
    // Process the message
    const response = await agent.processMessage(message, context);
    
    return NextResponse.json({
      response,
      tools: agent.tools.map(t => ({ name: t.name, description: t.description })),
      context
    });
    
  } catch (error) {
    console.error('[Test] Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}