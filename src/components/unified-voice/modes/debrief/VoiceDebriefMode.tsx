'use client';

import React, { useEffect, useRef, useState } from 'react';
import { DebriefAgent } from '@/src/lib/agents/implementations/debrief-agent';
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
  const agentRef = useRef<DebriefAgent | null>(null);
  const toolsRegisteredRef = useRef(false);
  
  const {
    voiceState,
    transcript,
    startVoice,
    stopVoice,
    setReportContext,
  } = useVoiceNavigation();

  // Initialize the agent and load its configuration
  useEffect(() => {
    const initializeAgent = async () => {
      try {
        console.log('[VoiceDebriefMode] Initializing DebriefAgent...');
        
        // Create and initialize the DebriefAgent
        const agent = new DebriefAgent();
        await agent.initialize(); // This loads config from database
        
        agentRef.current = agent;
        
        console.log('[VoiceDebriefMode] DebriefAgent initialized with tools:', 
          agent.tools.map((t: any) => t.name)
        );
        
        setIsLoading(false);
      } catch (err) {
        console.error('[VoiceDebriefMode] Failed to initialize agent:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize agent');
        setIsLoading(false);
      }
    };

    initializeAgent();
  }, []);

  // Set report context for the voice service
  useEffect(() => {
    console.log('[VoiceDebriefMode] Setting report context:', reportContext);
    setReportContext(reportContext);
  }, [reportContext, setReportContext]);

  // Register tools when voice starts
  useEffect(() => {
    if (voiceState === 'ready' && agentRef.current && !toolsRegisteredRef.current) {
      console.log('[VoiceDebriefMode] Registering agent tools for voice...');
      
      // Get the realtime connection from the voice service
      // This will be implemented when we refactor RealtimeConnection
      // For now, we'll need to pass tools differently
      
      toolsRegisteredRef.current = true;
    }
  }, [voiceState]);

  const handleStartVoice = async () => {
    if (!agentRef.current) {
      console.error('[VoiceDebriefMode] Cannot start voice - agent not initialized');
      return;
    }
    
    try {
      // The tools will be registered via the voice service
      // which will be updated to load them from the agent
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