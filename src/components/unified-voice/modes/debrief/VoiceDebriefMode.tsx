'use client';

import React, { useEffect, useState } from 'react';
import { AgentToolBridge } from '../../bridges/AgentToolBridge';
import { useVoiceNavigation } from '@/app/chat/assessment/hooks/useVoiceNavigation';

interface VoiceDebriefModeProps {
  reportContext: {
    reportId: string;
    reportType: string;
    subscriptionId: string;
    userId: string;
  };
}

/**
 * Voice Debrief Mode
 * 
 * Handles voice interactions for report debrief sessions.
 * Loads DebriefAgent configuration and registers all its tools.
 */
export function VoiceDebriefMode({ reportContext }: VoiceDebriefModeProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tools, setTools] = useState<any[]>([]);
  
  const {
    voiceState,
    transcript,
    startVoice,
    stopVoice,
    setReportContext,
    setAgentTools,
  } = useVoiceNavigation();

  // Fetch agent tools configuration from API
  useEffect(() => {
    const fetchTools = async () => {
      try {
        console.log('[VoiceDebriefMode] Fetching agent tools...');
        
        const response = await fetch('/api/agents/debrief/tools');
        if (!response.ok) {
          throw new Error('Failed to fetch agent tools');
        }
        
        const { tools } = await response.json();
        setTools(tools);
        
        // Pass tools to voice service
        setAgentTools(tools);
        
        console.log('[VoiceDebriefMode] Agent tools loaded:', 
          tools.map((t: any) => t.name)
        );
        
        setIsLoading(false);
      } catch (err) {
        console.error('[VoiceDebriefMode] Failed to fetch tools:', err);
        setError(err instanceof Error ? err.message : 'Failed to load voice tools');
        setIsLoading(false);
      }
    };

    fetchTools();
  }, [setAgentTools]);

  // Set report context for the voice service
  useEffect(() => {
    console.log('[VoiceDebriefMode] Setting report context:', reportContext);
    setReportContext(reportContext);
  }, [reportContext, setReportContext]);

  const handleStartVoice = async () => {
    if (isLoading) {
      console.log('[VoiceDebriefMode] Still loading tools...');
      return;
    }
    
    if (tools.length === 0) {
      console.warn('[VoiceDebriefMode] No tools available, starting with limited functionality');
    }
    
    try {
      await startVoice();
    } catch (err) {
      console.error('[VoiceDebriefMode] Failed to start voice:', err);
      setError(err instanceof Error ? err.message : 'Failed to start voice');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-gray-500">Loading voice debrief mode...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Voice Report Debrief</h3>
        <p className="text-sm text-gray-600 mt-1">
          Discussing your {reportContext.reportType} assessment results
        </p>
      </div>

      <div className="flex justify-center">
        {voiceState === 'idle' ? (
          <button
            onClick={handleStartVoice}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Voice Session
          </button>
        ) : (
          <button
            onClick={stopVoice}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Stop Voice Session
          </button>
        )}
      </div>

      {voiceState !== 'idle' && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-700">
            <strong>Status:</strong> {voiceState}
          </div>
          {transcript && (
            <div className="mt-2 text-sm text-gray-600">
              <strong>Transcript:</strong> {transcript}
            </div>
          )}
        </div>
      )}
    </div>
  );
}