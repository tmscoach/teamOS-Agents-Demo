'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useChatContext } from './ChatProvider';
import { MessageItem } from './MessageItem';

export function ChatMessages() {
  const { chat, context } = useChatContext();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat.messages]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 space-y-4"
    >
      {/* Welcome message if no messages */}
      {chat.messages.length === 0 && (
        <div className="text-center py-8">
          <Oscar1 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">
            {context.agent === 'OrchestratorAgent' && !context.user.hasCompletedTMP
              ? "Welcome! Let's start with your Team Management Profile to unlock your journey."
              : "How can I help you today?"}
          </p>
        </div>
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
        <div className="flex items-center gap-2 text-gray-500">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
          </div>
          <span className="text-sm">Thinking...</span>
        </div>
      )}
    </div>
  );
}