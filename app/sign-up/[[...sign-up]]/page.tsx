"use client"

import React, { useEffect, useState } from "react"
import { useSignUp } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { BlocksDashboard } from "@/components/blocks/blocks-dashboard"
import { Button as AnimaButton } from "@/components/ui/anima-button"
import { Button } from "@/components/ui/button"
import { CardHeader } from "@/components/ui/card-header"
import { Separator } from "@/components/ui/separator"
import Image from "next/image"
import Link from "next/link"

export default function SignUpPage() {
  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { isLoaded, signUp, setActive } = useSignUp()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !isLoaded) {
    return null
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signUp) return

    setIsLoading(true)
    try {
      // Try to create the sign-up with password to potentially bypass CAPTCHA
      const result = await signUp.create({
        emailAddress: email,
        password: password,
      })

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId })
        router.push("/onboarding")
      } else if (result.status === "missing_requirements") {
        // Send verification email if needed
        await signUp.prepareEmailAddressVerification({ 
          strategy: "email_link",
          redirectUrl: window.location.origin + "/sign-up/verify-email"
        })
        router.push("/sign-up/verify-email?email=" + encodeURIComponent(email))
      }
    } catch (err: any) {
      console.error("Error signing up with email:", err)
      
      // Check if it's a CAPTCHA error
      if (err.errors?.[0]?.message?.includes("CAPTCHA")) {
        // Suggest using OAuth as a workaround
        alert("CAPTCHA verification failed. Please try signing up with Google or Microsoft instead, or try a different browser.")
      } else {
        alert(err.errors?.[0]?.message || "Error signing up. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthSignUp = async (strategy: "oauth_google" | "oauth_microsoft") => {
    if (!signUp) return

    try {
      await signUp.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/onboarding",
      })
    } catch (err: any) {
      console.error(`Error signing up with ${strategy}:`, err)
      alert(`Error signing up with ${strategy}. Please try again.`)
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
                "TeamOS helped us build a world-class team culture. The platform's
                insights gave us the clarity we needed to grow from startup to scale-up."
              </p>

              <p className="relative w-fit [font-family:'Inter-Bold',Helvetica] font-bold text-white text-xs lg:text-sm tracking-[0] leading-6 lg:leading-7">
                Marcus Chen, CEO, InnovateTech
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Light Section (appears first on mobile) */}
      <div className="flex flex-col min-h-[400px] h-[50vh] lg:min-h-[600px] lg:h-screen items-start relative w-full lg:w-1/2 bg-white shadow-[0px_1px_2px_#0000000d] overflow-y-auto">
        <div className="items-end gap-1.5 p-6 lg:p-9 pb-0 flex flex-col relative self-stretch w-full">
          <Link href="/sign-in">
            <AnimaButton type="ghost" size="sm">Sign In</AnimaButton>
          </Link>
        </div>

        <div className="items-center justify-center gap-4 px-6 lg:px-16 pt-4 pb-6 flex-1 grow flex flex-col relative self-stretch w-full">
          <div className="flex flex-col w-full max-w-[440px] items-center justify-center relative flex-1 grow min-h-0">
            <div className="flex flex-col items-center gap-3 self-stretch w-full px-0 lg:px-6">
              <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
              <p className="text-sm text-muted-foreground text-center">
                Enter your work email below to create your account
              </p>
            </div>
            
            <form onSubmit={handleEmailSignUp} className="items-start gap-6 pt-6 pb-6 px-0 lg:px-6 flex-[0_0_auto] flex flex-col relative self-stretch w-full">
              <div className="flex-col items-start gap-2 flex relative self-stretch w-full flex-[0_0_auto]">
                <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
                  <div className="flex h-9 items-center gap-2 relative self-stretch w-full">
                    <div className="flex flex-col items-start gap-1.5 relative flex-1 grow">
                      <input
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="name@example.com"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
                  <div className="flex h-9 items-center gap-2 relative self-stretch w-full">
                    <div className="flex flex-col items-start gap-1.5 relative flex-1 grow">
                      <input
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating account..." : "Sign Up with Email"}
                </Button>
                
                {/* Clerk CAPTCHA container */}
                <div id="clerk-captcha" style={{ minHeight: "65px" }}></div>
              </div>

              <div className="items-center gap-3 flex relative self-stretch w-full flex-[0_0_auto]">
                <Separator className="flex-1" />
                <div className="relative w-fit font-normal text-muted-foreground text-xs tracking-[0] leading-5 whitespace-nowrap">
                  OR CONTINUE WITH
                </div>
                <Separator className="flex-1" />
              </div>

              <div className="flex flex-col lg:flex-row items-start gap-3 lg:gap-6 relative self-stretch w-full flex-[0_0_auto]">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleOAuthSignUp("oauth_google")}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Sign up with Google
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleOAuthSignUp("oauth_microsoft")}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 21 21">
                    <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                    <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                    <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                    <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                  </svg>
                  Sign up with Microsoft
                </Button>
              </div>

              <div className="flex items-center justify-center px-0 lg:px-10 py-0 relative self-stretch w-full flex-[0_0_auto]">
                <p className="relative flex-1 font-normal text-muted-foreground text-xs lg:text-sm text-center tracking-[0] leading-5">
                  <span className="text-zinc-500 text-xs lg:text-sm">
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
                  <span className="text-zinc-500 text-xs lg:text-sm">
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
                  <span className="text-zinc-500 text-xs lg:text-sm">
                    .
                  </span>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}