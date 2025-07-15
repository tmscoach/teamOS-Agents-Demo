"use client";

import { useStreamingChat } from '../hooks/useStreamingChat';
import { Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

export function StreamingChatDemo() {
  const [input, setInput] = useState('');
  const { messages, isLoading, sendMessage, conversationId } = useStreamingChat({
    onExtractedData: (data) => {
      console.log('Extracted:', data);
    },
    onMetadata: (metadata) => {
      console.log('Metadata:', metadata);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input, 'OnboardingAgent');
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-[600px] max-w-2xl mx-auto p-4">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              {message.isStreaming && (
                <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1" />
              )}
            </div>
          </div>
        ))}
        {isLoading && messages.length === 0 && (
          <div className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
      
      {conversationId && (
        <p className="text-xs text-gray-500 mt-2">
          Conversation ID: {conversationId}
        </p>
      )}
    </div>
  );
}