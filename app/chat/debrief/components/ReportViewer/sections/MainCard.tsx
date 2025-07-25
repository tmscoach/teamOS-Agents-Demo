"use client";

import { Coins } from 'lucide-react';

export default function MainCard() {
  return (
    <div className="flex flex-col w-full max-w-[737px] bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Congratulations on completing your first profile!
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          This information can help you better understand your leadership styles.
        </p>
        <div className="inline-flex items-center gap-2.5 px-3 py-1.5 bg-gray-50 rounded-md border border-gray-200 shadow-sm">
          <Coins className="w-4 h-4 text-gray-600" />
          <p className="text-sm font-medium text-gray-600">
            You've earned +5000 credits and a new badge!
          </p>
        </div>
      </div>
    </div>
  );
}