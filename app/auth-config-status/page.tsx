"use client"

import { useClerkConfig, getClerkDashboardUrl } from "@/src/lib/auth/clerk-config-check"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, AlertCircle, ExternalLink, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function AuthConfigStatusPage() {
  const clerkConfig = useClerkConfig()
  const router = useRouter()

  // Only allow access in development mode
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      router.push('/')
    }
  }, [router])

  if (!clerkConfig.isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse">Loading configuration...</div>
      </div>
    )
  }

  const StatusIcon = ({ enabled }: { enabled: boolean }) => {
    return enabled ? (
      <CheckCircle2 className="h-5 w-5 text-green-600" />
    ) : (
      <XCircle className="h-5 w-5 text-red-600" />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Link href="/sign-up">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sign Up
            </Button>
          </Link>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Clerk Authentication Configuration Status</CardTitle>
            <CardDescription>
              Current state of authentication methods in your Clerk instance
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!clerkConfig.isConfigured && (
              <Alert className="mb-6 border-red-500">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warning:</strong> No authentication methods are configured in Clerk.
                  Users will not be able to sign up or sign in without proper configuration.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Email Verification Methods</h3>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <StatusIcon enabled={clerkConfig.hasEmailVerificationLink} />
                    <div>
                      <p className="font-medium">Email Verification Link (Magic Link)</p>
                      <p className="text-sm text-muted-foreground">
                        Users receive a clickable link to verify their email
                      </p>
                    </div>
                  </div>
                  {!clerkConfig.hasEmailVerificationLink && (
                    <span className="text-sm text-red-600">Not Configured</span>
                  )}
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <StatusIcon enabled={clerkConfig.hasEmailVerificationCode} />
                    <div>
                      <p className="font-medium">Email Verification Code</p>
                      <p className="text-sm text-muted-foreground">
                        Users receive a 6-digit code to verify their email
                      </p>
                    </div>
                  </div>
                  {!clerkConfig.hasEmailVerificationCode && (
                    <span className="text-sm text-red-600">Not Configured</span>
                  )}
                </div>
              </div>

              <h3 className="text-lg font-semibold mt-6">Other Authentication Methods</h3>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <StatusIcon enabled={clerkConfig.hasPasswordAuth} />
                    <div>
                      <p className="font-medium">Password Authentication</p>
                      <p className="text-sm text-muted-foreground">
                        Traditional email and password login
                      </p>
                    </div>
                  </div>
                  {!clerkConfig.hasPasswordAuth && (
                    <span className="text-sm text-red-600">Not Configured</span>
                  )}
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <StatusIcon enabled={clerkConfig.hasGoogleOAuth} />
                    <div>
                      <p className="font-medium">Google OAuth</p>
                      <p className="text-sm text-muted-foreground">
                        Sign in with Google account
                      </p>
                    </div>
                  </div>
                  {!clerkConfig.hasGoogleOAuth && (
                    <span className="text-sm text-red-600">Not Configured</span>
                  )}
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <StatusIcon enabled={clerkConfig.hasMicrosoftOAuth} />
                    <div>
                      <p className="font-medium">Microsoft OAuth</p>
                      <p className="text-sm text-muted-foreground">
                        Sign in with Microsoft account
                      </p>
                    </div>
                  </div>
                  {!clerkConfig.hasMicrosoftOAuth && (
                    <span className="text-sm text-red-600">Not Configured</span>
                  )}
                </div>
              </div>

              <div className="mt-6 rounded-lg bg-gray-100 p-4">
                <h4 className="font-medium mb-2">Available Strategies</h4>
                <div className="flex flex-wrap gap-2">
                  {clerkConfig.availableStrategies.length > 0 ? (
                    clerkConfig.availableStrategies.map((strategy) => (
                      <span
                        key={strategy}
                        className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-800"
                      >
                        {strategy}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      No authentication strategies configured
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Configure authentication methods in your Clerk dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link 
              href={getClerkDashboardUrl('email-phone-username')}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="w-full justify-between">
                Configure Email & Authentication Methods
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>

            <Link 
              href={getClerkDashboardUrl('email-templates')}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="w-full justify-between">
                Customize Email Templates
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>

            <Link 
              href={getClerkDashboardUrl('logs')}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="w-full justify-between">
                View Authentication Logs
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>

            <div className="mt-6 pt-6 border-t">
              <Link href="/dev-login">
                <Button className="w-full">
                  Use Dev Login (No Configuration Required)
                </Button>
              </Link>
            </div>

            <div className="mt-4 rounded-lg bg-blue-50 p-4">
              <p className="text-sm text-blue-900">
                <strong>Tip:</strong> For quick testing without configuring Clerk, use the{" "}
                <Link href="/dev-login" className="underline">
                  dev login
                </Link>{" "}
                which bypasses all authentication requirements in development mode.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>This page is only available in development mode</p>
          <Link 
            href="/docs/CLERK_SIGNUP_CONFIGURATION.md" 
            className="underline hover:text-foreground"
          >
            View detailed configuration guide
          </Link>
        </div>
      </div>
    </div>
  )
}