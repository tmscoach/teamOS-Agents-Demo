"use client";

import { useState, useEffect, useRef, RefObject } from 'react';
import { Send } from 'lucide-react';
import OscarIcon from './OscarIcon';
import ChatMessages from './ChatMessages';
import type { Message } from '../../hooks/useDebriefChat';

interface ExpandedChatProps {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  onSendMessage: (input: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
}

export default function ExpandedChat({ 
  messages, 
  isLoading, 
  error,
  onSendMessage,
  inputRef 
}: ExpandedChatProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      className="fixed flex flex-col"
      style={{
        bottom: '20px',
        right: '40px',
        width: '432px',
        height: '600px',
        borderRadius: '6px 6px 0px 0px',
        border: '1px solid var(--shadcn-ui-border, #e5e7eb)',
        boxShadow: '0px 4px 6px -4px rgba(0, 0, 0, 0.1), 0px 10px 15px -3px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(5px) brightness(100%)',
        WebkitBackdropFilter: 'blur(5px) brightness(100%)',
        background: 'linear-gradient(158deg, rgba(255,243,3,0.05) 0%, rgba(251,169,61,0.05) 15%, rgba(237,1,145,0.05) 30%, rgba(167,99,173,0.05) 45%, rgba(1,133,198,0.05) 60%, rgba(2,181,230,0.05) 75%, rgba(1,161,114,0.05) 90%, rgba(162,211,111,0.05) 100%)'
      }}
    >
      {/* Chat Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-200" style={{ borderRadius: '6px 6px 0 0' }}>
        <h3 className="text-lg font-semibold text-gray-900">Chat with Oskar</h3>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-white">
        <ChatMessages messages={messages} />
        {error && (
          <div className="px-4 py-2 text-sm text-red-600 bg-red-50">
            {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
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
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1 text-sm text-[#6b7280] placeholder:text-[#9ca3af] focus:outline-none bg-transparent font-['Inter',Helvetica] font-normal tracking-[0] leading-6"
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
            Oskar is thinking...
          </div>
        )}
      </div>
    </div>
  );
}