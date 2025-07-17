"use client"

import Link from "next/link"
import { AlertCircle } from "lucide-react"
import { useClerkConfig } from "@/src/lib/auth/clerk-config-check"

export function DevModeNotice() {
  const clerkConfig = useClerkConfig()
  
  if (process.env.NODE_ENV !== "development") {
    return null
  }

  const hasEmailAuth = clerkConfig.hasEmailVerificationCode || clerkConfig.hasEmailVerificationLink

  return (
    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-yellow-800">
          <p className="font-medium mb-1">Development Mode</p>
          {clerkConfig.isLoaded && !hasEmailAuth && (
            <p className="mb-2 text-red-700 font-medium">
              ⚠️ Email verification is not configured in Clerk
            </p>
          )}
          <p className="mb-2">
            Quick options for testing:
          </p>
          <div className="space-y-1">
            <p>
              • Use{" "}
              <Link href="/dev-login" className="underline font-medium hover:text-yellow-900">
                development login
              </Link>{" "}
              (no configuration needed)
            </p>
            <p>
              • Check{" "}
              <Link href="/auth-config-status" className="underline font-medium hover:text-yellow-900">
                authentication status
              </Link>{" "}
              to see what's configured
            </p>
            <p>
              • View{" "}
              <Link href="/docs/CLERK_SIGNUP_CONFIGURATION.md" className="underline font-medium hover:text-yellow-900">
                setup guide
              </Link>{" "}
              for configuration help
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}