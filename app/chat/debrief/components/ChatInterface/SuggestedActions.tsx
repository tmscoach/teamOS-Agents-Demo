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
    <div className="flex flex-col gap-1.5 px-2">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => onActionClick(action.question)}
          className="flex items-center justify-between w-full px-3 py-2 text-left text-sm bg-white/60 hover:bg-white/80 border border-gray-200/50 rounded-lg transition-all group hover:shadow-sm"
        >
          <span className="text-gray-700 text-xs">{action.label}</span>
          <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </button>
      ))}
      {showMore && actions.length > 0 && (
        <button className="text-xs text-blue-600 hover:text-blue-700 mt-1 text-left px-3">
          Show more suggestions
        </button>
      )}
    </div>
  );
}