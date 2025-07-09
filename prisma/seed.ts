import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create a demo manager user first
  const demoManager = await prisma.user.upsert({
    where: { email: 'demo.manager@teamos.ai' },
    update: {},
    create: {
      id: 'demo-manager-1',
      clerkId: 'user_demo_manager_1', // This would normally come from Clerk
      email: 'demo.manager@teamos.ai',
      name: 'Demo Manager',
      role: 'MANAGER',
    },
  });

  console.log('✅ Created demo manager:', demoManager.name);

  // Create a demo team with the manager
  const demoTeam = await prisma.team.upsert({
    where: { id: 'demo-team-1' },
    update: {},
    create: {
      id: 'demo-team-1',
      name: 'Demo Engineering Team',
      department: 'Engineering',
      managerId: demoManager.id,
      transformationStatus: 'active',
      maturityIndicators: {
        teamSize: 12,
        communicationScore: 3.5,
        collaborationScore: 4.0,
        trustScore: 3.8
      },
    },
  });

  console.log('✅ Created demo team:', demoTeam.name);

  // Create some team member users
  const teamMembers = await Promise.all([
    prisma.user.upsert({
      where: { email: 'alice.dev@teamos.ai' },
      update: {},
      create: {
        id: 'demo-member-1',
        clerkId: 'user_demo_member_1',
        email: 'alice.dev@teamos.ai',
        name: 'Alice Developer',
        role: 'TEAM_MEMBER',
        teamId: demoTeam.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'bob.engineer@teamos.ai' },
      update: {},
      create: {
        id: 'demo-member-2',
        clerkId: 'user_demo_member_2',
        email: 'bob.engineer@teamos.ai',
        name: 'Bob Engineer',
        role: 'TEAM_MEMBER',
        teamId: demoTeam.id,
      },
    }),
  ]);

  console.log('✅ Created', teamMembers.length, 'team members');

  // Create some sample conversations
  const sampleConversation = await prisma.conversation.create({
    data: {
      teamId: demoTeam.id,
      managerId: demoManager.id,
      currentAgent: 'OnboardingAgent',
      status: 'active',
      contextData: {
        transformationPhase: 'onboarding',
        metadata: {
          onboarding: {
            state: 'gathering_context',
            collectedData: {
              manager_name: 'Demo Manager',
              team_size: 12,
              primary_challenges: ['Communication gaps', 'Meeting deadlines'],
            },
          },
        },
      },
      messages: {
        create: [
          {
            role: 'user',
            content: "Hi, I'm the Demo Manager and I lead a team of 12 engineers.",
            timestamp: new Date(),
          },
          {
            role: 'assistant',
            content: "Welcome Demo Manager! I see you're leading a team of 12 engineers. That's a substantial team. What are the main challenges you're facing with your team?",
            timestamp: new Date(),
          },
        ],
      },
    },
  });

  console.log('✅ Created sample conversation');

  // Create some sample variable extractions
  await prisma.variableExtraction.createMany({
    data: [
      {
        conversationId: sampleConversation.id,
        agentName: 'OnboardingAgent',
        fieldName: 'managerName',
        attempted: true,
        successful: true,
        extractedValue: 'Demo Manager',
        confidence: 0.95,
      },
      {
        conversationId: sampleConversation.id,
        agentName: 'OnboardingAgent',
        fieldName: 'teamSize',
        attempted: true,
        successful: true,
        extractedValue: '12',
        confidence: 1.0,
      },
    ],
  });

  console.log('✅ Created sample variable extractions');

  // Create some sample guardrail checks
  await prisma.guardrailCheck.createMany({
    data: [
      {
        conversationId: sampleConversation.id,
        agentName: 'OnboardingAgent',
        guardrailType: 'content_safety',
        input: "Hi, I'm the Demo Manager and I lead a team of 12 engineers.",
        passed: true,
        result: {
          check: 'content_safety',
          passed: true,
          confidence: 0.98,
        },
      },
      {
        conversationId: sampleConversation.id,
        agentName: 'OnboardingAgent',
        guardrailType: 'pii_protection',
        input: 'Demo Manager',
        passed: true,
        result: {
          check: 'pii_protection',
          passed: true,
          note: 'Name is acceptable for business context',
        },
      },
    ],
  });

  console.log('✅ Created sample guardrail checks');

  console.log('\n🎉 Database seeding completed!');
  console.log('\nYou can now:');
  console.log('1. Sign in to the app');
  console.log('2. View the demo data in the admin dashboard at /admin');
  console.log('3. Start new conversations with the chat interface at /chat');
  console.log('\nNote: To use the chat, you need to update your Clerk user to have the clerkId from this seed data,');
  console.log('or create a new user in the database with your actual Clerk ID.');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });