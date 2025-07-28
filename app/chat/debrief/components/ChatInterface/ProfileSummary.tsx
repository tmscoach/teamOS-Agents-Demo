"use client";

import { User } from 'lucide-react';
import type { ProfileSummary as ProfileSummaryType } from '@/src/lib/utils/report-summary';

interface ProfileSummaryProps extends ProfileSummaryType {
  userName?: string;
}

export default function ProfileSummary({ title, role, bullets, userName }: ProfileSummaryProps) {
  return (
    <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white font-semibold text-sm">
            {userName?.charAt(0) || 'U'}
          </span>
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">
            {title}: {role}
          </h4>
          <ul className="mt-2 space-y-1">
            {bullets.map((bullet, index) => (
              <li key={index} className="text-sm text-gray-600 flex items-start">
                <span className="mr-2 text-purple-600">•</span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}