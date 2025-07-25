"use client";

import { List } from 'lucide-react';

interface DbMainCardProps {
  reportType: 'TMP' | 'QO2' | 'TeamSignals';
}

export default function DbMainCard({ reportType }: DbMainCardProps) {
  // Mock data - will be populated from parsed report
  const insights = {
    TMP: {
      title: 'Key Points for Creator Innovators',
      points: [
        'Independent thinkers who need space to fully develop ideas before sharing',
        'Excel at innovation, design, and solving complex theoretical problems',
        'Strong analytical and conceptual thinking abilities',
        'May struggle with timing of communication and stakeholder management',
        'Benefit from advisory roles where they can leverage strengths without operational pressure',
        'Need clear boundaries and autonomy to perform at their best',
        'Can provide valuable strategic insights when given time to think deeply',
        'May resist sudden changes or pressure to conform to conventional approaches'
      ]
    },
    QO2: {
      title: 'Leadership Insights',
      points: [
        'Strategic thinking and long-term planning capabilities',
        'Strong results orientation with analytical approach',
        'Effective at setting and achieving organizational goals'
      ]
    },
    TeamSignals: {
      title: 'Team Dynamics',
      points: [
        'High trust levels enable effective collaboration',
        'Clear communication patterns support productivity',
        'Strong alignment on team goals and objectives'
      ]
    }
  };

  const data = insights[reportType];

  return (
    <div className="flex flex-col w-full max-w-[737px] bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <List className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">{data.title}</h3>
        </div>
        <ul className="space-y-3">
          {data.points.map((point, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-gray-400 mt-0.5">•</span>
              <span className="text-sm text-gray-600 leading-relaxed">{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}