'use client';

import React from 'react';
import { Mic, Sparkles } from 'lucide-react';

interface VoiceModeEntryProps {
  onStartVoice: () => void;
  onDismiss: () => void;
  hasShownBefore?: boolean;
  mode?: 'assessment' | 'debrief';
}

export function VoiceModeEntry({ 
  onStartVoice, 
  onDismiss,
  hasShownBefore = false,
  mode = 'assessment'
}: VoiceModeEntryProps) {
  if (hasShownBefore) return null;

  const isDebrief = mode === 'debrief';
  
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6 
                    border border-blue-200 shadow-sm">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center">
            <div className="relative">
              <Mic className="w-6 h-6 text-blue-600" />
              <Sparkles className="w-3 h-3 text-purple-600 absolute -top-1 -right-1" />
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              {isDebrief ? 'Talk about your report with voice' : 'New! Complete this assessment using voice'}
              <span className="text-xs font-normal text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                BETA
              </span>
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {isDebrief 
                ? 'Ask OSmos questions about your assessment results. Get insights about your major role, strengths, and work preferences through natural conversation.'
                : 'Have a natural conversation with OSmos instead of typing. It\'s faster, more engaging, and completely hands-free.'}
            </p>
          </div>
          
          {/* Features */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-700">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <span>{isDebrief ? 'Ask about your major role' : 'Natural conversation'}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <span>{isDebrief ? 'Explore your strengths' : '30% faster completion'}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <span>{isDebrief ? 'Understand work preferences' : 'Voice commands'}</span>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={onStartVoice}
              className="px-4 py-2 bg-blue-600 text-white font-medium text-sm 
                       rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Mic size={16} />
              {isDebrief ? 'Start Voice Debrief' : 'Start Voice Assessment'}
            </button>
            <button
              onClick={onDismiss}
              className="px-4 py-2 text-gray-600 font-medium text-sm 
                       hover:text-gray-800 transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}