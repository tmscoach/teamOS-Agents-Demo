"use client"

import { useClerk } from "@clerk/nextjs"
import { useEffect, useState } from "react"

export interface ClerkConfigStatus {
  isLoaded: boolean
  hasEmailVerificationLink: boolean
  hasEmailVerificationCode: boolean
  hasPasswordAuth: boolean
  hasGoogleOAuth: boolean
  hasMicrosoftOAuth: boolean
  isConfigured: boolean
  availableStrategies: string[]
}

export function useClerkConfig(): ClerkConfigStatus {
  const { isLoaded, client } = useClerk()
  const [configStatus, setConfigStatus] = useState<ClerkConfigStatus>({
    isLoaded: false,
    hasEmailVerificationLink: false,
    hasEmailVerificationCode: false,
    hasPasswordAuth: false,
    hasGoogleOAuth: false,
    hasMicrosoftOAuth: false,
    isConfigured: false,
    availableStrategies: []
  })

  useEffect(() => {
    if (!isLoaded || !client) {
      return
    }

    try {
      // Get available sign-in strategies
      const signInConfig = client.signIn?.supportedFirstFactors || []
      const signUpConfig = client.signUp?.supportedExternalAccounts || []
      
      // Check for each authentication method
      const hasEmailLink = signInConfig.some((factor: any) => 
        factor.strategy === 'email_link'
      )
      const hasEmailCode = signInConfig.some((factor: any) => 
        factor.strategy === 'email_code'
      )
      const hasPassword = signInConfig.some((factor: any) => 
        factor.strategy === 'password'
      )
      
      // Also check if password is required during sign-up
      const signUpRequirements = client.signUp?.requiredFields || []
      const passwordRequiredForSignUp = signUpRequirements.includes('password')
      
      // Check OAuth providers
      const hasGoogle = signUpConfig.includes('oauth_google')
      const hasMicrosoft = signUpConfig.includes('oauth_microsoft')
      
      // Collect all available strategies
      const strategies: string[] = []
      if (hasEmailLink) strategies.push('email_link')
      if (hasEmailCode) strategies.push('email_code')
      if (hasPassword) strategies.push('password')
      if (hasGoogle) strategies.push('oauth_google')
      if (hasMicrosoft) strategies.push('oauth_microsoft')

      const isConfigured = hasEmailLink || hasEmailCode || hasPassword || hasGoogle || hasMicrosoft

      setConfigStatus({
        isLoaded: true,
        hasEmailVerificationLink: hasEmailLink,
        hasEmailVerificationCode: hasEmailCode,
        hasPasswordAuth: hasPassword,
        hasGoogleOAuth: hasGoogle,
        hasMicrosoftOAuth: hasMicrosoft,
        isConfigured,
        availableStrategies: strategies
      })
    } catch (error) {
      console.error('[clerk-config-check] Error checking Clerk configuration:', error)
      setConfigStatus(prev => ({
        ...prev,
        isLoaded: true,
        isConfigured: false
      }))
    }
  }, [isLoaded, client])

  return configStatus
}

export function getClerkErrorInfo(error: any): {
  code?: string
  message: string
  isConfigurationError: boolean
  suggestedAction?: string
} {
  const errorCode = error?.errors?.[0]?.code
  const errorMessage = error?.errors?.[0]?.message || error?.message || 'Unknown error occurred'
  
  // Check if this is a configuration error
  const configurationErrorCodes = [
    'strategy_not_allowed',
    'form_param_format_invalid',
    'strategy_for_user_invalid',
    'email_link_verification_strategy_not_enabled',
    'email_code_verification_strategy_not_enabled'
  ]
  
  const isConfigurationError = 
    configurationErrorCodes.includes(errorCode) ||
    errorMessage.includes('is invalid') ||
    errorMessage.includes('does not match') ||
    errorMessage.includes('verification strategy')
  
  let suggestedAction: string | undefined
  
  if (errorCode === 'form_identifier_not_found') {
    suggestedAction = 'No account found with this email. Please sign up first.'
  } else if (errorCode === 'form_identifier_exists') {
    suggestedAction = 'An account with this email already exists. Please sign in instead.'
  } else if (isConfigurationError) {
    suggestedAction = 'Email verification is not properly configured in Clerk. Please check the Clerk dashboard or use the dev login for testing.'
  } else if (errorCode === 'verification_expired') {
    suggestedAction = 'The verification code has expired. Please request a new one.'
  } else if (errorCode === 'verification_already_verified') {
    suggestedAction = 'Your email is already verified. Please sign in.'
  }
  
  return {
    code: errorCode,
    message: errorMessage,
    isConfigurationError,
    suggestedAction
  }
}

export function getClerkDashboardUrl(section?: 'email-phone-username' | 'email-templates' | 'logs'): string {
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ''
  
  // Extract the app ID from the publishable key
  // Format: pk_test_xxx or pk_live_xxx
  const match = clerkPublishableKey.match(/pk_(test|live)_([^_]+)/)
  const appSlug = match?.[2]
  
  if (!appSlug) {
    // Return generic Clerk dashboard URL
    return 'https://dashboard.clerk.com'
  }
  
  const baseUrl = `https://dashboard.clerk.com/apps/app_${appSlug}`
  
  switch (section) {
    case 'email-phone-username':
      return `${baseUrl}/user-authentication/email-phone-username`
    case 'email-templates':
      return `${baseUrl}/customization/email-templates`
    case 'logs':
      return `${baseUrl}/logs`
    default:
      return baseUrl
  }
}