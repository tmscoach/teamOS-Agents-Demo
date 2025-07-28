"use client";

import { useState, useEffect, useRef, RefObject, useMemo } from 'react';
import { Send } from 'lucide-react';
import OscarIcon from './OscarIcon';
import ChatMessages from './ChatMessages';
import ProfileSummary from './ProfileSummary';
import SuggestedActions from './SuggestedActions';
import { generateProfileSummary, generateSuggestedActions } from '@/src/lib/utils/report-summary';
import type { ParsedReport } from '@/src/lib/utils/report-parser';
import type { Message } from '../../hooks/useDebriefChat';

interface ExpandedChatProps {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  onSendMessage: (input: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  reportData?: ParsedReport;
}

export default function ExpandedChat({ 
  messages, 
  isLoading, 
  error,
  onSendMessage,
  inputRef,
  reportData
}: ExpandedChatProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Generate profile summary and suggested actions
  const profileSummary = useMemo(() => generateProfileSummary(reportData), [reportData]);
  const suggestedActions = useMemo(() => generateSuggestedActions(reportData), [reportData]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div 
      id="chat-interface"
      className="fixed flex flex-col bg-white shadow-xl"
      style={{
        top: '109px',
        right: '0',
        width: '432px',
        height: 'calc(100vh - 109px)',
        borderLeft: '1px solid #e5e7eb',
        zIndex: 50
      }}
    >
      {/* Chat Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200">
        <div className="relative">
          <OscarIcon className="w-8 h-8" />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-gray-900">Chat with OSmos</h3>
          <p className="text-sm text-gray-500">Your AI team dynamics coach</p>
        </div>
      </div>
      
      {/* Messages and Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Profile Summary - Always visible when no messages */}
        {messages.length === 0 && (
          <>
            {/* Profile Card */}
            <div className="mx-6 mt-6 p-4 bg-purple-50 rounded-lg border border-purple-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-sm">
                    {reportData?.profile?.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">
                    Your Profile: {profileSummary.role}
                  </h4>
                  <ul className="mt-2 space-y-1">
                    {profileSummary.bullets.map((bullet, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <span className="mr-2 text-purple-600">•</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Initial Message */}
            <div className="px-6 mt-6">
              <div className="flex items-start gap-3">
                <OscarIcon className="w-8 h-8 flex-shrink-0" />
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700">
                      Hi! I'm OSmos, your AI team dynamics coach. Feel free to ask me anything about your {reportData?.type || 'assessment'} profile!
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">12:14 PM</p>
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Regular Messages */}
        <div className="flex-1 overflow-y-auto px-6">
          <ChatMessages messages={messages} />
          {error && (
            <div className="px-4 py-2 text-sm text-red-600 bg-red-50">
              {error}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Suggested Actions */}
      {messages.length === 0 && suggestedActions.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-100">
          <div className="space-y-2">
            {suggestedActions.slice(0, 3).map((action) => (
              <button
                key={action.id}
                onClick={() => {
                  setInput(action.question);
                  inputRef.current?.focus();
                }}
                className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-700">{action.label}</span>
                  <svg className="w-4 h-4 text-blue-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
            <button className="text-sm text-blue-600 hover:text-blue-700 px-4 py-1">
              Show more suggestions
            </button>
          </div>
        </div>
      )}
      
      {/* Input Area at Bottom */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="relative w-full">
          {/* Gradient border wrapper */}
          <div 
            className="absolute inset-0 rounded-md p-0.5"
            style={{
              background: 'linear-gradient(152deg, rgba(255,243,3,1) 0%, rgba(251,169,61,1) 15%, rgba(237,1,145,1) 30%, rgba(167,99,173,1) 45%, rgba(1,133,198,1) 60%, rgba(2,181,230,1) 75%, rgba(1,161,114,1) 90%, rgba(162,211,111,1) 100%)'
            }}
          />
          
          {/* Inner content */}
          <div className="relative flex items-center gap-2 bg-white rounded-md px-3 py-2">
            <OscarIcon className="w-5 h-5" />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your profile..."
              disabled={isLoading}
              className="flex-1 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none bg-transparent"
            />
            {input.trim() && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        {isLoading && (
          <div className="mt-2 text-xs text-gray-500 text-center">
            OSmos is thinking...
          </div>
        )}
      </div>
    </div>
  );
}