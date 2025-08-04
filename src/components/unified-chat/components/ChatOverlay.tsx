'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X, Maximize2, ExternalLink, MessageCircle } from 'lucide-react';
import { Oscar1 } from '@/app/chat/components/icons/Oscar1';
import { useChatContext } from './ChatProvider';
import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import Link from 'next/link';

export function ChatOverlay() {
  const { context, state, onOpen, onClose } = useChatContext();

  return (
    <>
      {/* Floating button */}
      {!state.isOpen && (
        <button
          onClick={onOpen}
          className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group"
          aria-label="Open chat"
        >
          <div className="relative">
            <MessageCircle className="w-6 h-6" />
            {/* Show notification dot if there's a proactive message */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
          </div>
        </button>
      )}

      {/* Tooltip */}
      {!state.isOpen && (
        <div className="fixed bottom-6 right-24 z-40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap flex items-center gap-2">
            <Oscar1 className="w-4 h-4" />
            Ask Osmo anything
          </div>
        </div>
      )}

      {/* Chat overlay */}
      <AnimatePresence>
        {state.isOpen && (
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
              <div className="border-b border-gray-200">
                <ChatHeader isExpanded={true} showExpandButton={false} />
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-hidden">
                <ChatMessages />
              </div>
              
              {/* Input */}
              <div className="border-t border-gray-200">
                <ChatInput />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}