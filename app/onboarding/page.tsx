"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { UserButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, Circle } from 'lucide-react'

interface JourneyData {
  status: string
  currentAgent: string | null
  completedSteps: string[]
  nextStep: {
    id: string
    name: string
    description: string
    agent: string
  } | null
}

export default function OnboardingPage() {
  const router = useRouter()
  const { user } = useUser()
  const [journey, setJourney] = useState<JourneyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchJourneyStatus()
    }
  }, [user])

  const fetchJourneyStatus = async () => {
    try {
      setError(null)
      const response = await fetch('/api/user/journey')
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch journey status: ${response.status}`)
      }
      
      const data = await response.json()
      setJourney(data)
      
      // If onboarding is complete, redirect to dashboard
      if (data.status === 'ACTIVE') {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error fetching journey status:', error)
      setError(error instanceof Error ? error.message : 'Failed to load journey status')
    } finally {
      setLoading(false)
    }
  }

  const handleContinue = () => {
    if (journey?.nextStep) {
      // Navigate to the agent chat with the current step context
      router.push(`/chat?agent=${journey.nextStep.agent}&step=${journey.nextStep.id}`)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your journey...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => fetchJourneyStatus()} variant="default">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const onboardingSteps = [
    { id: 'welcome', name: 'Welcome & Introduction' },
    { id: 'team_context', name: 'Team Context' },
    { id: 'goals_setting', name: 'Goals Setting' },
    { id: 'initial_assessment', name: 'Initial Assessment' },
    { id: 'transformation_plan', name: 'Transformation Plan' }
  ]

  const completedCount = journey?.completedSteps.length || 0
  const totalSteps = onboardingSteps.length
  const progress = (completedCount / totalSteps) * 100

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header with UserButton */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Welcome to TeamOS, {user?.firstName || 'Team Manager'}!</h1>
          <p className="text-muted-foreground">
            Let's get you started on your team transformation journey.
          </p>
        </div>
        <UserButton afterSignOutUrl="/sign-in" />
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Your Onboarding Progress</CardTitle>
          <CardDescription>Complete these steps to unlock the full power of TeamOS</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="mb-6" />
          <div className="space-y-4">
            {onboardingSteps.map((step) => {
              const isCompleted = journey?.completedSteps.includes(step.id)
              const isCurrent = journey?.nextStep?.id === step.id
              
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 p-4 rounded-lg border transition-colors ${
                    isCompleted
                      ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                      : isCurrent
                      ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                      : 'bg-gray-50 border-gray-200 dark:bg-gray-800/30 dark:border-gray-700'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  )}
                  <span className={`font-medium ${
                    isCompleted 
                      ? 'text-green-700 dark:text-green-300' 
                      : isCurrent
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}>
                    {step.name}
                  </span>
                  {isCurrent && (
                    <span className="ml-auto text-sm text-blue-600 dark:text-blue-400 font-medium">
                      Current Step
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {journey?.nextStep && (
        <Card>
          <CardHeader>
            <CardTitle>Next Step: {journey.nextStep.name}</CardTitle>
            <CardDescription>{journey.nextStep.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleContinue} size="lg" className="w-full sm:w-auto">
              Continue Onboarding
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}