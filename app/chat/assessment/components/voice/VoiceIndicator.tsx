'use client';

import React from 'react';
import { Mic, Volume2, Loader2 } from 'lucide-react';
import { VoiceState } from '@/src/lib/services/voice';

interface VoiceIndicatorProps {
  voiceState: VoiceState;
  transcript?: string;
  className?: string;
}

export function VoiceIndicator({ 
  voiceState, 
  transcript,
  className = '' 
}: VoiceIndicatorProps) {
  const getStateContent = () => {
    switch (voiceState) {
      case 'idle':
        return null;
      
      case 'connecting':
        return (
          <div className="flex items-center gap-2 text-gray-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Connecting to voice service...</span>
          </div>
        );
      
      case 'ready':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <div className="w-2 h-2 bg-green-600 rounded-full" />
            <span>Voice ready</span>
          </div>
        );
      
      case 'listening':
        return (
          <div className="flex items-center gap-2 text-red-600">
            <Mic className="w-4 h-4 animate-pulse" />
            <span>Listening...</span>
            {transcript && (
              <span className="text-gray-700 ml-2">"{transcript}"</span>
            )}
          </div>
        );
      
      case 'processing':
        return (
          <div className="flex items-center gap-2 text-yellow-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Processing...</span>
          </div>
        );
      
      case 'thinking':
        return (
          <div className="flex items-center gap-2 text-indigo-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>OSmos is thinking...</span>
          </div>
        );
      
      case 'speaking':
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <Volume2 className="w-4 h-4 animate-pulse" />
            <span>OSmos is speaking...</span>
          </div>
        );
      
      case 'error':
        return (
          <div className="flex items-center gap-2 text-red-600">
            <div className="w-2 h-2 bg-red-600 rounded-full" />
            <span>Voice error - please try again</span>
          </div>
        );
      
      case 'disconnected':
        return (
          <div className="flex items-center gap-2 text-gray-500">
            <div className="w-2 h-2 bg-gray-500 rounded-full" />
            <span>Voice disconnected</span>
          </div>
        );
      
      case 'reconnecting':
        return (
          <div className="flex items-center gap-2 text-orange-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Reconnecting...</span>
          </div>
        );
      
      default:
        return null;
    }
  };

  const content = getStateContent();
  
  if (!content) return null;

  return (
    <div className={`
      bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-2
      text-sm font-medium transition-all duration-200
      ${className}
    `}>
      {content}
    </div>
  );
}