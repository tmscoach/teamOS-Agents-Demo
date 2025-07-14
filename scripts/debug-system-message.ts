import { OnboardingAgent, ConversationState } from '../src/lib/agents/implementations/onboarding-agent'
import { AgentContext } from '../src/lib/agents/types'

async function debugSystemMessage() {
  console.log('🔍 Debugging OnboardingAgent system message...\n')

  // Create an instance
  const agent = new OnboardingAgent()
  
  // Wait for config to load
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // Check if config is loaded
  // @ts-ignore
  console.log('Config loaded?', !!agent.loadedConfig)
  // @ts-ignore  
  console.log('Config systemPrompt:', agent.loadedConfig?.systemPrompt?.substring(0, 100))
  
  // Create a mock context
  const mockContext: AgentContext = {
    conversationId: 'test-123',
    teamId: 'team-123',
    managerId: 'manager-123',
    transformationPhase: 'discovery',
    messageHistory: [],
    metadata: {
      state: ConversationState.GREETING,
      userRole: 'MANAGER'
    }
  }
  
  // Access the buildSystemMessage method (we'll need to make it public temporarily)
  // @ts-ignore - accessing protected method for debugging
  const systemMessage = agent.buildSystemMessage(mockContext)
  
  console.log('📝 System Message:')
  console.log('==================')
  console.log(systemMessage)
  console.log('\n\n🔍 First 500 characters:')
  console.log(systemMessage.substring(0, 500))
}

debugSystemMessage()