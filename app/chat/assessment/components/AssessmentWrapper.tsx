'use client'

import { AskOsmoProvider } from '@/contexts/AskOsmoContext'
import { ReactNode } from 'react'

export function AssessmentWrapper({ children }: { children: ReactNode }) {
  return (
    <AskOsmoProvider>
      {children}
    </AskOsmoProvider>
  )
}