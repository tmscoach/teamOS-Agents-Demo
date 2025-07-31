'use client';

import React from 'react';
import { Mic, X } from 'lucide-react';

interface VoicePermissionDialogProps {
  isOpen: boolean;
  onAllow: () => void;
  onDeny: () => void;
}

export function VoicePermissionDialog({ 
  isOpen, 
  onAllow, 
  onDeny 
}: VoicePermissionDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onDeny}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-md mx-4 space-y-4">
        {/* Close button */}
        <button
          onClick={onDeny}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>
        
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Mic className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        {/* Content */}
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">
            Enable Voice Assessment
          </h3>
          <p className="text-sm text-gray-600">
            OSmos would like to use your microphone for voice-based assessment. 
            This allows you to answer questions naturally by speaking instead of typing.
          </p>
        </div>
        
        {/* Features */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <p className="text-xs font-medium text-gray-700 uppercase tracking-wide">
            Voice features include:
          </p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Natural conversation with OSmos</li>
            <li>• Voice commands for navigation</li>
            <li>• Hands-free assessment completion</li>
            <li>• Real-time transcription</li>
          </ul>
        </div>
        
        {/* Privacy note */}
        <p className="text-xs text-gray-500 text-center">
          Your voice data is processed securely and not stored. 
          You can disable voice mode at any time.
        </p>
        
        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onDeny}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 
                     rounded-lg hover:bg-gray-200 transition-colors"
          >
            Not Now
          </button>
          <button
            onClick={onAllow}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 
                     rounded-lg hover:bg-blue-700 transition-colors"
          >
            Allow Microphone
          </button>
        </div>
      </div>
    </div>
  );
}