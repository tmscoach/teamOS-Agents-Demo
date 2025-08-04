'use client'

import { useEffect, useState } from 'react'
import { useAskOsmo } from '@/contexts/AskOsmoContext'
import { UnifiedChat } from '@/src/components/unified-chat/UnifiedChat'
import { JourneyPhase } from '@/src/components/unified-chat/types'

export interface UnifiedAskOsmoWidgetProps {
  userId: string;
  userName: string;
  hasCompletedTMP: boolean;
  credits: number;
  journeyPhase: JourneyPhase;
  completedSteps: string[];
  defaultAgent?: string;
  initiallyExpanded?: boolean;
}

export function UnifiedAskOsmoWidget({ 
  userId,
  userName,
  hasCompletedTMP,
  credits,
  journeyPhase,
  completedSteps,
  defaultAgent = 'OrchestratorAgent',
  initiallyExpanded = false
}: UnifiedAskOsmoWidgetProps) {
  const { isOpen, openWidget, closeWidget } = useAskOsmo()
  const [shouldShowProactive, setShouldShowProactive] = useState(false)
  
  // Handle initial expansion and proactive message
  useEffect(() => {
    // If user hasn't completed TMP and this is their first visit, open with proactive message
    const hasSeenProactive = localStorage.getItem('hasSeenProactiveMessage')
    
    if (!hasCompletedTMP && !hasSeenProactive) {
      setShouldShowProactive(true)
      openWidget()
      localStorage.setItem('hasSeenProactiveMessage', 'true')
    } else if (initiallyExpanded && !isOpen) {
      openWidget()
    }
  }, [initiallyExpanded, hasCompletedTMP, openWidget, isOpen])
  
  return (
    <UnifiedChat
      mode="standard"
      position="overlay"
      agent={defaultAgent}
      defaultOpen={isOpen}
      onClose={closeWidget}
      initialContext={{
        user: {
          id: userId,
          name: userName,
          hasCompletedTMP,
          credits
        },
        journey: {
          phase: journeyPhase,
          completedSteps,
          nextMilestone: hasCompletedTMP ? 'Team Assessment' : 'Complete TMP'
        }
      }}
      proactiveMessage={shouldShowProactive ? {
        type: 'dashboard_landing',
        data: { journeyPhase, hasCompletedTMP }
      } : undefined}
    />
  )
}