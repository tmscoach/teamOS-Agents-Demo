"use client";

import { List } from 'lucide-react';

interface DbMainCardProps {
  title: string;
  insights: string[];
}

export default function DbMainCard({ title, insights }: DbMainCardProps) {

  return (
    <div className="flex flex-col w-full max-w-[737px] bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <List className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Key Points for {title}s</h3>
        </div>
        {insights.length > 0 ? (
          <ul className="space-y-3">
            {insights.map((insight, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">•</span>
                <span className="text-sm text-gray-600 leading-relaxed">{insight}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No insights available yet.</p>
        )}
      </div>
    </div>
  );
}