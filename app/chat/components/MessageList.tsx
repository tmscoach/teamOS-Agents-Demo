"use client";

import React from "react";
import type { Message } from 'ai';
import { Oscar1 } from './icons/Oscar1';
import { Plus3 } from './icons/Plus3';
import RainbowText from './RainbowText';

interface MessageListProps {
  messages: Message[];
  agentName?: string;
  loading?: boolean;
  suggestedValues?: {
    field: string;
    values: string[];
    helpText?: string;
  };
  onSuggestedValueClick?: (value: string) => void;
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

export default function MessageList({ 
  messages, 
  agentName = "OSmos", 
  loading = false,
  suggestedValues,
  onSuggestedValueClick 
}: MessageListProps) {
  return (
    <div className="flex flex-col gap-[23px]">
      {messages.map((message, index) => {
        // Skip empty user messages (used for greetings)
        if (message.role === 'user' && !message.content) {
          return null;
        }

        const isUser = message.role === 'user';
        
        if (!isUser) {
          // Agent message with Oscar icon
          return (
            <React.Fragment key={message.id || index}>
              <Oscar1 className="!w-[41px] !h-[41px]" />
              <p className="[font-family:'Inter',Helvetica] font-normal text-[color:var(--shadcn-ui-foreground)] text-lg tracking-[0] leading-7">
                {message.content.split('\n').map((line, i) => (
                  <React.Fragment key={i}>
                    {renderMessageWithRainbowOSmos(line)}
                    {i < message.content.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </p>
            </React.Fragment>
          );
        } else {
          // User message - simple text
          return (
            <div key={message.id || index} className="flex justify-end">
              <p className="[font-family:'Inter',Helvetica] font-normal text-[color:var(--shadcn-ui-muted-foreground)] text-base tracking-[0] leading-5 text-right">
                {message.content}
              </p>
            </div>
          );
        }
      })}
      
      {/* Typing indicator */}
      {loading && (
        <>
          <Oscar1 className="!w-[41px] !h-[41px] animate-pulse" />
          <div className="flex space-x-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </>
      )}
      
      {/* Suggested values display - inline as shown in figma */}
      {suggestedValues && (
        <div className="flex flex-col">
          {suggestedValues.values.map((value, index) => (
            <button
              key={index}
              onClick={() => onSuggestedValueClick?.(value)}
              className="flex items-center justify-between px-2 py-4 border-b border-solid border-[color:var(--shadcn-ui-border)] hover:bg-[color:var(--shadcn-ui-accent)] transition-colors"
            >
              <span className={`[font-family:'Inter',Helvetica] font-normal ${
                index === 0 
                  ? 'text-[color:var(--shadcn-ui-muted-foreground)]' 
                  : 'text-[color:var(--shadcn-ui-foreground)]'
              } text-base tracking-[0] leading-4 text-left`}>
                {value}
              </span>
              {index !== 0 && (
                <Plus3 className="!w-4 !h-4" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}