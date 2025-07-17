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
      console.log("Current sign-up status before verification:", signUp.status)
      console.log("Current sign-up object:", {
        status: signUp.status,
        missingFields: signUp.missingFields,
        unverifiedFields: signUp.unverifiedFields,
        requiredFields: signUp.requiredFields,
        optionalFields: signUp.optionalFields,
      })

      // First attempt verification
      let completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      })
      
      // If there are missing requirements, try to handle them
      if (completeSignUp.status === "missing_requirements" && completeSignUp.missingFields) {
        console.log("Attempting to handle missing fields:", completeSignUp.missingFields)
        
        // Try to update with common missing fields
        const updateData: any = {}
        
        if (completeSignUp.missingFields.includes("username")) {
          // Generate username from email
          updateData.username = email.split('@')[0]
        }
        
        if (completeSignUp.missingFields.includes("first_name")) {
          updateData.firstName = email.split('@')[0]
        }
        
        if (completeSignUp.missingFields.includes("last_name")) {
          updateData.lastName = "User"
        }
        
        if (Object.keys(updateData).length > 0) {
          console.log("Updating sign-up with:", updateData)
          try {
            completeSignUp = await signUp.update(updateData)
          } catch (updateErr) {
            console.error("Failed to update sign-up:", updateErr)
          }
        }
      }

      console.log("Sign-up status after verification:", completeSignUp.status)
      console.log("Complete sign-up object:", {
        status: completeSignUp.status,
        missingFields: completeSignUp.missingFields,
        unverifiedFields: completeSignUp.unverifiedFields,
        requiredFields: completeSignUp.requiredFields,
        optionalFields: completeSignUp.optionalFields,
      })

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId })
        router.push("/chat?agent=OnboardingAgent&new=true")
      } else if (completeSignUp.status === "missing_requirements") {
        // Log detailed information about what's missing
        console.error("Missing requirements after verification:", completeSignUp.missingFields)
        console.error("All missing fields:", completeSignUp.missingFields)
        console.error("Required fields:", completeSignUp.requiredFields)
        
        // Check if specific fields are missing
        if (completeSignUp.missingFields?.includes("username")) {
          setError("Username is required. This appears to be a Clerk configuration issue.")
        } else if (completeSignUp.missingFields?.includes("first_name") || 
                   completeSignUp.missingFields?.includes("last_name")) {
          setError("Name is required. This appears to be a Clerk configuration issue.")
        } else {
          setError(`Missing required information: ${completeSignUp.missingFields?.join(", ")}`)
        }
        
        // Don't redirect, let user see the error
        console.error("Cannot complete sign-up due to missing fields")
      } else {
        console.error("Unexpected status after verification:", completeSignUp.status)
        setError("Verification failed. Please try again.")
      }
    } catch (err: any) {
      console.error("Verification error:", err)
      console.error("Error details:", {
        code: err.errors?.[0]?.code,
        message: err.errors?.[0]?.message,
        longMessage: err.errors?.[0]?.longMessage,
      })

      // Check if already verified
      if (err.errors?.[0]?.code === "verification_already_verified") {
        // Try to complete the sign-up process
        if (signUp.status === "complete") {
          await setActive({ session: signUp.createdSessionId })
          router.push("/chat?agent=OnboardingAgent&new=true")
        } else {
          setError("Your email is already verified. Please sign in instead.")
          setTimeout(() => {
            router.push(`/sign-in?email=${encodeURIComponent(email)}`)
          }, 2000)
        }
      } else if (err.errors?.[0]?.code === "form_identifier_exists") {
        setError("This email is already registered. Redirecting to sign-in...")
        setTimeout(() => {
          router.push(`/sign-in?email=${encodeURIComponent(email)}`)
        }, 2000)
      } else {
        setError(err.errors?.[0]?.message || "Invalid verification code")
      }
    } finally {
      setIsVerifying(false)
    }
  }

  // Check if already verified on mount
  useEffect(() => {
    if (isLoaded && signUp && signUp.status === "complete") {
      setActive({ session: signUp.createdSessionId }).then(() => {
        router.push("/chat?agent=OnboardingAgent&new=true")
      })
    }
  }, [isLoaded, signUp, setActive, router])

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

        {error?.includes("already verified") && (
          <div className="rounded-lg border bg-muted p-4">
            <p className="text-sm text-center mb-2">
              Your email is already verified!
            </p>
            <Link href="/sign-in">
              <Button variant="secondary" className="w-full">
                Go to Sign In
              </Button>
            </Link>
          </div>
        )}
        
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