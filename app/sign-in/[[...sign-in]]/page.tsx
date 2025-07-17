"use client"

import React, { useEffect, useState } from "react"
import { useSignIn, useClerk } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { BlocksDashboard } from "@/components/blocks/blocks-dashboard"
import { Button } from "@/components/ui/anima-button"
import { CardHeader } from "@/components/ui/card-header"
import { Separator } from "@/components/ui/separator"
import Image from "next/image"
import Link from "next/link"
import { DevModeNotice } from "./dev-mode-notice"
import { AlreadySignedIn } from "./already-signed-in"
import { useClerkConfig, getClerkErrorInfo } from "@/src/lib/auth/clerk-config-check"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function SignInPage() {
  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [verificationPending, setVerificationPending] = useState(false)
  const [usePasswordAuth, setUsePasswordAuth] = useState(false)
  const [error, setError] = useState<{ message: string; isConfig: boolean } | null>(null)
  const { isLoaded, signIn, setActive } = useSignIn()
  const clerk = useClerk()
  const router = useRouter()
  const clerkConfig = useClerkConfig()

  useEffect(() => {
    setMounted(true)
    
    // Check if user is already signed in
    if (isLoaded && clerk.user) {
      // User is already signed in, redirect to dashboard
      router.push("/dashboard")
      return
    }
    
    // Check for URL parameters (e.g., from verification redirect)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const emailParam = urlParams.get('email')
      const verified = urlParams.get('verified')
      
      if (emailParam) {
        setEmail(decodeURIComponent(emailParam))
      }
      
      if (verified === 'true') {
        // User was redirected after verification, force password auth
        setUsePasswordAuth(true)
        setError({
          message: "Email verified! Please enter your password to sign in.",
          isConfig: false
        })
      }
    }
  }, [isLoaded, clerk.user, router])

  useEffect(() => {
    // Use configuration check to determine auth method
    if (clerkConfig.isLoaded) {
      // If email_link is not available but password is, use password auth
      if (!clerkConfig.hasEmailVerificationLink && clerkConfig.hasPasswordAuth) {
        setUsePasswordAuth(true)
      }
    }
  }, [clerkConfig])

  if (!mounted || !isLoaded) {
    return null
  }
  
  // Show already signed in component if user is authenticated
  if (clerk.user) {
    return <AlreadySignedIn email={clerk.user.primaryEmailAddress?.emailAddress} />
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signIn) return

    setIsLoading(true)
    setError(null)
    
    try {
      if (usePasswordAuth) {
        // Use password authentication
        if (!password) {
          setError({
            message: "Please enter your password",
            isConfig: false
          })
          setIsLoading(false)
          return
        }
        
        const result = await signIn.create({
          identifier: email,
          password: password,
        })

        if (result.status === "complete") {
          await setActive({ session: result.createdSessionId })
          router.push("/dashboard")
        } else {
          console.log("Sign in requires additional steps", result)
          setError({
            message: "Sign in requires additional steps. Please contact support.",
            isConfig: false
          })
        }
      } else {
        // Try magic link authentication
        const result = await signIn.create({
          identifier: email,
          strategy: "email_link",
          redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
        })

        if (result.status === "needs_first_factor") {
          // Email link has been sent
          setVerificationPending(true)
          
          // Check for verification completion
          const checkVerification = setInterval(async () => {
            try {
              const updatedSignIn = await signIn.reload()
              if (updatedSignIn.status === "complete") {
                clearInterval(checkVerification)
                await setActive({ session: updatedSignIn.createdSessionId })
                router.push("/dashboard")
              }
            } catch (error) {
              console.error("Error checking verification:", error)
            }
          }, 1000)

          // Clear interval after 5 minutes
          setTimeout(() => clearInterval(checkVerification), 5 * 60 * 1000)
          
          // Redirect to verification page
          router.push(`/sign-in/verify-email?email=${encodeURIComponent(email)}`)
        }
      }
    } catch (err: any) {
      console.error("Error signing in:", err)
      
      const errorInfo = getClerkErrorInfo(err)
      
      // Check if error is due to email link not being enabled
      if (errorInfo.code === "strategy_not_allowed" || 
          err.message?.includes("email_link does not match") ||
          err.message?.includes("is invalid")) {
        // This error often means the user exists but email link isn't available
        // Let's try password auth
        setUsePasswordAuth(true)
        setError({
          message: "Please enter your password to sign in.",
          isConfig: false
        })
      } else if (errorInfo.code === "form_identifier_not_found") {
        setError({
          message: "No account found with this email.",
          isConfig: false
        })
        setTimeout(() => router.push("/sign-up"), 2000)
      } else if (errorInfo.code === "form_password_incorrect") {
        setError({
          message: "Incorrect password. Please try again.",
          isConfig: false
        })
      } else {
        setError({
          message: errorInfo.suggestedAction || errorInfo.message,
          isConfig: errorInfo.isConfigurationError
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthSignIn = async (strategy: "oauth_google" | "oauth_microsoft") => {
    if (!signIn) return

    setError(null)
    
    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/dashboard",
      })
    } catch (err: any) {
      console.error(`Error signing in with ${strategy}:`, err)
      const errorInfo = getClerkErrorInfo(err)
      
      setError({
        message: errorInfo.suggestedAction || `Unable to sign in with ${strategy.replace('oauth_', '')}. ${errorInfo.message}`,
        isConfig: errorInfo.isConfigurationError
      })
    }
  }

  return (
    <div
      className="flex flex-col-reverse lg:flex-row w-full min-h-screen items-start relative overflow-hidden"
      data-shadcn-ui-mode="light-zinc"
    >
      {/* Left Column - Dark Section (appears second on mobile) */}
      <div className="flex flex-col min-h-[400px] h-[50vh] lg:min-h-[600px] lg:h-screen items-start relative w-full lg:w-1/2 shadow-[0px_1px_2px_#0000000d] overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/marcus-chen.png"
            alt="Marcus Chen"
            fill
            className="object-cover object-center"
            priority
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.3)_0%,rgba(0,0,0,0.9)_100%)]" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col h-full w-full">
          <div className="flex flex-col items-start gap-1.5 p-6 lg:p-9 relative self-stretch w-full">
            <div className="inline-flex items-center gap-3 relative">
              <BlocksDashboard className="scale-75 lg:scale-100 origin-left" />
            </div>
          </div>

          {/* Spacer to push content to bottom */}
          <div className="flex-1" />

          <div className="flex flex-col items-start justify-end gap-4 p-6 lg:p-8 relative self-stretch w-full">
            <div className="inline-flex flex-col items-start gap-2 relative max-w-md">
              <p className="relative [font-family:'Inter-Regular',Helvetica] font-normal text-white text-sm lg:text-base tracking-[0] leading-6 lg:leading-7">
                "TeamOS helped me resolve team conflicts before they even surfaced
                - it&apos;s like having a team dynamics expert whispering in my ear
                24/7."
              </p>

              <p className="relative w-fit [font-family:'Inter-Bold',Helvetica] font-bold text-white text-xs lg:text-sm tracking-[0] leading-6 lg:leading-7">
                Marcus Chen, Engineering Manager, CloudScale Technologies
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Light Section (appears first on mobile) */}
      <div className="flex flex-col min-h-[400px] h-[50vh] lg:min-h-[600px] lg:h-screen items-start relative w-full lg:w-1/2 bg-white lg:bg-[color:var(--shadcn-ui-card)] shadow-[0px_1px_2px_#0000000d] overflow-y-auto">
        <div className="items-end gap-1.5 p-6 lg:p-9 pb-0 flex flex-col relative self-stretch w-full">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Don't have an account?</span>
            <Link href="/sign-up" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </div>

        <div className="items-center justify-center gap-4 px-6 lg:px-16 pt-4 pb-6 flex-1 grow flex flex-col relative self-stretch w-full">
          <div className="flex flex-col w-full max-w-[440px] items-center justify-center relative flex-1 grow min-h-0">
            <CardHeader
              cardDescriptionDivClassName="!text-center"
              cardDescriptionText={usePasswordAuth ? "Enter your email and password to sign in" : "Enter your email below to receive a sign-in link"}
              cardTitleText="Sign In"
              className="!self-stretch !gap-3 !flex-[0_0_auto] !items-center !w-full !px-0 lg:!px-6"
            />
            <form onSubmit={handleEmailSignIn} className="items-start gap-6 pt-0 pb-6 px-0 lg:px-6 flex-[0_0_auto] flex flex-col relative self-stretch w-full">
              <div className="flex-col items-start gap-2 flex relative self-stretch w-full flex-[0_0_auto]">
                {error && (
                  <Alert className={error.isConfig ? "border-orange-500" : "border-red-500"}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {error.message}
                      {error.isConfig && (
                        <div className="mt-2">
                          <Link href="/auth-config-status" className="text-sm underline">
                            Check configuration status
                          </Link>
                          {" | "}
                          <Link href="/dev-login" className="text-sm underline">
                            Use dev login
                          </Link>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
                  <div className="flex h-9 items-center gap-2 relative self-stretch w-full">
                    <div className="flex flex-col items-start gap-1.5 relative flex-1 grow">
                      <input
                        className="pl-3 pr-3 lg:pr-14 py-2 relative self-stretch w-full rounded-[var(--shadcn-ui-radius-md)] border border-solid border-shadcn-ui-input [background:none] [font-family:'Inter-Regular',Helvetica] font-normal text-[color:var(--shadcn-ui-foreground)] placeholder:text-[color:var(--shadcn-ui-muted-foreground)] text-sm tracking-[0] leading-5"
                        placeholder="name@example.com"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading || verificationPending}
                      />
                    </div>
                  </div>
                  {usePasswordAuth && (
                    <div className="flex h-9 items-center gap-2 relative self-stretch w-full">
                      <div className="flex flex-col items-start gap-1.5 relative flex-1 grow">
                        <input
                          className="pl-3 pr-3 lg:pr-14 py-2 relative self-stretch w-full rounded-[var(--shadcn-ui-radius-md)] border border-solid border-shadcn-ui-input [background:none] [font-family:'Inter-Regular',Helvetica] font-normal text-[color:var(--shadcn-ui-foreground)] placeholder:text-[color:var(--shadcn-ui-muted-foreground)] text-sm tracking-[0] leading-5"
                          placeholder="Password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required={usePasswordAuth}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  className="!self-stretch !h-10 !flex !w-full"
                  size="sm"
                  state="default_1"
                  text1={isLoading ? (usePasswordAuth ? "Signing in..." : "Sending link...") : verificationPending ? "Check your email" : (usePasswordAuth ? "Sign In" : "Send Sign-In Link")}
                  type="default"
                  disabled={isLoading || verificationPending}
                />
              </div>

              <div className="items-center gap-3 flex relative self-stretch w-full flex-[0_0_auto]">
                <Separator
                  className="!flex-1 !relative !grow !w-[unset]"
                  orientation="horizontal"
                />
                <div className="relative w-fit [font-family:'Inter-Regular',Helvetica] font-normal text-[color:var(--shadcn-ui-muted-foreground)] text-xs tracking-[0] leading-5 whitespace-nowrap">
                  OR CONTINUE WITH
                </div>

                <Separator
                  className="!flex-1 !relative !grow !w-[unset]"
                  orientation="horizontal"
                />
              </div>

              <div className="flex flex-col lg:flex-row items-start gap-3 lg:gap-6 relative self-stretch w-full flex-[0_0_auto]">
                <button 
                  type="button"
                  onClick={() => handleOAuthSignIn("oauth_google")}
                  className="all-[unset] box-border flex h-9 flex-1 w-full lg:w-auto grow bg-[color:var(--shadcn-ui-background)] border border-solid border-[color:var(--shadcn-ui-border)] items-center justify-center gap-2.5 px-3 py-0 relative rounded-[var(--shadcn-ui-radius-md)] hover:bg-[color:var(--shadcn-ui-muted)] transition-colors cursor-pointer"
                >
                  <Image
                    className="relative w-4 h-4"
                    alt="Google black icon"
                    src="/icons/google-black-icon-1.svg"
                    width={16}
                    height={16}
                  />

                  <div className="relative w-fit [font-family:'Inter-Medium',Helvetica] font-medium text-[color:var(--shadcn-ui-foreground)] text-sm tracking-[0] leading-6 whitespace-nowrap">
                    Sign in with Google
                  </div>
                </button>

                <button 
                  type="button"
                  onClick={() => handleOAuthSignIn("oauth_microsoft")}
                  className="all-[unset] box-border flex h-9 flex-1 w-full lg:w-auto grow bg-[color:var(--shadcn-ui-background)] border border-solid border-[color:var(--shadcn-ui-border)] items-center justify-center gap-2.5 px-3 py-0 relative rounded-[var(--shadcn-ui-radius-md)] hover:bg-[color:var(--shadcn-ui-muted)] transition-colors cursor-pointer"
                >
                  <Image
                    className="relative w-4 h-4"
                    alt="Microsoft icon"
                    src="/icons/microsoft-icon-1.svg"
                    width={16}
                    height={16}
                  />

                  <div className="relative w-fit [font-family:'Inter-Medium',Helvetica] font-medium text-[color:var(--shadcn-ui-foreground)] text-sm tracking-[0] leading-6 whitespace-nowrap">
                    Sign in with Microsoft
                  </div>
                </button>
              </div>

              <div className="flex items-center justify-center px-0 lg:px-10 py-0 relative self-stretch w-full flex-[0_0_auto]">
                <p className="relative flex-1 [font-family:'Inter-Regular',Helvetica] font-normal text-[color:var(--shadcn-ui-muted-foreground)] text-xs lg:text-sm text-center tracking-[0] leading-5">
                  <span className="[font-family:'Inter-Regular',Helvetica] font-normal text-zinc-500 text-xs lg:text-sm tracking-[0] leading-5">
                    By clicking continue, you agree to our{" "}
                  </span>

                  <a
                    href="/terms"
                    rel="noopener noreferrer"
                    target="_blank"
                    className="inline-block"
                  >
                    <span className="underline hover:text-zinc-700 transition-colors">Terms of Service</span>
                  </a>

                  <span className="[font-family:'Inter-Regular',Helvetica] font-normal text-zinc-500 text-xs lg:text-sm tracking-[0] leading-5">
                    {" "}
                    and{" "}
                  </span>

                  <a
                    href="/privacy"
                    rel="noopener noreferrer"
                    target="_blank"
                    className="inline-block"
                  >
                    <span className="underline hover:text-zinc-700 transition-colors">Privacy Policy</span>
                  </a>

                  <span className="[font-family:'Inter-Regular',Helvetica] font-normal text-zinc-500 text-xs lg:text-sm tracking-[0] leading-5">
                    .
                  </span>
                </p>
              </div>
              
              <DevModeNotice />
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}