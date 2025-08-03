import { Suspense } from 'react';
import { currentUser } from '@/src/lib/auth/clerk-dev-wrapper';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { AssessmentWrapper } from './components/AssessmentWrapper';
import AssessmentClient from './AssessmentClient';

export default async function AssessmentPage() {
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    redirect('/sign-in');
  }
  
  // Get user from database
  const userQuery = clerkUser.emailAddresses?.[0]?.emailAddress 
    ? { email: clerkUser.emailAddresses[0].emailAddress }
    : { clerkId: clerkUser.id };
    
  const user = await prisma.user.findUnique({
    where: userQuery,
    select: {
      id: true,
      email: true,
      name: true,
      journeyPhase: true,
      completedSteps: true
    }
  });
  
  if (!user) {
    redirect('/sign-in');
  }
  
  return (
    <AssessmentWrapper>
      <Suspense fallback={<div>Loading...</div>}>
        <AssessmentClient />
      </Suspense>
    </AssessmentWrapper>
  );
}