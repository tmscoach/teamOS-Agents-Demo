"use client";

import React, { useState } from "react";

interface SuggestedOptionsProps {
  options: string[];
  onSelect: (option: string | string[]) => void;
  multiSelect?: boolean;
  helpText?: string;
  fieldName?: string;
}

export default function SuggestedOptions({
  options,
  onSelect,
  multiSelect = false,
  helpText,
  fieldName
}: SuggestedOptionsProps) {
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);

  // Show first 6 options by default, with "Show more" if there are more
  const visibleOptions = showAll ? options : options.slice(0, 6);
  const hasMore = options.length > 6;

  const handleOptionClick = (option: string) => {
    if (multiSelect) {
      const newSelected = new Set(selectedOptions);
      if (newSelected.has(option)) {
        newSelected.delete(option);
      } else {
        newSelected.add(option);
      }
      setSelectedOptions(newSelected);
    } else {
      // Single select - send immediately
      onSelect(option);
    }
  };

  const handleSubmitMultiple = () => {
    if (selectedOptions.size > 0) {
      onSelect(Array.from(selectedOptions));
      setSelectedOptions(new Set());
    }
  };

  return (
    <div className="mt-4 p-4 bg-gradient-to-br from-blue-50/50 to-purple-50/50 rounded-lg border border-gray-200">
      {helpText && (
        <p className="text-sm text-gray-600 mb-3 flex items-start gap-2">
          <span className="text-blue-500 mt-0.5">💡</span>
          <span>{helpText}</span>
        </p>
      )}
      
      <p className="text-sm font-medium text-gray-700 mb-3">
        {multiSelect ? "Select all that apply:" : "Choose an option or type your own:"}
      </p>
      
      <div className="space-y-2">
        {visibleOptions.map((option, index) => (
          <button
            key={`${fieldName}-${index}`}
            onClick={() => handleOptionClick(option)}
            className={`
              w-full text-left px-4 py-3 rounded-lg border transition-all
              ${multiSelect && selectedOptions.has(option)
                ? "bg-blue-100 border-blue-300 text-blue-800"
                : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700"
              }
            `}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm">{option}</span>
              {multiSelect && (
                <div className={`
                  w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                  ${selectedOptions.has(option) 
                    ? "bg-blue-500 border-blue-500" 
                    : "border-gray-300"
                  }
                `}>
                  {selectedOptions.has(option) && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          Show more options
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}

      {multiSelect && selectedOptions.size > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {selectedOptions.size} option{selectedOptions.size !== 1 ? 's' : ''} selected
          </p>
          <button
            onClick={handleSubmitMultiple}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Submit Selection
          </button>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500 italic">
          💭 You can also type your own response if none of these fit perfectly
        </p>
      </div>
    </div>
  );
}