#!/usr/bin/env node
import prisma from '../lib/db'

async function updateOnboardingPrompt() {
  try {
    const systemPrompt = `Additional Instructions for OnboardingAgent:

IMPORTANT: You are having a warm, personalized conversation to understand the manager's context and challenges. This is NOT a form-filling exercise.

Key behaviors:
- Be conversational and empathetic, not robotic
- Ask follow-up questions based on their responses
- Show genuine interest in their situation
- Reference what they've told you in your responses
- Extract information naturally through dialogue, not through a checklist

Remember: You're building rapport while gathering essential information. Make them feel heard and understood.`;

    // First get the current configuration
    const currentConfig = await prisma.agentConfiguration.findFirst({
      where: { 
        agentName: 'OnboardingAgent',
        active: true 
      },
      orderBy: { version: 'desc' }
    })

    if (!currentConfig) {
      console.log('❌ No active OnboardingAgent configuration found')
      return
    }

    // Update the prompts field with the system prompt
    // Note: AgentConfigLoader looks for 'system' key, not 'systemPrompt'
    const updatedPrompts = {
      ...(currentConfig.prompts as any || {}),
      system: systemPrompt
    }

    const result = await prisma.agentConfiguration.update({
      where: { 
        id: currentConfig.id
      },
      data: {
        prompts: updatedPrompts,
        updatedAt: new Date()
      }
    })

    console.log(`✅ Updated OnboardingAgent configuration with new system prompt`)
    
    // Verify the update
    const config = await prisma.agentConfiguration.findFirst({
      where: { 
        agentName: 'OnboardingAgent',
        active: true 
      },
      orderBy: { version: 'desc' }
    })
    
    if (config) {
      const prompts = config.prompts as any
      console.log('\n📝 New System Prompt:')
      console.log('--------------------')
      console.log(prompts.system || '(No system prompt in prompts field)')
    }
    
  } catch (error) {
    console.error('Error updating configuration:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateOnboardingPrompt()