'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'

interface AskOsmoContextType {
  isOpen: boolean
  toggleWidget: () => void
  openWidget: () => void
  closeWidget: () => void
}

const AskOsmoContext = createContext<AskOsmoContextType | undefined>(undefined)

export function AskOsmoProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Load saved state on mount
  useEffect(() => {
    const savedState = localStorage.getItem('askOsmoWidgetOpen')
    if (savedState === 'true') {
      setIsOpen(true)
    }
  }, [])
  
  const toggleWidget = () => {
    const newState = !isOpen
    setIsOpen(newState)
    localStorage.setItem('askOsmoWidgetOpen', String(newState))
  }
  
  const openWidget = () => {
    setIsOpen(true)
    localStorage.setItem('askOsmoWidgetOpen', 'true')
  }
  
  const closeWidget = () => {
    setIsOpen(false)
    localStorage.setItem('askOsmoWidgetOpen', 'false')
  }
  
  return (
    <AskOsmoContext.Provider value={{ isOpen, toggleWidget, openWidget, closeWidget }}>
      {children}
    </AskOsmoContext.Provider>
  )
}

export function useAskOsmo() {
  const context = useContext(AskOsmoContext)
  if (context === undefined) {
    throw new Error('useAskOsmo must be used within an AskOsmoProvider')
  }
  return context
}