import { PrismaClient } from '../lib/generated/prisma';

async function testConnection() {
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  try {
    console.log('Testing database connection...');
    
    // Try a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful!', result);
    
    // Try to count users
    const userCount = await prisma.user.count();
    console.log(`✅ Found ${userCount} users in database`);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    
    if (error instanceof Error && error.message.includes("Can't reach database server")) {
      console.log('\n💡 Possible solutions:');
      console.log('1. Check if your Supabase project is active (free tier projects pause after 1 week of inactivity)');
      console.log('2. Go to https://supabase.com/dashboard and check your project status');
      console.log('3. If paused, click "Restore" to reactivate it');
      console.log('4. Verify your DATABASE_URL in .env.local is correct');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();