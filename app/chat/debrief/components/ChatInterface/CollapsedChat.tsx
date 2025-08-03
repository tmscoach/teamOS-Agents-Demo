"use client";

import { useState, useEffect, RefObject } from 'react';
import OscarIcon from './OscarIcon';

interface CollapsedChatProps {
  onToggle: () => void;
  onSendMessage: (input: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
}

export default function CollapsedChat({ onToggle, onSendMessage, inputRef }: CollapsedChatProps) {
  const [input, setInput] = useState('');

  // Auto-expand when user starts typing
  useEffect(() => {
    if (input) {
      onToggle();
    }
  }, [input, onToggle]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        onSendMessage(input.trim());
        setInput('');
      }
    }
  };

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
      onClick={onToggle}
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
            placeholder="Ask Osmo about your profile"
            className="relative w-fit font-['Inter',Helvetica] font-normal text-[#6b7280] text-sm tracking-[0] leading-6 whitespace-nowrap bg-transparent focus:outline-none flex-1"
          />
        </div>
      </div>
    </div>
  );
}