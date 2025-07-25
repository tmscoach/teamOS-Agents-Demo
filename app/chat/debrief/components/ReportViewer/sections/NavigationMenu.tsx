"use client";

import { Lightbulb } from 'lucide-react';

interface NavigationMenuProps {
  reportType: 'TMP' | 'QO2' | 'TeamSignals';
}

export default function NavigationMenu({ reportType }: NavigationMenuProps) {
  // Mock data for now - will be populated from parsed report
  const profileData = {
    TMP: {
      title: 'Creator-Innovator',
      subtitle: 'Strong intellectual curiosity.',
      description: `Creator-Innovators are highly creative, intellectually curious individuals who excel at developing innovative solutions through deep analysis and theoretical thinking. They prefer working independently to fully develop ideas before sharing them, are most energised by design and conceptual challenges rather than implementation, and may become resistant when pressured or when their core ideas are challenged. While they bring valuable innovation and thorough analytical thinking to teams, they often struggle with communication timing and may provide overly detailed explanations, making them ideal for advisory or strategic roles where they can leverage their strengths without the pressure of day-to-day operational management.`
    },
    QO2: {
      title: 'Strategic Leader',
      subtitle: 'Results-driven and analytical.',
      description: 'Strategic Leaders focus on long-term vision and organizational success...'
    },
    TeamSignals: {
      title: 'Collaborative Team',
      subtitle: 'High performance through trust.',
      description: 'This team demonstrates strong collaborative patterns...'
    }
  };

  const profile = profileData[reportType];

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
                {profile.title}
              </h4>
              <p className="text-sm font-medium text-gray-900">
                {profile.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="flex-1 pl-2.5 pt-2">
          <p className="text-base font-semibold text-gray-900 mb-3">
            You've matched the <span className="font-bold">{profile.title}</span> profile
          </p>
          <p className="text-sm text-gray-500 leading-5">
            {profile.description.split(/(\*\*.*?\*\*)/).map((part, index) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <span key={index} className="font-bold text-gray-700">{part.slice(2, -2)}</span>;
              }
              return part;
            })}
          </p>
        </div>
      </div>
    </div>
  );
}