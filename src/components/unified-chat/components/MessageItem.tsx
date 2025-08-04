'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Message } from 'ai';
import { Oscar1 } from '@/app/chat/components/icons/Oscar1';
import { useChatContext } from './ChatProvider';
import { PluginRenderer } from './PluginRenderer';
import RainbowText from '@/app/chat/components/RainbowText';

interface MessageItemProps {
  message: Message;
  isLast: boolean;
}

// Helper function to render text with rainbow OSmos
function renderMessageWithRainbowOSmos(text: string): React.ReactNode {
  // Split text by OSmos (case insensitive) and preserve the matched case
  const parts = text.split(/(OSmos|Osmos|osmos)/gi);
  
  return parts.map((part, index) => {
    if (part.toLowerCase() === 'osmos') {
      return <RainbowText key={index}>{part}</RainbowText>;
    }
    return part;
  });
}

export function MessageItem({ message, isLast }: MessageItemProps) {
  const { context } = useChatContext();
  const isUser = message.role === 'user';

  // Debug: Log message content
  console.log('[MessageItem] Rendering message:', {
    role: message.role,
    hasAssessmentAction: message.content.includes('ASSESSMENT_ACTION'),
    contentPreview: message.content.substring(0, 100)
  });

  // Skip empty user messages
  if (isUser && !message.content) {
    return null;
  }

  if (!isUser) {
    // Agent message with Oscar icon
    return (
      <React.Fragment>
        <Oscar1 className="!w-[41px] !h-[41px]" />
        <div className="[font-family:'Inter',Helvetica] font-normal text-[color:var(--shadcn-ui-foreground)] text-lg tracking-[0] leading-7">
          <PluginRenderer
            type="messageRenderer"
            message={message}
            fallback={
              <p>
                {message.content.split('\n').map((line, i) => (
                  <React.Fragment key={i}>
                    {renderMessageWithRainbowOSmos(line)}
                    {i < message.content.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </p>
            }
          />
        </div>
      </React.Fragment>
    );
  } else {
    // User message - simple text aligned right
    return (
      <div className="flex justify-end">
        <p className="[font-family:'Inter',Helvetica] font-normal text-[color:var(--shadcn-ui-muted-foreground)] text-base tracking-[0] leading-5 text-right">
          {message.content}
        </p>
      </div>
    );
  }
}