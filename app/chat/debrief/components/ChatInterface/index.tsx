"use client";

import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import OscarIcon from './OscarIcon';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import { useSearchParams } from 'next/navigation';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  agentName: string;
  reportType: string;
  visibleSection: string;
  expanded: boolean;
  onToggle: () => void;
  reportData?: any;
}

export default function ChatInterface({ 
  agentName, 
  reportType, 
  visibleSection, 
  expanded, 
  onToggle,
  reportData 
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const subscriptionId = searchParams.get('subscriptionId');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add welcome message on first expansion
  useEffect(() => {
    if (expanded && messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: `Hi! I'm Oskar, your assessment debrief coach. I can help you understand your ${reportType} report, explain what your scores mean, and provide personalized insights. What would you like to know about your results?`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [expanded, reportType]);

  // Handle sending messages
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/debrief', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationId,
          reportType,
          subscriptionId,
          visibleSection,
          reportData
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Get conversation ID from headers
      const newConversationId = response.headers.get('X-Conversation-ID');
      if (newConversationId && !conversationId) {
        setConversationId(newConversationId);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage: Message = {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          assistantMessage.content += chunk;
          
          // Update the message in state
          setMessages(prev => 
            prev.map(msg => 
              msg.id === assistantMessage.id 
                ? { ...msg, content: assistantMessage.content }
                : msg
            )
          );
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
      // Refocus the input after response
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  // Auto-expand when user starts typing
  useEffect(() => {
    if (input && !expanded) {
      onToggle();
    }
  }, [input]);

  // Handle click outside to collapse
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Check if click is outside the chat interface
      const chatElement = document.getElementById('chat-interface');
      if (chatElement && !chatElement.contains(e.target as Node) && expanded) {
        onToggle();
      }
    };

    if (expanded) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [expanded, onToggle]);

  // Handle key press for quick submission
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Collapsed state (matches Figma exactly)
  if (!expanded) {
    return (
      <div 
        id="chat-interface"
        className="inline-flex flex-col items-start p-6 fixed"
        style={{
          bottom: '20px',
          right: '40px',
          borderRadius: '6px 6px 0px 0px',
          border: '1px solid var(--shadcn-ui-border, #e5e7eb)',
          boxShadow: '0px 4px 6px -4px rgba(0, 0, 0, 0.1), 0px 10px 15px -3px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(5px) brightness(100%)',
          WebkitBackdropFilter: 'blur(5px) brightness(100%)',
          background: 'linear-gradient(158deg, rgba(255,243,3,0.05) 0%, rgba(251,169,61,0.05) 15%, rgba(237,1,145,0.05) 30%, rgba(167,99,173,0.05) 45%, rgba(1,133,198,0.05) 60%, rgba(2,181,230,0.05) 75%, rgba(1,161,114,0.05) 90%, rgba(162,211,111,0.05) 100%)'
        }}
        onClick={() => onToggle()}
      >
        <div className="flex w-96 items-center gap-2 relative flex-[0_0_auto] bg-white rounded-md">
          <div 
            className="flex w-[388px] items-center gap-2 pl-3 pr-14 py-2 relative self-stretch rounded-md border-none"
            style={{
              marginTop: '-2px',
              marginBottom: '-2px',
              marginLeft: '-2px',
              marginRight: '-2px',
            }}
          >
            {/* Gradient border using before pseudo-element */}
            <div className="absolute inset-0 p-0.5 rounded-md pointer-events-none z-[1]"
              style={{
                background: 'linear-gradient(152deg, rgba(255,243,3,1) 0%, rgba(251,169,61,1) 15%, rgba(237,1,145,1) 30%, rgba(167,99,173,1) 45%, rgba(1,133,198,1) 60%, rgba(2,181,230,1) 75%, rgba(1,161,114,1) 90%, rgba(162,211,111,1) 100%)',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
              }}
            />
            <OscarIcon className="relative w-5 h-5" />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask Oskar about your profile"
              className="relative w-fit font-['Inter',Helvetica] font-normal text-[#6b7280] text-sm tracking-[0] leading-6 whitespace-nowrap bg-transparent focus:outline-none flex-1"
            />
          </div>
        </div>
      </div>
    );
  }

  // Expanded state
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
                onClick={handleSendMessage}
                disabled={isLoading}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}