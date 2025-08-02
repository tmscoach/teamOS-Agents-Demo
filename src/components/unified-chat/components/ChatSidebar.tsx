'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';
import { useChatContext } from './ChatProvider';
import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { PluginRenderer } from './PluginRenderer';

export function ChatSidebar() {
  const { context, state, onClose } = useChatContext();
  const [isExpanded, setIsExpanded] = useState(true);
  
  const isLeft = context.position === 'left-sidebar';

  return (
    <>
      {/* Backdrop for mobile */}
      {state.isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed top-0 h-full bg-white border-gray-200 shadow-lg z-50 transition-all duration-300',
          isLeft ? 'left-0 border-r' : 'right-0 border-l',
          {
            'w-full sm:w-96 lg:w-[480px]': isExpanded,
            'w-[60px]': !isExpanded,
            'translate-x-0': state.isOpen,
            '-translate-x-full': !state.isOpen && isLeft,
            'translate-x-full': !state.isOpen && !isLeft,
          }
        )}
      >
        {/* Expand/Collapse button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'absolute top-1/2 -translate-y-1/2 w-6 h-12 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-all flex items-center justify-center',
            isLeft ? '-right-3' : '-left-3'
          )}
        >
          {isExpanded ? (
            isLeft ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
          ) : (
            isLeft ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        {/* Chat content */}
        <div className={cn(
          'h-full flex flex-col',
          !isExpanded && 'overflow-hidden'
        )}>
          {/* Header */}
          <ChatHeader isExpanded={isExpanded} />

          {/* Plugin side panel (if any) */}
          <PluginRenderer type="sidePanel" />

          {/* Messages */}
          <div className="flex-1 overflow-hidden">
            {isExpanded ? (
              <ChatMessages />
            ) : (
              <div className="p-4 text-center text-gray-500">
                <span className="text-xs">Chat</span>
              </div>
            )}
          </div>

          {/* Input */}
          {isExpanded && (
            <div className="border-t border-gray-200">
              <ChatInput />
            </div>
          )}
        </div>
      </div>
    </>
  );
}