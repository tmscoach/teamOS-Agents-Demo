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
  const isFullPage = context.mode === 'full-page';

  return (
    <>
      {/* Backdrop for mobile (not needed in full-page mode) */}
      {state.isOpen && !isFullPage && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          isFullPage ? 'relative h-full' : 'fixed top-0 h-full z-50',
          'transition-all duration-300',
          'border-solid border-[color:var(--shadcn-ui-border)] shadow-[0px_4px_6px_-4px_#0000001a,0px_10px_15px_-3px_#0000001a] backdrop-blur-[15px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(15px)_brightness(100%)] bg-[linear-gradient(156deg,rgba(255,243,3,0.05)_0%,rgba(251,169,61,0.05)_15%,rgba(237,1,145,0.05)_30%,rgba(167,99,173,0.05)_45%,rgba(1,133,198,0.05)_60%,rgba(2,181,230,0.05)_75%,rgba(1,161,114,0.05)_90%,rgba(162,211,111,0.05)_100%)]',
          isLeft ? 'left-0 border-r' : 'right-0 border-l',
          {
            'w-full sm:w-96 lg:w-[399px]': isExpanded || isFullPage,
            'w-[60px]': !isExpanded && !isFullPage,
            'translate-x-0': state.isOpen || isFullPage,
            '-translate-x-full': !state.isOpen && isLeft && !isFullPage,
            'translate-x-full': !state.isOpen && !isLeft && !isFullPage,
          }
        )}
      >
        {/* Expand/Collapse button (hidden in full-page mode) */}
        {!isFullPage && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              'absolute top-1/2 -translate-y-1/2 w-6 h-12 bg-white border border-[color:var(--shadcn-ui-border)] rounded-full shadow-sm hover:shadow-md transition-all flex items-center justify-center',
              isLeft ? '-right-3' : '-left-3'
            )}
          >
            {isExpanded ? (
              isLeft ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
            ) : (
              isLeft ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Chat content */}
        <div className={cn(
          'h-full flex flex-col relative',
          !isExpanded && 'overflow-hidden'
        )}>
          {/* Header */}
          <ChatHeader isExpanded={isExpanded} />

          {/* Plugin side panel (if any) */}
          <PluginRenderer type="sidePanel" />

          {/* Messages container - with padding bottom to account for input */}
          <div className="flex-1 overflow-hidden">
            {isExpanded ? (
              <div className="h-full pb-[80px]">
                <ChatMessages />
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                <span className="text-xs">Chat</span>
              </div>
            )}
          </div>

          {/* Input at bottom */}
          {isExpanded && (
            <div className="absolute bottom-[27px] left-[27px] right-[27px]">
              <ChatInput />
            </div>
          )}
        </div>
      </div>
    </>
  );
}