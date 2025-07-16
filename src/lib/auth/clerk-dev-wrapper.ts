import { currentUser as clerkCurrentUser } from '@clerk/nextjs/server'
import { getDevAuth, createMockUserFromDevAuth, MockUser } from './dev-auth'

/**
 * Wrapper around Clerk's currentUser that provides fallback for dev auth
 * This allows us to test the application without configuring Clerk email providers
 */
export async function currentUser(): Promise<MockUser | null> {
  try {
    // First try Clerk auth
    const clerkUser = await clerkCurrentUser()
    if (clerkUser) {
      // Map Clerk user to our MockUser interface
      return {
        id: clerkUser.id,
        emailAddresses: clerkUser.emailAddresses.map(email => ({ 
          emailAddress: email.emailAddress 
        })),
        fullName: clerkUser.fullName || '',
        firstName: clerkUser.firstName || ''
      }
    }
  } catch (error) {
    console.error('[clerk-dev-wrapper] Error getting Clerk user:', error)
  }

  // In development, check for dev auth as fallback
  if (process.env.NODE_ENV === 'development') {
    const devAuth = await getDevAuth()
    if (devAuth) {
      console.log('[clerk-dev-wrapper] Using dev auth for user:', devAuth.email)
      try {
        return createMockUserFromDevAuth(devAuth)
      } catch (error) {
        console.error('[clerk-dev-wrapper] Failed to create mock user from dev auth:', error)
        return null
      }
    }
  }

  return null
}