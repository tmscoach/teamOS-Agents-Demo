'use client';

import React from 'react';
import { VoiceCommand } from '@/src/lib/services/voice';

interface TranscriptDisplayProps {
  transcript: string;
  lastCommand?: VoiceCommand | null;
  isListening: boolean;
  className?: string;
}

export function TranscriptDisplay({ 
  transcript, 
  lastCommand,
  isListening,
  className = '' 
}: TranscriptDisplayProps) {
  if (!transcript && !lastCommand) return null;

  return (
    <div className={`
      bg-gray-50 rounded-lg p-4 space-y-2
      ${className}
    `}>
      {/* Live transcript */}
      {transcript && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {isListening ? 'You said:' : 'Last heard:'}
          </div>
          <div className="text-sm text-gray-800">
            "{transcript}"
          </div>
        </div>
      )}
      
      {/* Command interpretation */}
      {lastCommand && (
        <div className="space-y-1 pt-2 border-t border-gray-200">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Understood as:
          </div>
          <div className="text-sm">
            {lastCommand.type === 'navigation' && (
              <span className="text-blue-600">
                Navigate: {lastCommand.parameters?.target}
              </span>
            )}
            {lastCommand.type === 'answer' && (
              <span className="text-green-600">
                Answer: {formatAnswer(lastCommand.parameters?.value)}
              </span>
            )}
            {lastCommand.type === 'action' && (
              <span className="text-purple-600">
                Action: {lastCommand.parameters?.target}
              </span>
            )}
            {lastCommand.type === 'unknown' && (
              <span className="text-gray-500">
                Not understood - try saying "help" for commands
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatAnswer(value?: string): string {
  if (!value) return 'Unknown';
  
  // Format seesaw answers
  const seesawMap: Record<string, string> = {
    '20': '2-0 (Strongly left)',
    '21': '2-1 (Slightly left)',
    '12': '1-2 (Slightly right)',
    '02': '0-2 (Strongly right)',
  };
  
  return seesawMap[value] || value;
}