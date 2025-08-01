'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X, Maximize2, ExternalLink } from 'lucide-react'
import { Oscar1 } from '@/app/chat/components/icons/Oscar1'
import { EmbeddedChat } from './EmbeddedChat'
import Link from 'next/link'

interface ChatOverlayProps {
  isOpen: boolean
  onClose: () => void
  defaultAgent?: string
  testMode?: boolean
}

export function ChatOverlay({ isOpen, onClose, defaultAgent, testMode }: ChatOverlayProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
          />
          
          {/* Chat panel */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-6 z-50 w-96 h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center gap-2">
                <Oscar1 className="w-6 h-6 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Ask Oskar</h3>
              </div>
              
              <div className="flex items-center gap-2">
                <Link
                  href={`/chat?agent=${defaultAgent || 'OrchestratorAgent'}${testMode ? '&testMode=true' : ''}`}
                  target="_blank"
                  className="p-1.5 hover:bg-white/80 rounded-md transition-colors"
                  title="Open in full chat"
                >
                  <ExternalLink className="w-4 h-4 text-gray-600" />
                </Link>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-white/80 rounded-md transition-colors"
                  aria-label="Close chat"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
            
            {/* Chat content */}
            <div className="flex-1 overflow-hidden">
              <EmbeddedChat 
                agentName={defaultAgent}
                testMode={testMode}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}