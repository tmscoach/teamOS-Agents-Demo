"use client"

import Link from "next/link"
import { AlertCircle } from "lucide-react"

export function DevModeNotice() {
  if (process.env.NODE_ENV !== "development") {
    return null
  }

  return (
    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-yellow-800">
          <p className="font-medium mb-1">Development Mode</p>
          <p className="mb-2">
            Sign-up requires email configuration in Clerk dashboard.
          </p>
          <p>
            For testing, you can use the{" "}
            <Link href="/dev-login" className="underline font-medium hover:text-yellow-900">
              development login
            </Link>{" "}
            to bypass authentication.
          </p>
        </div>
      </div>
    </div>
  )
}