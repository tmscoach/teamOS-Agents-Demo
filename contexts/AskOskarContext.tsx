'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'

interface AskOskarContextType {
  isOpen: boolean
  toggleWidget: () => void
  openWidget: () => void
  closeWidget: () => void
}

const AskOskarContext = createContext<AskOskarContextType | undefined>(undefined)

export function AskOskarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Load saved state on mount
  useEffect(() => {
    const savedState = localStorage.getItem('askOskarWidgetOpen')
    if (savedState === 'true') {
      setIsOpen(true)
    }
  }, [])
  
  const toggleWidget = () => {
    const newState = !isOpen
    setIsOpen(newState)
    localStorage.setItem('askOskarWidgetOpen', String(newState))
  }
  
  const openWidget = () => {
    setIsOpen(true)
    localStorage.setItem('askOskarWidgetOpen', 'true')
  }
  
  const closeWidget = () => {
    setIsOpen(false)
    localStorage.setItem('askOskarWidgetOpen', 'false')
  }
  
  return (
    <AskOskarContext.Provider value={{ isOpen, toggleWidget, openWidget, closeWidget }}>
      {children}
    </AskOskarContext.Provider>
  )
}

export function useAskOskar() {
  const context = useContext(AskOskarContext)
  if (context === undefined) {
    throw new Error('useAskOskar must be used within an AskOskarProvider')
  }
  return context
}