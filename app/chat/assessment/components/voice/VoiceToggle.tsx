'use client';

import React from 'react';
import { Mic, MicOff } from 'lucide-react';
import { VoiceState } from '@/src/lib/services/voice';

interface VoiceToggleProps {
  voiceState: VoiceState;
  onToggle: () => void;
  audioLevel?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function VoiceToggle({ 
  voiceState, 
  onToggle, 
  audioLevel = 0,
  className = '',
  size = 'md'
}: VoiceToggleProps) {
  const isActive = ['listening', 'processing', 'speaking'].includes(voiceState);
  const isDisabled = ['connecting', 'error'].includes(voiceState);
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };
  
  const iconSize = {
    sm: 16,
    md: 20,
    lg: 24
  };

  // Calculate visual feedback based on audio level
  const scale = isActive ? 1 + (audioLevel * 0.2) : 1;
  const opacity = isActive ? 0.6 + (audioLevel * 0.4) : 1;

  return (
    <button
      onClick={onToggle}
      disabled={isDisabled}
      className={`
        ${sizeClasses[size]}
        relative rounded-full transition-all duration-200
        ${isActive 
          ? 'bg-red-500 hover:bg-red-600 text-white' 
          : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
        }
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      style={{
        transform: `scale(${scale})`,
      }}
      aria-label={isActive ? 'Stop voice input' : 'Start voice input'}
    >
      {/* Audio level indicator ring */}
      {isActive && audioLevel > 0 && (
        <div 
          className="absolute inset-0 rounded-full bg-red-400 animate-ping"
          style={{ 
            opacity: opacity * 0.3,
            animationDuration: `${1 - (audioLevel * 0.5)}s`
          }}
        />
      )}
      
      {/* Icon */}
      <div className="flex items-center justify-center w-full h-full">
        {isActive ? (
          <Mic size={iconSize[size]} />
        ) : (
          <MicOff size={iconSize[size]} />
        )}
      </div>
      
      {/* State indicator dot */}
      {voiceState === 'processing' && (
        <div className="absolute -top-1 -right-1 w-3 h-3">
          <div className="w-full h-full bg-yellow-400 rounded-full animate-pulse" />
        </div>
      )}
      
      {voiceState === 'speaking' && (
        <div className="absolute -top-1 -right-1 w-3 h-3">
          <div className="w-full h-full bg-green-400 rounded-full animate-pulse" />
        </div>
      )}
    </button>
  );
}