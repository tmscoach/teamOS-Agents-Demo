"use client"

import React, { useEffect, useState } from "react"
import { useSignIn } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { BlocksDashboard } from "@/components/blocks/blocks-dashboard"
import { Button } from "@/components/ui/anima-button"
import { CardHeader } from "@/components/ui/card-header"
import { Separator } from "@/components/ui/separator"
import Image from "next/image"
import Link from "next/link"

export default function SignInPage() {
  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { isLoaded, signIn, setActive } = useSignIn()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !isLoaded) {
    return null
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signIn) return

    setIsLoading(true)
    try {
      // For email/password sign in
      const result = await signIn.create({
        identifier: email,
        password: password,
      })

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId })
        router.push("/dashboard")
      } else {
        // Handle other statuses like 2FA
        console.log("Sign in requires additional steps", result)
      }
    } catch (err: any) {
      console.error("Error signing in:", err)
      alert(err.errors?.[0]?.message || "Invalid email or password")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthSignIn = async (strategy: "oauth_google" | "oauth_microsoft") => {
    if (!signIn) return

    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/dashboard",
      })
    } catch (err: any) {
      console.error(`Error signing in with ${strategy}:`, err)
      alert(`Error signing in with ${strategy}. Please try again.`)
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
          {/* Sign Up link temporarily disabled */}
        </div>

        <div className="items-center justify-center gap-4 px-6 lg:px-16 pt-4 pb-6 flex-1 grow flex flex-col relative self-stretch w-full">
          <div className="flex flex-col w-full max-w-[440px] items-center justify-center relative flex-1 grow min-h-0">
            <CardHeader
              cardDescriptionDivClassName="!text-center"
              cardDescriptionText="Enter your email below to sign in to your account"
              cardTitleText="Sign In"
              className="!self-stretch !gap-3 !flex-[0_0_auto] !items-center !w-full !px-0 lg:!px-6"
            />
            <form onSubmit={handleEmailSignIn} className="items-start gap-6 pt-0 pb-6 px-0 lg:px-6 flex-[0_0_auto] flex flex-col relative self-stretch w-full">
              <div className="flex-col items-start gap-2 flex relative self-stretch w-full flex-[0_0_auto]">
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
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div className="flex h-9 items-center gap-2 relative self-stretch w-full">
                    <div className="flex flex-col items-start gap-1.5 relative flex-1 grow">
                      <input
                        className="pl-3 pr-3 lg:pr-14 py-2 relative self-stretch w-full rounded-[var(--shadcn-ui-radius-md)] border border-solid border-shadcn-ui-input [background:none] [font-family:'Inter-Regular',Helvetica] font-normal text-[color:var(--shadcn-ui-foreground)] placeholder:text-[color:var(--shadcn-ui-muted-foreground)] text-sm tracking-[0] leading-5"
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
                  className="!self-stretch !h-10 !flex !w-full"
                  size="sm"
                  state="default_1"
                  text1={isLoading ? "Signing in..." : "Sign In with Email"}
                  type="default"
                  disabled={isLoading}
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
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}