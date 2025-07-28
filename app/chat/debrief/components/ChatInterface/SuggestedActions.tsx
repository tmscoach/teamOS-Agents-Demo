"use client";

import { ChevronRight } from 'lucide-react';
import type { SuggestedAction } from '@/src/lib/utils/report-summary';

interface SuggestedActionsProps {
  actions: SuggestedAction[];
  onActionClick: (question: string) => void;
  showMore?: boolean;
}

export default function SuggestedActions({ 
  actions, 
  onActionClick,
  showMore = true 
}: SuggestedActionsProps) {
  return (
    <div className="flex flex-col gap-2 px-4 py-3">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => onActionClick(action.question)}
          className="flex items-center justify-between w-full px-3 py-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-md transition-colors group"
        >
          <span className="text-gray-700">{action.label}</span>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </button>
      ))}
      {showMore && actions.length > 0 && (
        <button className="text-sm text-blue-600 hover:text-blue-700 mt-1 text-left px-3">
          Show more suggestions
        </button>
      )}
    </div>
  );
}