'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  VoiceNavigationService, 
  VoiceConfig, 
  VoiceState, 
  VoiceCommand,
  VoiceSession 
} from '@/src/lib/services/voice';

export interface UseVoiceNavigationOptions {
  onCommand?: (command: VoiceCommand) => void;
  onTranscript?: (transcript: string) => void;
  onError?: (error: Error) => void;
  apiKey?: string;
}

export interface UseVoiceNavigationReturn {
  // State
  isListening: boolean;
  voiceState: VoiceState;
  transcript: string;
  lastCommand: VoiceCommand | null;
  audioLevel: number;
  session: VoiceSession | null;
  
  // Actions
  startVoice: () => Promise<void>;
  stopVoice: () => Promise<void>;
  pauseVoice: () => Promise<void>;
  resumeVoice: () => Promise<void>;
  sendTextCommand: (text: string) => Promise<void>;
  
  // Helpers
  getContextualHelp: (questionType: string) => string[];
}

export function useVoiceNavigation(
  options: UseVoiceNavigationOptions = {}
): UseVoiceNavigationReturn {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [lastCommand, setLastCommand] = useState<VoiceCommand | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [session, setSession] = useState<VoiceSession | null>(null);
  
  const voiceServiceRef = useRef<VoiceNavigationService | null>(null);
  const audioLevelIntervalRef = useRef<number | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (audioLevelIntervalRef.current) {
        clearInterval(audioLevelIntervalRef.current);
      }
      if (voiceServiceRef.current) {
        voiceServiceRef.current.stopSession().catch(console.error);
      }
    };
  }, []);

  const handleTranscript = useCallback((newTranscript: string) => {
    setTranscript(newTranscript);
    options.onTranscript?.(newTranscript);
  }, [options]);

  const handleCommand = useCallback((command: VoiceCommand) => {
    setLastCommand(command);
    options.onCommand?.(command);
  }, [options]);

  const handleStateChange = useCallback((state: VoiceState) => {
    setVoiceState(state);
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error('Voice navigation error:', error);
    options.onError?.(error);
    setVoiceState('error');
  }, [options]);

  const startVoice = useCallback(async () => {
    try {
      // Create voice service if it doesn't exist
      if (!voiceServiceRef.current) {
        const config: VoiceConfig = {
          apiKey: options.apiKey,
          onTranscript: handleTranscript,
          onCommand: handleCommand,
          onStateChange: handleStateChange,
          onError: handleError,
        };
        
        voiceServiceRef.current = new VoiceNavigationService(config);
      }

      // Start the session
      await voiceServiceRef.current.startSession();
      
      // Update session
      setSession(voiceServiceRef.current.getCurrentSession());
      
      // Start monitoring audio levels
      audioLevelIntervalRef.current = window.setInterval(() => {
        if (voiceServiceRef.current) {
          setAudioLevel(voiceServiceRef.current.getAudioLevel());
        }
      }, 100);
    } catch (error) {
      handleError(error as Error);
    }
  }, [options.apiKey, handleTranscript, handleCommand, handleStateChange, handleError]);

  const stopVoice = useCallback(async () => {
    if (!voiceServiceRef.current) return;
    
    try {
      await voiceServiceRef.current.stopSession();
      
      // Clear audio level monitoring
      if (audioLevelIntervalRef.current) {
        clearInterval(audioLevelIntervalRef.current);
        audioLevelIntervalRef.current = null;
      }
      
      // Reset state
      setAudioLevel(0);
      setTranscript('');
      setLastCommand(null);
      setSession(null);
    } catch (error) {
      handleError(error as Error);
    }
  }, [handleError]);

  const pauseVoice = useCallback(async () => {
    if (!voiceServiceRef.current) return;
    
    try {
      await voiceServiceRef.current.pauseListening();
    } catch (error) {
      handleError(error as Error);
    }
  }, [handleError]);

  const resumeVoice = useCallback(async () => {
    if (!voiceServiceRef.current) return;
    
    try {
      await voiceServiceRef.current.resumeListening();
    } catch (error) {
      handleError(error as Error);
    }
  }, [handleError]);

  const sendTextCommand = useCallback(async (text: string) => {
    if (!voiceServiceRef.current) return;
    
    try {
      await voiceServiceRef.current.sendTextCommand(text);
    } catch (error) {
      handleError(error as Error);
    }
  }, [handleError]);

  const getContextualHelp = useCallback((questionType: string): string[] => {
    if (!voiceServiceRef.current) {
      return [];
    }
    return voiceServiceRef.current.getContextualHelp(questionType);
  }, []);

  return {
    // State
    isListening: voiceState === 'listening',
    voiceState,
    transcript,
    lastCommand,
    audioLevel,
    session,
    
    // Actions
    startVoice,
    stopVoice,
    pauseVoice,
    resumeVoice,
    sendTextCommand,
    
    // Helpers
    getContextualHelp,
  };
}