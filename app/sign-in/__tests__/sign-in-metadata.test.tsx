import { metadata } from '../layout'

describe('Sign-in Page Metadata', () => {
  it('should have robots meta tag with noindex, follow directive', () => {
    expect(metadata.robots).toBeDefined()
    expect(metadata.robots).toEqual({
      index: false,
      follow: true,
      googleBot: {
        index: false,
        follow: true,
      },
    })
  })

  it('should have appropriate title and description', () => {
    expect(metadata.title).toBe('Sign In - TeamOS Agents Demo')
    expect(metadata.description).toBe('Sign in to your TeamOS account')
  })

  it('should not override other metadata properties', () => {
    expect(metadata).toMatchObject({
      title: 'Sign In - TeamOS Agents Demo',
      description: 'Sign in to your TeamOS account',
      robots: expect.any(Object),
    })
  })
})