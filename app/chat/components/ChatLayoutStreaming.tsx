"use client";

import React, { useRef, useEffect } from "react";
import { UserButton } from "@clerk/nextjs";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import type { Message } from 'ai';

interface ChatLayoutProps {
  messages: Message[];
  input: string;
  isLoading: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  conversationRestored?: boolean;
  userName?: string;
  agentName?: string;
  onNewConversation?: () => void;
  extractedData?: Record<string, any>;
  onboardingState?: {
    isComplete: boolean;
    requiredFieldsCount: number;
    capturedFieldsCount: number;
  };
  isOnboarding?: boolean;
  suggestedValues?: {
    field: string;
    values: string[];
    helpText?: string;
  };
}

export default function ChatLayoutStreaming({
  messages,
  input,
  isLoading,
  onInputChange,
  onSubmit,
  conversationRestored,
  userName,
  agentName = "OSmos",
  onNewConversation,
  extractedData = {},
  onboardingState = {
    isComplete: false,
    requiredFieldsCount: 0,
    capturedFieldsCount: 0
  },
  isOnboarding = false,
  suggestedValues
}: ChatLayoutProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive or loading state changes
  useEffect(() => {
    if (scrollAreaRef.current) {
      // Use setTimeout to ensure DOM has updated
      setTimeout(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  }, [messages, isLoading, suggestedValues]);

  return (
    <div className="bg-white min-h-screen w-full flex overflow-auto">
      <div className="flex flex-col lg:flex-row w-full max-w-[1280px] mx-auto min-h-screen">
        {/* Left sidebar - Chat area */}
        <div className="w-full lg:w-[399px] lg:min-h-screen bg-white lg:bg-transparent flex-shrink-0">
          <div className="h-full min-h-[300px] lg:min-h-full border-b lg:border-b-0 lg:border-r border-solid border-[color:var(--shadcn-ui-border)] shadow-[0px_4px_6px_-4px_#0000001a,0px_10px_15px_-3px_#0000001a] backdrop-blur-[15px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(15px)_brightness(100%)] bg-[linear-gradient(156deg,rgba(255,243,3,0.05)_0%,rgba(251,169,61,0.05)_15%,rgba(237,1,145,0.05)_30%,rgba(167,99,173,0.05)_45%,rgba(1,133,198,0.05)_60%,rgba(2,181,230,0.05)_75%,rgba(1,161,114,0.05)_90%,rgba(162,211,111,0.05)_100%)] p-6 lg:p-0 lg:relative">
            {/* Logo */}
            <div className="mb-12 lg:mb-0 lg:absolute lg:top-[23px] lg:left-[19px]">
              <img
                className="w-[90px] h-[39px]"
                alt="teamOS"
                src="/img/teamos-logo.png"
              />
            </div>

            {/* Chat content container */}
            <div 
              ref={scrollAreaRef}
              className="lg:absolute lg:top-[126px] lg:left-[27px] lg:right-[27px] lg:bottom-[100px] flex flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
            >
              <MessageList 
                messages={messages} 
                agentName={agentName} 
                loading={isLoading}
                suggestedValues={onboardingState.isComplete ? undefined : suggestedValues}
                onSuggestedValueClick={(value) => {
                  onInputChange({ target: { value } } as React.ChangeEvent<HTMLInputElement>);
                }}
              />
            </div>

            {/* Input area - positioned at bottom */}
            <div className="lg:absolute lg:bottom-[27px] lg:left-[27px] lg:right-[27px]">
              <ChatInput
                value={input}
                onChange={onInputChange}
                onSubmit={onSubmit}
                disabled={isLoading}
                placeholder="Type your message..."
                autoFocus={true}
              />
            </div>
          </div>
        </div>

        {/* Right content area */}
        <div className="flex-1 flex items-center justify-center py-16 lg:py-0 min-h-[300px] lg:min-h-0">
          {/* User button and New Conversation */}
          <div className="absolute top-4 right-4 flex items-center gap-3">
            {onNewConversation && (
              <button
                onClick={onNewConversation}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                New Chat
              </button>
            )}
            <UserButton afterSignOutUrl="/sign-in" />
          </div>

          <div className="flex flex-col items-center">
            {/* Manager's avatar at the top */}
            <div className="flex flex-col items-center mb-12">
              <div className="w-[118px] h-[118px] items-center justify-center bg-[color:var(--radix-colours-slate-4)] rounded-[100px] overflow-hidden border border-dashed border-[color:var(--shadcn-ui-border)] shadow-[var(--shadow-md)] flex">
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <svg className="w-14 h-14 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
              </div>
              <div className="mt-6 text-center">
                <div className="[font-family:'Inter',Helvetica] font-bold text-black text-2xl text-center tracking-[-0.48px] leading-6">
                  {extractedData.user_name || extractedData.manager_name || userName || "Manager"}
                </div>
                <div className="mt-1 [font-family:'Inter',Helvetica] font-normal text-[color:var(--shadcn-ui-muted-foreground)] text-sm text-center tracking-[-0.28px] leading-6">
                  {extractedData.user_role || extractedData.manager_role || "..."}
                </div>
              </div>
            </div>

            {/* Team members visualization - only show if we have team_size */}
            {isOnboarding && extractedData.team_size && (
              <div className="relative">
                {/* Gridlines background */}
                <img
                  className="absolute w-full h-[113px] top-0 left-0"
                  alt="Gridlines"
                  src="/img/gridlines.svg"
                />
                
                {/* Team member avatars */}
                <div className="relative inline-flex items-center gap-16 pt-[102px]">
                  {Array.from({ length: Math.min(4, parseInt(extractedData.team_size) || 0) }).map((_, index) => (
                    <div key={index} className="w-[146px]">
                      <div className={`w-[76px] h-[76px] mx-auto flex items-center justify-center rounded-[100px] overflow-hidden border border-dashed border-[color:var(--shadcn-ui-border)] shadow-shadow-sm ${
                        index === 0 ? 'bg-[#f8dcb8]' :
                        index === 1 ? 'bg-[#edbbd2]' :
                        index === 2 ? 'bg-[#cfbcd9]' :
                        'bg-[#a7c0e3]'
                      }`}>
                        <svg className="w-10 h-10" fill="#020617" opacity="0.5" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Progress indicator for onboarding */}
            {isOnboarding && onboardingState.requiredFieldsCount > 0 && (
              <div className="mt-8 text-center">
                <div className="[font-family:'Inter',Helvetica] font-normal text-[color:var(--shadcn-ui-muted-foreground)] text-sm">
                  {onboardingState.capturedFieldsCount} of {onboardingState.requiredFieldsCount} fields captured
                </div>
                {onboardingState.isComplete && (
                  <div className="mt-2 [font-family:'Inter',Helvetica] font-medium text-green-600 text-base">
                    Onboarding Complete!
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}