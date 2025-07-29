"use client";

import { RefObject } from 'react';
import OscarIcon from './OscarIcon';
import { ChevronRight } from 'lucide-react';

interface CollapsedChatProps {
  onToggle: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
}

export default function CollapsedChat({ onToggle, inputRef }: CollapsedChatProps) {
  return (
    <div 
      id="chat-interface"
      className="fixed bottom-6 right-6 z-50"
      onClick={onToggle}
    >
      <button
        className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-200 group backdrop-blur-sm"
        style={{
          background: 'linear-gradient(158deg, rgba(255,243,3,0.05) 0%, rgba(251,169,61,0.05) 15%, rgba(237,1,145,0.05) 30%, rgba(167,99,173,0.05) 45%, rgba(1,133,198,0.05) 60%, rgba(2,181,230,0.05) 75%, rgba(1,161,114,0.05) 90%, rgba(162,211,111,0.05) 100%)'
        }}
      >
        <div className="relative">
          <OscarIcon className="!w-6 !h-6" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </div>
        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
          Ask OSmos about your assessment
        </span>
        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
      </button>
    </div>
  );
}