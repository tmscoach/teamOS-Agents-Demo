'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useChatContext } from './ChatProvider';
import { MessageItem } from './MessageItem';
import { Oscar1 } from '@/app/chat/components/icons/Oscar1';
import { PluginRenderer } from './PluginRenderer';

export function ChatMessages() {
  const { chat, context } = useChatContext();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages with smooth behavior
  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  }, [chat.messages, chat.isLoading]);

  return (
    <div
      ref={scrollRef}
      className="h-full overflow-y-auto px-[27px] py-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
    >
      {/* Plugin message header (e.g., voice invitation) */}
      <PluginRenderer type="messageHeader" />
      
      <div className="flex flex-col gap-[23px]">
        {/* Welcome message if no messages */}
        {chat.messages.length === 0 && (
          <>
            <Oscar1 className="!w-[41px] !h-[41px]" />
            <p className="[font-family:'Inter',Helvetica] font-normal text-[color:var(--shadcn-ui-foreground)] text-lg tracking-[0] leading-7">
              {context.agent === 'OrchestratorAgent' && !context.user.hasCompletedTMP
                ? "Welcome! Let's start with your Team Management Profile to unlock your journey."
                : context.agent === 'AssessmentAgent'
                ? "" // Don't show any text for AssessmentAgent - let the proactive message handle it
                : "How can I help you today?"}
            </p>
          </>
        )}

        {/* Messages */}
        {chat.messages.map((message, index) => (
          <MessageItem
            key={message.id}
            message={message}
            isLast={index === chat.messages.length - 1}
          />
        ))}

        {/* Loading indicator */}
        {chat.isLoading && (
          <>
            <Oscar1 className="!w-[41px] !h-[41px] animate-pulse" />
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}