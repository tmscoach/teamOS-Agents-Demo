'use client';

import { X, ExternalLink } from 'lucide-react';
import { Oscar1 } from '@/app/chat/components/icons/Oscar1';
import { useChatContext } from './ChatProvider';
import { PluginRenderer } from './PluginRenderer';
import Link from 'next/link';

interface ChatHeaderProps {
  isExpanded: boolean;
  showExpandButton?: boolean;
}

export function ChatHeader({ isExpanded, showExpandButton = true }: ChatHeaderProps) {
  const { context, onClose } = useChatContext();
  
  // Get agent display name
  const getAgentDisplayName = () => {
    switch (context.agent) {
      case 'OrchestratorAgent':
        return 'Osmo';
      case 'AssessmentAgent':
        return 'Assessment Guide';
      case 'DebriefAgent':
        return 'Debrief Analyst';
      case 'OnboardingAgent':
        return 'Welcome Guide';
      default:
        return context.agent.replace('Agent', '');
    }
  };

  return (
    <div className="relative">
      {/* Logo */}
      <div className="absolute top-[23px] left-[19px]">
        <img
          className="w-[90px] h-[39px]"
          alt="teamOS"
          src="/img/teamos-logo.png"
        />
      </div>
      
      {/* Header actions */}
      {isExpanded && (
        <div className="absolute top-[23px] right-[19px] flex items-center gap-2">
          {/* Plugin header extensions */}
          <PluginRenderer type="header" />
          
          {/* Open in full chat (only in overlay mode) */}
          {context.position === 'overlay' && (
            <Link
              href={`/chat?agent=${context.agent}`}
              target="_blank"
              className="p-1.5 hover:bg-white/80 rounded-md transition-colors"
              title="Open in full chat"
            >
              <ExternalLink className="w-4 h-4 text-gray-600" />
            </Link>
          )}
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/80 rounded-md transition-colors"
            aria-label="Close chat"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      )}
      
      {/* Spacing to push content below logo */}
      <div className="h-[100px]" />
    </div>
  );
}