#!/usr/bin/env node
import prisma from '../lib/db'

async function checkOnboardingConfig() {
  try {
    const config = await prisma.agentConfiguration.findFirst({
      where: { 
        agentName: 'OnboardingAgent',
        active: true 
      },
      orderBy: { version: 'desc' }
    })

    if (config) {
      console.log('🤖 OnboardingAgent Configuration:')
      console.log('================================')
      console.log('Version:', config.version)
      console.log('Created:', config.createdAt)
      console.log('Updated:', config.updatedAt)
      console.log('\n📝 System Prompt:')
      console.log('----------------')
      console.log(config.systemPrompt || '(No system prompt configured)')
      
      if (config.configuration) {
        const fullConfig = config.configuration as any
        console.log('\n🔧 Additional Configuration:')
        console.log('---------------------------')
        console.log('Extraction Rules:', fullConfig.extractionRules?.length || 0)
        console.log('Guardrail Config:', fullConfig.guardrailConfig ? 'Yes' : 'No')
        console.log('Flow Config:', fullConfig.flowConfig ? 'Yes' : 'No')
        console.log('Prompts:', fullConfig.prompts ? Object.keys(fullConfig.prompts) : 'None')
        
        if (fullConfig.prompts) {
          console.log('\n📋 Configured Prompts:')
          console.log('--------------------')
          Object.entries(fullConfig.prompts).forEach(([key, value]) => {
            console.log(`\n[${key}]:`)
            console.log(value)
          })
        }
      }
    } else {
      console.log('❌ No active configuration found for OnboardingAgent')
      console.log('   The agent is using hardcoded defaults.')
    }
  } catch (error) {
    console.error('Error checking configuration:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkOnboardingConfig()