"use client";

import { User } from 'lucide-react';
import type { ProfileSummary as ProfileSummaryType } from '@/src/lib/utils/report-summary';

interface ProfileSummaryProps extends ProfileSummaryType {}

export default function ProfileSummary({ title, role, bullets }: ProfileSummaryProps) {
  return (
    <div className="mx-4 mt-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-gray-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900">
            {title}: <span className="text-gray-700">{role}</span>
          </h3>
          <ul className="mt-2 space-y-1">
            {bullets.map((bullet, index) => (
              <li key={index} className="text-xs text-gray-600 flex items-start">
                <span className="mr-2 mt-0.5">•</span>
                <span className="flex-1">{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}