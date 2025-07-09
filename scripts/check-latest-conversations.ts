import { PrismaClient } from '../lib/generated/prisma';

const prisma = new PrismaClient();

async function checkLatestConversations() {
  try {
    // Get the 5 most recent conversations
    const conversations = await prisma.conversation.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        _count: {
          select: {
            messages: true,
            guardrailChecks: true
          }
        }
      }
    });

    console.log('Latest 5 conversations:\n');
    
    for (const conv of conversations) {
      console.log(`ID: ${conv.id}`);
      console.log(`Created: ${conv.createdAt}`);
      console.log(`Current Agent: ${conv.currentAgent}`);
      console.log(`Messages: ${conv._count.messages}`);
      console.log(`Guardrail Checks: ${conv._count.guardrailChecks}`);
      
      // Check for messages
      if (conv._count.messages === 0 && conv._count.guardrailChecks > 0) {
        console.log('⚠️  Has guardrail checks but no messages!');
        
        // Get guardrail checks
        const checks = await prisma.guardrailCheck.findMany({
          where: { conversationId: conv.id },
          take: 3
        });
        
        console.log('Sample guardrail checks:');
        checks.forEach(check => {
          console.log(`  - ${check.guardrailType}: ${check.passed ? 'PASSED' : 'FAILED'} - Input: "${check.input}"`);
        });
      }
      
      console.log('---\n');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLatestConversations();