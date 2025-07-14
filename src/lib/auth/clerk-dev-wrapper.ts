import { currentUser as clerkCurrentUser } from '@clerk/nextjs/server'
import { getDevAuth } from './dev-auth'

export interface MockUser {
  id: string
  emailAddresses: Array<{ emailAddress: string }>
  fullName?: string
  firstName?: string
}

/**
 * Wrapper around Clerk's currentUser that also checks for dev auth
 */
export async function currentUser(): Promise<MockUser | null> {
  // First try Clerk auth
  const clerkUser = await clerkCurrentUser()
  if (clerkUser) {
    return clerkUser as any
  }

  // In development, check for dev auth
  if (process.env.NODE_ENV === 'development') {
    const devAuth = await getDevAuth()
    if (devAuth) {
      // Return a mock user object that matches Clerk's structure
      return {
        id: devAuth.userId,
        emailAddresses: [{ emailAddress: devAuth.email }],
        fullName: devAuth.email.split('@')[0],
        firstName: devAuth.email.split('@')[0],
      }
    }
  }

  return null
}