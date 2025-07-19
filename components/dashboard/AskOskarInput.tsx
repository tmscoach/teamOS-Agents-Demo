'use client'

import { useState } from 'react'
import { Oscar1 } from '@/app/chat/components/icons/Oscar1'
import { useAskOskar } from '@/contexts/AskOskarContext'

export function AskOskarInput() {
  const [query, setQuery] = useState('')
  const { openWidget } = useAskOskar()
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Open the widget instead of redirecting
    openWidget()
    
    // Clear the input
    setQuery('')
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="w-96">
      <div className="flex flex-col items-start gap-1.5 flex-1 grow">
        <div 
          className="flex items-center gap-2 pl-3 pr-3 py-2 self-stretch w-full bg-white rounded-md border border-solid border-gray-300 cursor-pointer hover:border-gray-400 transition-colors"
          onClick={openWidget}
        >
          <Oscar1 className="w-5 h-5 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Oskar"
            className="flex-1 bg-transparent outline-none font-normal text-gray-900 text-sm leading-6 placeholder:text-gray-500 cursor-pointer"
            autoComplete="off"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="submit"
            className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            Open Chat
          </button>
        </div>
      </div>
    </form>
  )
}