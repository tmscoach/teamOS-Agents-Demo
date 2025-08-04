'use client'

import { useState, useEffect } from 'react'
import { Oscar1 } from '@/app/chat/components/icons/Oscar1'

export function AskOsmoInputWidget({ onToggleWidget }: { onToggleWidget: () => void }) {
  const [query, setQuery] = useState('')
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Open the widget
    onToggleWidget()
    
    // If there's a query, we could pass it to the widget
    // For now, just clear the input
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
        <div className="flex items-center gap-2 pl-3 pr-3 py-2 self-stretch w-full bg-white rounded-md border border-solid border-gray-300 cursor-pointer hover:border-gray-400 transition-colors"
             onClick={onToggleWidget}>
          <Oscar1 className="w-5 h-5 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Osmo"
            className="flex-1 bg-transparent outline-none font-normal text-gray-900 text-sm leading-6 placeholder:text-gray-500 cursor-pointer"
            autoComplete="off"
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