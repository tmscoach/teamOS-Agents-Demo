"use client";

import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';

interface NavigationMenuProps {
  assessmentType: string;
  currentPage: number;
  totalPages: number;
  completionPercentage: number;
}

export default function NavigationMenu({
  assessmentType,
  currentPage,
  totalPages,
  completionPercentage
}: NavigationMenuProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  
  const getPageStatus = (page: number) => {
    if (page < currentPage) return 'completed';
    if (page === currentPage) return 'current';
    return 'upcoming';
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">
        {assessmentType} Assessment
      </h2>
      
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Overall Progress</span>
          <span className="text-sm font-medium text-gray-900">{completionPercentage}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Pages</h3>
        {pages.map((page) => {
          const status = getPageStatus(page);
          
          return (
            <div
              key={page}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                status === 'current'
                  ? 'bg-blue-50 text-blue-700'
                  : status === 'completed'
                  ? 'text-gray-600'
                  : 'text-gray-400'
              }`}
            >
              {status === 'completed' ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <Circle
                  className={`w-5 h-5 ${
                    status === 'current' ? 'text-blue-600' : 'text-gray-300'
                  }`}
                />
              )}
              <span className={`text-sm ${status === 'current' ? 'font-medium' : ''}`}>
                Page {page}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Instructions</h3>
        <div className="text-sm text-gray-600 space-y-2">
          {assessmentType === 'TMP' && (
            <>
              <p>• Each page contains 5 seesaw questions</p>
              <p>• Choose the option that best represents your preference</p>
              <p>• 2-0 = Strongly prefer left</p>
              <p>• 2-1 = Somewhat prefer left</p>
              <p>• 1-2 = Somewhat prefer right</p>
              <p>• 0-2 = Strongly prefer right</p>
            </>
          )}
          {assessmentType === 'QO2' && (
            <>
              <p>• Answer questions about your organizational practices</p>
              <p>• Be honest and reflective</p>
              <p>• Consider your actual behaviors, not ideal ones</p>
            </>
          )}
          {assessmentType === 'Team Signals' && (
            <>
              <p>• Rate your team's performance</p>
              <p>• Think about recent team interactions</p>
              <p>• Consider overall patterns, not isolated incidents</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}