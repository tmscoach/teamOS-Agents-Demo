"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { TeamOSLogo } from "@/components/ui/teamos-logo"

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2">
          <TeamOSLogo />
          <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
          <p className="text-sm text-muted-foreground text-center">
            We sent a sign-in link to {email}
          </p>
        </div>
        
        <div className="rounded-lg border bg-muted p-4">
          <p className="text-sm text-center">
            Click the link in your email to sign in. The link will expire in 15 minutes.
          </p>
        </div>
        
        <div className="flex flex-col gap-2">
          <p className="text-xs text-center text-muted-foreground">
            Didn't receive the email? Check your spam folder or
          </p>
          <Link href="/sign-in">
            <Button variant="outline" className="w-full">
              Try again
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}