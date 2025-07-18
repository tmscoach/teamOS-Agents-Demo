"use client"

import Link from "next/link"
import { AlertCircle, ArrowRight } from "lucide-react"
import { useClerkConfig } from "@/src/lib/auth/clerk-config-check"

export function DevModeNotice() {
  const clerkConfig = useClerkConfig()
  
  if (process.env.NODE_ENV !== "development") {
    return null
  }

  const hasEmailAuth = clerkConfig.hasEmailVerificationCode || clerkConfig.hasEmailVerificationLink

  return (
    <div className="mt-6 space-y-3">
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">Development Mode - Quick Access</p>
            {clerkConfig.isLoaded && !hasEmailAuth && !clerkConfig.hasPasswordAuth && (
              <p className="mb-2 text-red-700 font-medium">
                ⚠️ No authentication methods configured in Clerk
              </p>
            )}
            <p className="mb-3">
              For testing without email configuration:
            </p>
            <Link 
              href="/dev-login" 
              className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md font-medium transition-colors"
            >
              Use Development Login
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
      
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
        <p className="text-xs text-gray-600">
          <strong>Quick Links:</strong>{" "}
          <Link href="/auth-config-status" className="underline hover:text-gray-800">
            Check auth status
          </Link>
          {" • "}
          <Link href="/docs/CLERK_MAGIC_LINK_SETUP.md" className="underline hover:text-gray-800">
            Setup guide
          </Link>
          {" • "}
          <a 
            href="https://dashboard.clerk.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline hover:text-gray-800"
          >
            Clerk dashboard
          </a>
          {" • "}
          <Link href="/sign-up" className="underline hover:text-gray-800">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}