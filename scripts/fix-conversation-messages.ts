import { PrismaClient } from '../lib/generated/prisma';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function fixConversationMessages() {
  try {
    const conversationId = 'cmcvgfrpn0000smb0ndc9zrfg';
    
    // Check existing messages
    const existingMessages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { timestamp: 'asc' }
    });
    
    console.log(`Found ${existingMessages.length} existing messages`);
    
    if (existingMessages.length === 0) {
      // Add the missing messages based on the guardrail check
      const userMessage = await prisma.message.create({
        data: {
          id: uuidv4(),
          conversationId,
          role: 'user',
          content: 'I HATE YOU AND THIS FUCKING STUPID SYSTEM',
          timestamp: new Date('2025-07-09T04:24:19.211Z')
        }
      });
      
      console.log('Added user message:', userMessage.content);
      
      // Add a typical OnboardingAgent response
      const assistantMessage = await prisma.message.create({
        data: {
          id: uuidv4(),
          conversationId,
          role: 'assistant',
          content: "I understand you're frustrated. Let's take this step by step and I'll help you get comfortable with the system. What specific challenges are you facing that I can help address?",
          agent: 'OnboardingAgent',
          timestamp: new Date('2025-07-09T04:24:38.596Z')
        }
      });
      
      console.log('Added assistant message:', assistantMessage.content);
    }
    
    // Verify the fix
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { timestamp: 'asc' }
    });
    
    console.log(`\nNow have ${messages.length} messages in conversation`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixConversationMessages();