'use client';

import React from 'react';
import { HelpCircle, X } from 'lucide-react';

interface VoiceCommandHelpProps {
  isOpen: boolean;
  onClose: () => void;
  questionType?: string;
}

export function VoiceCommandHelp({ 
  isOpen, 
  onClose,
  questionType = 'general' 
}: VoiceCommandHelpProps) {
  if (!isOpen) return null;

  const getQuestionSpecificHelp = () => {
    switch (questionType) {
      case 'seesaw':
        return (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Answering Seesaw Questions:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• "Strongly left" or "Two-zero" → Strong preference for left statement</li>
              <li>• "Slightly left" or "Two-one" → Slight preference for left statement</li>
              <li>• "Slightly right" or "One-two" → Slight preference for right statement</li>
              <li>• "Strongly right" or "Zero-two" → Strong preference for right statement</li>
            </ul>
          </div>
        );
      
      case 'yesno':
        return (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Answering Yes/No Questions:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Say "Yes", "Yep", or "Correct" for affirmative</li>
              <li>• Say "No", "Nope", or "Negative" for negative</li>
            </ul>
          </div>
        );
      
      case 'multiple':
        return (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Answering Multiple Choice:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Say the letter: "A", "B", "C", or "D"</li>
              <li>• Or say "Select A" or "Choose B"</li>
            </ul>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Voice Commands</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="space-y-6">
          {/* Question-specific help */}
          {getQuestionSpecificHelp()}
          
          {/* Navigation commands */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Navigation Commands:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• "Next question" or "Continue" → Go to next question</li>
              <li>• "Previous question" or "Go back" → Return to previous question</li>
              <li>• "Skip this question" → Skip current question</li>
              <li>• "Go to question 5" → Jump to specific question number</li>
            </ul>
          </div>
          
          {/* General commands */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">General Commands:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• "Repeat question" → Hear the question again</li>
              <li>• "Pause assessment" → Pause the voice session</li>
              <li>• "Save progress" → Save your current answers</li>
              <li>• "Help" → Show this help menu</li>
              <li>• "Exit voice" → Return to text mode</li>
            </ul>
          </div>
          
          {/* Tips */}
          <div className="bg-blue-50 rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-blue-900">Tips:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Speak clearly and naturally</li>
              <li>• Wait for the listening indicator before speaking</li>
              <li>• You can always type your answer if voice isn't working</li>
              <li>• Say "I don't understand" if you need clarification</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}