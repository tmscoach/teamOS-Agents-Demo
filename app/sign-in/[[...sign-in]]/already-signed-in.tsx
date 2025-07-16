"use client"

import { useClerk } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function AlreadySignedIn({ email }: { email?: string }) {
  const { signOut } = useClerk()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    // Page will automatically refresh after sign out
  }

  const handleContinue = () => {
    router.push("/dashboard")
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Already Signed In</CardTitle>
          <CardDescription>
            You're already signed in{email ? ` as ${email}` : ""}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleContinue} className="w-full">
            Continue to Dashboard
          </Button>
          <Button onClick={handleSignOut} variant="outline" className="w-full">
            Sign Out and Use Different Account
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}