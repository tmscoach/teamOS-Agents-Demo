"use client";

import React, { useEffect, useRef } from "react";
import { UserButton } from "@clerk/nextjs";
import { Oscar1 } from "./icons/Oscar1";
import { ArrowRightCircle1 } from "./icons/ArrowRightCircle1";
import { parseMessageWithAgentName } from "../utils/messageParser";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import ProfileDisplay from "./ProfileDisplay";
import TeamVisualization from "./TeamVisualization";
import OnboardingCompletion from "./OnboardingCompletion";
import SuggestedValues from "./SuggestedValues";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatLayoutProps {
  messages: Message[];
  input: string;
  setInput: (value: string) => void;
  onSendMessage: () => void;
  loading: boolean;
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

export default function ChatLayout({
  messages,
  input,
  setInput,
  onSendMessage,
  loading,
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSendMessage();
  };

  const handleSelectSuggestedValue = (value: string) => {
    setInput(value);
    // Focus the input field after setting the value
    const inputElement = document.querySelector('input[placeholder="Type your message..."]') as HTMLInputElement;
    inputElement?.focus();
  };

  return (
    <div className="bg-white h-screen w-full flex overflow-hidden">
      <div className="flex flex-col lg:flex-row w-full max-w-[1280px] mx-auto h-full">
        {/* Left sidebar */}
        <div className="w-full lg:w-[399px] h-full bg-white lg:bg-transparent flex-shrink-0">
          <div className="h-full border-b lg:border-b-0 lg:border-r border-solid border-[color:var(--shadcn-ui-border)] shadow-[0px_4px_6px_-4px_#0000001a,0px_10px_15px_-3px_#0000001a] backdrop-blur-[15px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(15px)_brightness(100%)] bg-[linear-gradient(156deg,rgba(255,243,3,0.05)_0%,rgba(251,169,61,0.05)_15%,rgba(237,1,145,0.05)_30%,rgba(167,99,173,0.05)_45%,rgba(1,133,198,0.05)_60%,rgba(2,181,230,0.05)_75%,rgba(1,161,114,0.05)_90%,rgba(162,211,111,0.05)_100%)] flex flex-col">
            {/* Logo */}
            <div className="p-6 pb-8">
              <img
                className="w-[90px] h-[39px]"
                alt="teamOS"
                src="/icons/teamos-logo.png"
              />
            </div>

            {/* Chat content area */}
            <div className="relative flex-1">
              {/* Messages scroll area - with padding for input and suggested values */}
              <div className="absolute inset-0 px-[27px] pt-0 pb-[80px]">
                <ScrollArea className="h-full">
                  <div className="space-y-6 w-full pr-2 pb-4">
                    {messages.map((message, index) => (
                      <div key={message.id} className="flex flex-col gap-4">
                        {message.role === "assistant" && (
                          <div className="flex flex-col gap-3">
                            {index === 0 && <Oscar1 className="!w-[41px] !h-[41px]" />}
                            <div className="text-black text-base leading-6 break-words">
                              {parseMessageWithAgentName(message.content, agentName)}
                            </div>
                          </div>
                        )}
                        {message.role === "user" && (
                          <div className="bg-gray-100 rounded-lg p-3">
                            <p className="text-gray-800 text-sm break-words">{message.content}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                    {loading && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">{agentName} is typing...</span>
                      </div>
                    )}
                    {/* Suggested values */}
                    {suggestedValues && !loading && (
                      <SuggestedValues
                        field={suggestedValues.field}
                        values={suggestedValues.values}
                        helpText={suggestedValues.helpText}
                        onSelect={handleSelectSuggestedValue}
                      />
                    )}
                    
                    {/* Invisible element to scroll to */}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </div>

              {/* Input field - fixed at bottom */}
              <div className="absolute bottom-[27px] left-[27px] right-[27px]">
                <form onSubmit={handleSubmit}>
                  <div className="flex h-9 items-center gap-2 w-full">
                    <div className="flex items-center gap-2 flex-1 bg-white rounded-[var(--shadcn-ui-radius-md)] border border-solid border-[color:var(--shadcn-ui-input)] shadow-[var(--shadow-md)] pl-3 pr-2 py-2">
                      <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={loading}
                        className="flex-1 bg-transparent outline-none font-normal text-[color:var(--shadcn-ui-foreground)] text-sm tracking-[0] leading-5"
                        placeholder="Type your message..."
                      />
                      <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="hover:opacity-80 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Send message"
                      >
                        <ArrowRightCircle1 className="!w-4 !h-4" />
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Right content area */}
        <div className="flex-1 flex items-center justify-center py-16 lg:py-0">
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

          {/* Dynamic content based on onboarding state and extracted data */}
          {isOnboarding ? (
            <>
              {/* Show different components based on what data has been extracted */}
              {extractedData.team_size ? (
                // If we have team size, show the completion component (which handles both states)
                <OnboardingCompletion
                  managerName={extractedData.user_name || extractedData.manager_name}
                  managerRole={extractedData.user_role || extractedData.manager_role}
                  teamSize={extractedData.team_size}
                  onboardingState={onboardingState}
                />
              ) : (
                // Otherwise show the profile display
                <ProfileDisplay
                  userName={extractedData.user_name || extractedData.manager_name}
                  userRole={extractedData.user_role || extractedData.manager_role}
                />
              )}
            </>
          ) : (
            // Non-onboarding chat - show default profile
            <div className="flex flex-col items-center">
              {/* Avatar */}
              <div className="w-[118px] h-[118px] items-center justify-center bg-[color:var(--radix-colours-slate-4)] rounded-[100px] overflow-hidden border border-dashed border-[color:var(--shadcn-ui-border)] shadow-[var(--shadow-md)] flex">
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <svg className="w-14 h-14 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
              </div>

              {/* User name */}
              <div className="mt-8 text-center">
                <div className="font-bold text-black text-2xl text-center tracking-[-0.48px] leading-6">
                  {userName || "Team Manager"}
                </div>
                <div className="mt-2 font-normal text-[color:var(--shadcn-ui-muted-foreground)] text-sm text-center tracking-[-0.28px] leading-6 whitespace-nowrap">
                  Getting started with teamOS
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}