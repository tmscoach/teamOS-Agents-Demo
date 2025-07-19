'use client'

import { AskOskarProvider } from '@/contexts/AskOskarContext'
import { ReactNode } from 'react'

export function DashboardWrapper({ children }: { children: ReactNode }) {
  return (
    <AskOskarProvider>
      {children}
    </AskOskarProvider>
  )
}