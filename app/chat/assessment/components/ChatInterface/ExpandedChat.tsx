"use client";

import React, { RefObject } from 'react';
import { Message } from 'ai';
import { ChevronLeft, Send } from 'lucide-react';
import OscarIcon from './OscarIcon';
import MessageList from './MessageList';
import { VoiceToggle } from '../voice';
import { VoiceState } from '@/src/lib/services/voice';

interface WorkflowState {
  subscriptionId: string;
  workflowId: string;
  currentPageId: number;
  currentSectionId: number;
  baseContentId: number;
  questions: any[];
  navigationInfo: any;
  completionPercentage: number;
}

interface ExpandedChatProps {
  messages: Message[];
  isLoading: boolean;
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  inputRef: RefObject<HTMLInputElement>;
  workflowState: WorkflowState | null;
  assessmentType: string;
  onToggle: () => void;
  voiceState?: VoiceState;
  onVoiceToggle?: () => void;
  audioLevel?: number;
}

export default function ExpandedChat({
  messages,
  isLoading,
  input,
  handleInputChange,
  handleSubmit,
  inputRef,
  workflowState,
  assessmentType,
  onToggle,
  voiceState = 'idle',
  onVoiceToggle,
  audioLevel = 0
}: ExpandedChatProps) {
  // Auto-focus input after message is sent
  React.useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading, inputRef]);
  return (
    <div 
      id="chat-interface"
      className="fixed top-0 left-0 w-[399px] h-screen z-40 flex flex-col bg-white border-r border-gray-200 shadow-xl animate-slideInLeft"
    >
      {/* Gradient background overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(156deg,rgba(255,243,3,0.05)_0%,rgba(251,169,61,0.05)_15%,rgba(237,1,145,0.05)_30%,rgba(167,99,173,0.05)_45%,rgba(1,133,198,0.05)_60%,rgba(2,181,230,0.05)_75%,rgba(1,161,114,0.05)_90%,rgba(162,211,111,0.05)_100%)] pointer-events-none" />
      
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="relative">
              <OscarIcon className="w-8 h-8" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Chat with OSmos</h3>
              <p className="text-sm text-gray-500">Your assessment guide</p>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Minimize chat"
          >
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Messages or Welcome Screen */}
        {messages.length === 0 ? (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="text-center py-8">
              <div className="inline-flex flex-col items-center gap-4">
                <OscarIcon className="!w-16 !h-16" />
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-900">Hi! I'm OSmos</p>
                  <p className="text-sm text-gray-600 max-w-[280px]">
                    I can help you understand the questionnaire and what each question measures. Ask me anything!
                  </p>
                </div>
              </div>
              
              {/* Quick questions */}
              <div className="mt-8 space-y-2">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">QUICK QUESTIONS</p>
                <div className="space-y-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      const syntheticEvent = {
                        target: { value: 'What does the rating scale mean?' }
                      } as React.ChangeEvent<HTMLInputElement>;
                      handleInputChange(syntheticEvent);
                      // Submit on next tick to ensure state updates
                      setTimeout(() => {
                        const form = document.querySelector('#chat-interface form') as HTMLFormElement;
                        if (form) {
                          form.requestSubmit();
                        }
                      }, 0);
                    }}
                    className="w-full text-left text-sm px-4 py-3 bg-white hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
                  >
                    What does the rating scale mean?
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      const syntheticEvent = {
                        target: { value: 'How should I approach these questions?' }
                      } as React.ChangeEvent<HTMLInputElement>;
                      handleInputChange(syntheticEvent);
                      setTimeout(() => {
                        const form = document.querySelector('#chat-interface form') as HTMLFormElement;
                        if (form) {
                          form.requestSubmit();
                        }
                      }, 0);
                    }}
                    className="w-full text-left text-sm px-4 py-3 bg-white hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
                  >
                    How should I approach these questions?
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      const syntheticEvent = {
                        target: { value: "What's the purpose of these questions?" }
                      } as React.ChangeEvent<HTMLInputElement>;
                      handleInputChange(syntheticEvent);
                      setTimeout(() => {
                        const form = document.querySelector('#chat-interface form') as HTMLFormElement;
                        if (form) {
                          form.requestSubmit();
                        }
                      }, 0);
                    }}
                    className="w-full text-left text-sm px-4 py-3 bg-white hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
                  >
                    What's the purpose of these questions?
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <MessageList messages={messages} isLoading={isLoading} />
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Ask about the questionnaire..."
              className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            {onVoiceToggle && (
              <VoiceToggle
                voiceState={voiceState}
                onToggle={onVoiceToggle}
                audioLevel={audioLevel}
                size="sm"
              />
            )}
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}