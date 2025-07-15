import { currentUser as clerkCurrentUser } from '@clerk/nextjs/server'
import { getDevAuth, createMockUserFromDevAuth, MockUser } from './dev-auth'

/**
 * Wrapper around Clerk's currentUser that also checks for dev auth
 */
export async function currentUser(): Promise<MockUser | null> {
  // First try Clerk auth
  const clerkUser = await clerkCurrentUser()
  if (clerkUser) {
    // Map Clerk user to our MockUser interface
    return {
      id: clerkUser.id,
      emailAddresses: clerkUser.emailAddresses.map(email => ({ 
        emailAddress: email.emailAddress 
      })),
      fullName: clerkUser.fullName || undefined,
      firstName: clerkUser.firstName || undefined
    }
  }

  // In development, check for dev auth
  if (process.env.NODE_ENV === 'development') {
    const devAuth = await getDevAuth()
    if (devAuth) {
      // Use validated mock user creation
      try {
        return createMockUserFromDevAuth(devAuth)
      } catch (error) {
        console.error('Failed to create mock user from dev auth:', error)
        return null
      }
    }
  }

  return null
}