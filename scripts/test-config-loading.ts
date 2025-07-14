import { AgentConfigLoader } from '../src/lib/agents/config/agent-config-loader'

async function testConfigLoading() {
  console.log('🔍 Testing OnboardingAgent configuration loading...\n')

  try {
    const config = await AgentConfigLoader.loadConfiguration('OnboardingAgent')
    
    if (config) {
      console.log('✅ Configuration loaded successfully')
      console.log('Version:', config.version)
      console.log('\n📝 System Prompt from loader:')
      console.log('------------------------------')
      console.log(config.systemPrompt || '(Empty)')
      console.log('\n📋 Prompts object:')
      console.log(JSON.stringify(config.prompts, null, 2))
    } else {
      console.log('❌ No configuration loaded')
    }
  } catch (error) {
    console.error('Error loading configuration:', error)
  }
}

testConfigLoading()