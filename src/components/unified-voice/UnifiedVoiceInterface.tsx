'use client';

import React, { useState, useEffect } from 'react';
import { VoiceAssessmentMode } from './modes/assessment/VoiceAssessmentMode';
import { VoiceDebriefMode } from './modes/debrief/VoiceDebriefMode';

export type VoiceMode = 'assessment' | 'debrief';

interface UnifiedVoiceInterfaceProps {
  mode: VoiceMode;
  // Assessment mode props
  workflowState?: any;
  onAnswerUpdate?: (questionId: number, value: string) => void;
  onNavigateNext?: () => void;
  // Debrief mode props
  reportContext?: {
    reportId: string;
    reportType: string;
    subscriptionId: string;
    userId: string;
  };
}

/**
 * Unified Voice Interface
 * 
 * This component provides a single interface for all voice interactions,
 * routing to the appropriate mode (assessment or debrief) based on context.
 * 
 * Key features:
 * - Single configuration source (agent configs)
 * - Consistent tool bridging across modes
 * - Shared audio management
 * - Mode-specific optimizations
 */
export function UnifiedVoiceInterface({
  mode,
  workflowState,
  onAnswerUpdate,
  onNavigateNext,
  reportContext,
}: UnifiedVoiceInterfaceProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize the appropriate mode
    setIsInitialized(true);
  }, [mode]);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-sm text-gray-500">Initializing voice interface...</div>
      </div>
    );
  }

  // Route to the appropriate mode
  if (mode === 'assessment') {
    if (!workflowState) {
      throw new Error('Assessment mode requires workflowState');
    }
    
    return (
      <VoiceAssessmentMode
        workflowState={workflowState}
        onAnswerUpdate={onAnswerUpdate}
        onNavigateNext={onNavigateNext}
      />
    );
  }

  if (mode === 'debrief') {
    if (!reportContext) {
      throw new Error('Debrief mode requires reportContext');
    }
    
    return (
      <VoiceDebriefMode
        reportContext={reportContext}
      />
    );
  }

  throw new Error(`Unknown voice mode: ${mode}`);
}