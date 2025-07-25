"use client";

import { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import OscarIcon from './OscarIcon';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';

interface ChatInterfaceProps {
  agentName: string;
  reportType: string;
  visibleSection: string;
  expanded: boolean;
  onToggle: () => void;
}

export default function ChatInterface({ 
  agentName, 
  reportType, 
  visibleSection, 
  expanded, 
  onToggle 
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Calculate position and height
  const baseTop = 712;
  const expandedHeight = '60vh';
  const collapsedHeight = '80px';

  return (
    <div 
      className="fixed left-1/2 transform -translate-x-1/2 transition-all duration-300 ease-in-out"
      style={{
        top: expanded ? `calc(100vh - ${expandedHeight} - 20px)` : `${baseTop}px`,
        height: expanded ? expandedHeight : collapsedHeight,
        width: '400px',
        maxWidth: '90vw'
      }}
    >
      {/* Chat Container with Rainbow Gradient */}
      <div 
        className="h-full flex flex-col rounded-t-md border border-gray-200 shadow-lg overflow-hidden"
        style={{
          backdropFilter: 'blur(5px) brightness(100%)',
          WebkitBackdropFilter: 'blur(5px) brightness(100%)',
          background: `linear-gradient(158deg,
            rgba(255,243,3,0.05) 0%,
            rgba(251,169,61,0.05) 15%,
            rgba(237,1,145,0.05) 30%,
            rgba(167,99,173,0.05) 45%,
            rgba(1,133,198,0.05) 60%,
            rgba(2,181,230,0.05) 75%,
            rgba(1,161,114,0.05) 90%,
            rgba(162,211,111,0.05) 100%
          )`
        }}
      >
        {/* Header - Always Visible */}
        <div 
          className="p-6 cursor-pointer bg-white/80"
          onClick={onToggle}
        >
          <div className="flex items-center gap-2">
            <ChatInput
              value={input}
              onChange={setInput}
              onSubmit={() => {/* TODO: Implement */}}
              disabled={isLoading}
              placeholder="Ask Oskar about your profile"
              expanded={expanded}
            />
          </div>
        </div>

        {/* Messages Area - Only visible when expanded */}
        {expanded && (
          <>
            <div className="flex-1 overflow-y-auto bg-white/90">
              <ChatMessages messages={messages} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}