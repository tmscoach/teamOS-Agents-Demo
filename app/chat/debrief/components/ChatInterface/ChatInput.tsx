"use client";

import { Send } from 'lucide-react';
import OscarIcon from './OscarIcon';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  placeholder: string;
  expanded: boolean;
}

export default function ChatInput({ 
  value, 
  onChange, 
  onSubmit, 
  disabled, 
  placeholder,
  expanded 
}: ChatInputProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !disabled) {
      onSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div 
        className="relative flex items-center gap-2 w-full bg-white rounded-md"
        style={{
          // Container for gradient border effect
          padding: '2px'
        }}
      >
        {/* Gradient Border */}
        <div 
          className="absolute inset-0 rounded-md pointer-events-none"
          style={{
            background: `linear-gradient(152deg,
              rgba(255,243,3,1) 0%,
              rgba(251,169,61,1) 15%,
              rgba(237,1,145,1) 30%,
              rgba(167,99,173,1) 45%,
              rgba(1,133,198,1) 60%,
              rgba(2,181,230,1) 75%,
              rgba(1,161,114,1) 90%,
              rgba(162,211,111,1) 100%
            )`,
            // Mask technique for hollow border
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            padding: '2px'
          }}
        />
        
        {/* Input Content */}
        <div className="relative flex items-center gap-2 w-full bg-white rounded-md px-3 py-2">
          <OscarIcon />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 text-sm text-gray-600 placeholder:text-gray-400 focus:outline-none bg-transparent"
          />
          {expanded && value.trim() && (
            <button
              type="submit"
              disabled={disabled}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </form>
  );
}