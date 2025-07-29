"use client";

import { useEffect, useRef } from 'react';
import { Message } from 'ai';
import OscarIcon from './OscarIcon';
import { Loader2 } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

export default function MessageList({ messages, isLoading }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {messages.length === 0 ? (
        <div className="text-center py-8">
          <div className="inline-flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <OscarIcon className="!w-8 !h-8" />
            </div>
            <div className="space-y-2">
              <p className="text-gray-900 font-medium">Hi! I'm OSmos</p>
              <p className="text-sm text-gray-600 max-w-[280px]">
                I'm here to help you complete your assessment. Ask me anything about the questions or the assessment process!
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                {message.role === 'assistant' && (
                  <div className="flex items-start gap-2 mb-1">
                    <OscarIcon className="!w-5 !h-5 mt-0.5" />
                    <span className="text-xs text-gray-500">OSmos</span>
                  </div>
                )}
                <div
                  className={`px-4 py-2 rounded-lg text-sm ${
                    message.role === 'user'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%]">
                <div className="flex items-start gap-2 mb-1">
                  <OscarIcon className="!w-5 !h-5 mt-0.5" />
                  <span className="text-xs text-gray-500">OSmos</span>
                </div>
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            </div>
          )}
        </>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}