"use client";

import { Book, Clapperboard } from 'lucide-react';

export default function Frame() {
  return (
    <div className="flex items-start gap-2.5 w-full max-w-[737px]">
      {/* Suggested Reading Card */}
      <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 pb-3">
          <div className="flex items-center justify-between mb-1.5">
            <h4 className="text-sm font-medium text-gray-700">Suggested reading</h4>
            <Book className="w-4 h-4 text-gray-600" />
          </div>
        </div>
        <div className="px-6 pb-6">
          <p className="text-lg font-bold text-gray-900">Creative Leadership</p>
        </div>
      </div>

      {/* Based on Goals Card */}
      <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 pb-3">
          <div className="flex items-center justify-between mb-1.5">
            <h4 className="text-sm font-medium text-gray-700">Based on your goals</h4>
            <Clapperboard className="w-4 h-4 text-gray-600" />
          </div>
        </div>
        <div className="px-6 pb-6">
          <p className="text-2xl text-gray-900">
            <span className="font-bold">2x </span>
            <span className="font-normal">Weekly challenges</span>
          </p>
        </div>
      </div>
    </div>
  );
}