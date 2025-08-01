'use client'

import { useState } from 'react'
import { Oscar1 } from '@/app/chat/components/icons/Oscar1'
import { AskOskarPanel } from './AskOskarPanel'

interface AskOskarInputProps {
  defaultAgent?: string
  testMode?: boolean
}

export function AskOskarInput({ defaultAgent = 'OrchestratorAgent', testMode = false }: AskOskarInputProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  return (
    <AskOskarPanel 
      isExpanded={isExpanded}
      onCollapse={() => setIsExpanded(false)}
      onExpand={() => setIsExpanded(true)}
      defaultAgent={defaultAgent}
      testMode={testMode}
    />
  )
}