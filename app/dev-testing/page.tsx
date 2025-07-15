import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"

export default function DevTestingPage() {
  // Only show in development
  if (process.env.NODE_ENV === "production") {
    return null
  }

  return (
    <div className="container mx-auto max-w-4xl p-6 space-y-6">
      <h1 className="text-3xl font-bold">Development Testing Guide</h1>
      
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Development Mode Only</AlertTitle>
        <AlertDescription>
          These features are only available in development mode to bypass authentication issues.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Testing the Onboarding Enhancement (Issue #98)</CardTitle>
          <CardDescription>
            Follow these steps to test the dynamic onboarding panel updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">1. Create a Test Session</h3>
            <p className="text-sm text-muted-foreground">
              Use the development login to bypass Clerk authentication issues.
            </p>
            <Link href="/dev-login">
              <Button>Go to Dev Login</Button>
            </Link>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">2. Enter Any Email</h3>
            <p className="text-sm text-muted-foreground">
              You can use any email address (e.g., manager@test.com). This will create a development session.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">3. Test the Onboarding Flow</h3>
            <p className="text-sm text-muted-foreground">
              Once logged in, you'll be redirected to the onboarding chat. The right panel should:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-4">
              <li>Show your profile with avatar as you provide your name</li>
              <li>Update your role when you share it</li>
              <li>Display team visualization when you provide team size</li>
              <li>Show "Go to Dashboard" button when all fields are captured</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">4. What Was Implemented</h3>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>✅ Dynamic ProfileDisplay component with avatar and role</li>
              <li>✅ TeamVisualization component with org chart</li>
              <li>✅ OnboardingCompletion component with dashboard button</li>
              <li>✅ Real-time state updates as agent extracts information</li>
              <li>✅ Dynamic completion based on extraction rules from /admin/agents/config</li>
              <li>✅ Fixed admin conversations page to show correct variables</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Direct Links for Testing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex gap-2">
            <Link href="/dev-login">
              <Button variant="outline">Dev Login</Button>
            </Link>
            <Link href="/chat?agent=OnboardingAgent&new=true">
              <Button variant="outline">Onboarding Chat (requires auth)</Button>
            </Link>
            <Link href="/admin/agents/config">
              <Button variant="outline">Agent Config</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}