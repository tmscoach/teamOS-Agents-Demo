"use client";

import { Lightbulb } from 'lucide-react';

interface NavigationMenuProps {
  profile: {
    name: string;
    tagline: string;
    description: string;
    majorRole?: string;
    relatedRoles?: string[];
  };
  scores?: Record<string, number>;
}

export default function NavigationMenu({ profile, scores }: NavigationMenuProps) {

  return (
    <div className="flex flex-col w-full max-w-[737px] gap-2.5 p-6 bg-gray-50 rounded-md border border-gray-200 shadow-sm">
      <div className="flex items-start gap-3">
        {/* Profile Card with Gradient Background */}
        <div className="relative w-[188px] h-[270px] rounded-lg overflow-hidden">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400 opacity-80" />
          
          {/* Content */}
          <div className="absolute bottom-0 left-0 p-4">
            <Lightbulb className="w-7 h-7 text-gray-900 mb-5" />
            <div className="space-y-2">
              <h4 className="text-lg font-semibold text-gray-900">
                {profile.name}
              </h4>
              <p className="text-sm font-medium text-gray-900">
                {profile.tagline}
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="flex-1 pl-2.5 pt-2">
          <p className="text-base font-semibold text-gray-900 mb-3">
            You've matched the <span className="font-bold">{profile.name}</span> profile
          </p>
          <p className="text-sm text-gray-500 leading-5">
            {profile.description}
          </p>
          
          {/* Show scores if available */}
          {scores && Object.keys(scores).length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Net Scores:</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(scores).map(([dimension, score]) => (
                  <div key={dimension} className="flex justify-between text-sm">
                    <span className="text-gray-600">{dimension}:</span>
                    <span className="font-medium text-gray-900">{score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}