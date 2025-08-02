'use client';

import { cn } from '@/lib/utils';
import { Message } from 'ai';
import { Oscar1 } from '@/app/chat/components/icons/Oscar1';
import { User } from 'lucide-react';
import { useChatContext } from './ChatProvider';
import { PluginRenderer } from './PluginRenderer';

interface MessageItemProps {
  message: Message;
  isLast: boolean;
}

export function MessageItem({ message, isLast }: MessageItemProps) {
  const { context } = useChatContext();
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex gap-3',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <Oscar1 className="w-5 h-5 text-blue-600" />
          </div>
        </div>
      )}

      {/* Message content */}
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-2',
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-900'
        )}
      >
        {/* Check if any plugin wants to render this message */}
        <PluginRenderer
          type="messageRenderer"
          message={message}
          fallback={
            <div className="whitespace-pre-wrap">{message.content}</div>
          }
        />
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <User className="w-5 h-5 text-gray-600" />
          </div>
        </div>
      )}
    </div>
  );
}