'use client';

import { useState, useEffect } from 'react';

interface VoicePreferences {
  autoEnableVoice: boolean;
  voiceVolume: number;
  preferredVoice: string;
  audioFeedback: boolean;
}

const DEFAULT_PREFERENCES: VoicePreferences = {
  autoEnableVoice: false,
  voiceVolume: 1.0,
  preferredVoice: 'alloy',
  audioFeedback: true
};

const STORAGE_KEY = 'tms-voice-preferences';

export function useVoicePreferences() {
  const [preferences, setPreferences] = useState<VoicePreferences>(DEFAULT_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load voice preferences:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save preferences to localStorage
  const updatePreferences = (updates: Partial<VoicePreferences>) => {
    const newPrefs = { ...preferences, ...updates };
    setPreferences(newPrefs);
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPrefs));
    } catch (error) {
      console.error('Failed to save voice preferences:', error);
    }
  };

  return {
    preferences,
    updatePreferences,
    isLoaded
  };
}