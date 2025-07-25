'use client'

import { MessageCircle, X } from 'lucide-react'
import { Oscar1 } from '@/app/chat/components/icons/Oscar1'
import { ChatOverlay } from './ChatOverlay'
import { useAskOskar } from '@/contexts/AskOskarContext'

export function AskOskarWidget() {
  const { isOpen, toggleWidget } = useAskOskar()
  
  return (
    <>
      {/* Floating button */}
      <button
        onClick={toggleWidget}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group"
        aria-label={isOpen ? 'Close Ask Oskar' : 'Open Ask Oskar'}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <div className="relative">
            <MessageCircle className="w-6 h-6" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
          </div>
        )}
      </button>
      
      {/* Tooltip on hover when closed */}
      {!isOpen && (
        <div className="fixed bottom-6 right-24 z-40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap flex items-center gap-2">
            <Oscar1 className="w-4 h-4" />
            Ask Oskar anything
          </div>
        </div>
      )}
      
      {/* Chat overlay */}
      <ChatOverlay isOpen={isOpen} onClose={toggleWidget} />
    </>
  )
}