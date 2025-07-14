"use client";

import React from "react";
import { Plus } from "lucide-react";

interface SuggestedValuesProps {
  field: string;
  values: string[];
  helpText?: string;
  onSelect: (value: string) => void;
}

export default function SuggestedValues({
  field,
  values,
  helpText,
  onSelect
}: SuggestedValuesProps) {
  return (
    <div className="mt-4 border-t border-gray-200 pt-4">
      {helpText && (
        <p className="text-sm text-gray-500 mb-3 flex items-start gap-2">
          <span className="text-blue-500 mt-0.5">💡</span>
          <span>{helpText}</span>
        </p>
      )}
      
      <div className="space-y-1">
        {values.map((value, index) => (
          <button
            key={`${field}-${index}-${value}`}
            onClick={() => onSelect(value)}
            className="w-full flex items-center justify-between px-2 py-3 text-left transition-colors hover:bg-gray-50 border-b border-gray-100 last:border-b-0 group"
          >
            <span className="text-sm text-gray-700 group-hover:text-gray-900">
              {value}
            </span>
            <Plus className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
          </button>
        ))}
      </div>
      
      <p className="text-xs text-gray-400 mt-3 italic">
        💭 You can also type your own response if none of these fit
      </p>
    </div>
  );
}