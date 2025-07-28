"use client";

import { User } from 'lucide-react';
import type { ProfileSummary as ProfileSummaryType } from '@/src/lib/utils/report-summary';

interface ProfileSummaryProps extends ProfileSummaryType {
  userName?: string;
}

export default function ProfileSummary({ title, role, bullets, userName }: ProfileSummaryProps) {
  return (
    <div className="p-3 bg-white/80 rounded-lg border border-gray-200/50 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white font-semibold text-xs">
            {userName?.charAt(0)?.toUpperCase() || 'U'}
          </span>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-gray-900">
            {role}
          </h4>
          <ul className="mt-1 space-y-0.5">
            {bullets.slice(0, 3).map((bullet, index) => (
              <li key={index} className="text-xs text-gray-600 flex items-start">
                <span className="mr-1.5 text-purple-500">•</span>
                <span className="line-clamp-1">{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}