"use client"

import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { TeamOSLogo } from "@/components/ui/teamos-logo"
import { Suspense, useState, useEffect } from "react"
import { useSignUp } from "@clerk/nextjs"

function VerifySignUpEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""
  const router = useRouter()
  const { isLoaded, signUp, setActive } = useSignUp()
  const [code, setCode] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState("")

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded || !signUp) return

    setIsVerifying(true)
    setError("")

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      })

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId })
        router.push("/chat?agent=OnboardingAgent&new=true")
      } else {
        setError("Verification failed. Please try again.")
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Invalid verification code")
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2">
          <TeamOSLogo />
          <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
          <p className="text-sm text-muted-foreground text-center">
            We sent a verification code to {email}
          </p>
        </div>
        
        <form onSubmit={handleVerification} className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <label htmlFor="code" className="text-sm font-medium mb-2 block">
              Enter your 6-digit code
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              maxLength={6}
              pattern="[0-9]{6}"
              required
              disabled={isVerifying}
            />
            {error && (
              <p className="text-sm text-red-600 mt-2">{error}</p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isVerifying || code.length !== 6}
          >
            {isVerifying ? "Verifying..." : "Verify Email"}
          </Button>
        </form>
        
        <div className="flex flex-col gap-2">
          <p className="text-xs text-center text-muted-foreground">
            Didn't receive the email? Check your spam folder or
          </p>
          <Link href="/sign-up">
            <Button variant="outline" className="w-full">
              Try again
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function VerifySignUpEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifySignUpEmailContent />
    </Suspense>
  )
}