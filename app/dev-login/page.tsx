"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function DevLoginPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/dev/create-test-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create dev session")
      }

      // Force a page reload to ensure cookies are properly set
      window.location.href = data.redirectUrl || "/chat?agent=OnboardingAgent&new=true"
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  // Note: Production check is handled by middleware
  // This page will return 404 in production

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Development Login</CardTitle>
          <CardDescription>
            Bypass authentication for testing purposes (dev only)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleDevLogin} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Enter any email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating session..." : "Login as Test User"}
            </Button>
          </form>

          <div className="mt-4 text-sm text-muted-foreground">
            <p>This bypasses Clerk authentication for development testing.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}