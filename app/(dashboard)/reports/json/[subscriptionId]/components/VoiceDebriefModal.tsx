'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, Sparkles, X, Volume2 } from 'lucide-react';
import { useVoiceNavigation } from '@/app/chat/assessment/hooks/useVoiceNavigation';
import { VoicePermissionDialog } from '@/app/chat/assessment/components/voice/VoicePermissionDialog';
import { VoiceToggle } from '@/app/chat/assessment/components/voice/VoiceToggle';
import { TranscriptDisplay } from '@/app/chat/assessment/components/voice/TranscriptDisplay';
import { toast } from 'sonner';

interface VoiceDebriefModalProps {
  reportId: string;
  reportType: string;
  subscriptionId: string;
  userId: string;
}

export function VoiceDebriefModal({ reportId, reportType, subscriptionId, userId }: VoiceDebriefModalProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [showPermission, setShowPermission] = useState(false);
  const [voiceModeActive, setVoiceModeActive] = useState(false);
  const [isInitializingTools, setIsInitializingTools] = useState(false);
  
  const {
    voiceState,
    transcript,
    lastCommand,
    audioLevel,
    startVoice,
    stopVoice,
    setReportContext,
    setAgentTools,
  } = useVoiceNavigation();
  
  // Fetch agent tools configuration from API
  useEffect(() => {
    const fetchAgentTools = async () => {
      try {
        console.log('[VoiceDebriefModal] Fetching agent tools configuration...');
        setIsInitializingTools(true);
        
        // Fetch the tools configuration from an API endpoint
        const response = await fetch('/api/agents/debrief/tools');
        if (!response.ok) {
          throw new Error('Failed to fetch agent tools');
        }
        
        const { tools } = await response.json();
        
        // Pass the tools to the voice service
        console.log('[VoiceDebriefModal] Passing agent tools to voice service:', tools.map((t: any) => t.name));
        setAgentTools(tools);
        
        setIsInitializingTools(false);
      } catch (error) {
        console.error('[VoiceDebriefModal] Failed to fetch agent tools:', error);
        // Use empty tools array as fallback
        setAgentTools([]);
        setIsInitializingTools(false);
      }
    };

    fetchAgentTools();
  }, [setAgentTools]);
  
  // Set report context on mount
  useEffect(() => {
    console.log('[VoiceDebriefModal] Setting report context:', {
      reportId,
      reportType,
      subscriptionId,
      userId
    });
    setReportContext({
      reportId,
      reportType,
      subscriptionId,
      userId,
    });
  }, [reportId, reportType, subscriptionId, userId, setReportContext]);
  
  const handleStartVoice = async () => {
    console.log('[VoiceDebriefModal] Starting voice mode...');
    
    // Check if tools are still loading
    if (isInitializingTools) {
      toast.info('Please wait, initializing voice assistant...');
      return;
    }
    
    // Check permissions first
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error('Voice features are not supported in your browser');
      return;
    }
    
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      // Permission granted, start voice
      await startVoice();
      setVoiceModeActive(true);
      toast.success('Voice mode started! Start speaking...');
    } catch (err) {
      console.error('[VoiceDebriefModal] Permission error:', err);
      setShowPermission(true);
    }
  };
  
  const handleStopVoice = async () => {
    console.log('[VoiceDebriefModal] Stopping voice mode...');
    await stopVoice();
    setVoiceModeActive(false);
  };
  
  const handlePermissionAllow = async () => {
    setShowPermission(false);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await startVoice();
      setVoiceModeActive(true);
      toast.success('Voice mode started! Start speaking...');
    } catch (err) {
      toast.error('Failed to start voice mode');
    }
  };
  
  const handlePermissionDeny = () => {
    setShowPermission(false);
    toast.info('Voice features require microphone access');
  };
  
  if (!isOpen) return null;
  
  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
        
        {/* Modal Content */}
        <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 p-8">
          {/* Close button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
          
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Mic className="w-8 h-8 text-white" />
              <Sparkles className="w-4 h-4 text-yellow-300 absolute -mt-6 -mr-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Voice Report Debrief
              </h2>
              <p className="text-gray-600">
                Talk with OSmos about your {reportType} assessment results
              </p>
            </div>
          </div>
          
          {/* Info */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">
              What you can ask about:
            </h3>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Your major role and what it means for your work style</li>
              <li>• How your related roles complement your major role</li>
              <li>• Specific scores or sections you'd like explained</li>
              <li>• Practical applications for your team</li>
              <li>• Any concepts or terminology in the report</li>
            </ul>
          </div>
          
          {/* Debug Info */}
          <div className="bg-gray-100 rounded p-3 mb-6 text-xs font-mono">
            <div>Report ID: {reportId}</div>
            <div>Subscription: {subscriptionId}</div>
            <div>Type: {reportType}</div>
            <div>Voice State: {voiceState}</div>
          </div>
          
          {/* Voice Controls */}
          <div className="flex flex-col items-center gap-4">
            {!voiceModeActive ? (
              <button
                onClick={handleStartVoice}
                className="px-8 py-4 bg-blue-600 text-white font-semibold text-lg rounded-lg 
                         hover:bg-blue-700 transition-colors flex items-center gap-3"
              >
                <Mic size={24} />
                Start Voice Debrief
              </button>
            ) : (
              <div className="w-full space-y-4">
                {/* Voice Toggle */}
                <div className="flex justify-center">
                  <VoiceToggle
                    voiceState={voiceState}
                    onToggle={handleStopVoice}
                    audioLevel={audioLevel}
                    size="lg"
                  />
                </div>
                
                {/* Status */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <Volume2 className="animate-pulse" />
                    <span className="font-semibold">Voice Mode Active</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {voiceState === 'listening' ? 'Listening...' : 'Processing...'}
                  </p>
                </div>
                
                {/* Stop Button */}
                <button
                  onClick={handleStopVoice}
                  className="w-full px-6 py-3 bg-red-600 text-white font-semibold rounded-lg 
                           hover:bg-red-700 transition-colors"
                >
                  Stop Voice Mode
                </button>
              </div>
            )}
          </div>
          
          {/* Transcript Display */}
          {voiceModeActive && transcript && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Transcript:</h4>
              <div className="text-sm text-gray-600">{transcript}</div>
            </div>
          )}
        </div>
      </div>
      
      {/* Permission Dialog */}
      <VoicePermissionDialog
        isOpen={showPermission}
        onAllow={handlePermissionAllow}
        onDeny={handlePermissionDeny}
      />
    </>
  );
}