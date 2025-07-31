'use client';

import { useState, useEffect, useRef } from 'react';

interface SessionData {
  sessionToken: string;
  expiresAt: number;
}

export function useVoiceSessionPrefetch(enabled: boolean = true) {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const fetchingRef = useRef(false);

  const prefetchSession = async () => {
    if (fetchingRef.current || sessionData?.expiresAt && sessionData.expiresAt > Date.now()) {
      return sessionData;
    }

    fetchingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/voice/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prefetch: true,
          workflowState: null 
        })
      });

      if (!response.ok) {
        throw new Error('Failed to prefetch voice session');
      }

      const data = await response.json();
      const session = {
        sessionToken: data.sessionToken,
        expiresAt: Date.now() + (10 * 60 * 1000) // 10 minutes
      };
      
      setSessionData(session);
      console.log('[Voice Prefetch] Session pre-created successfully');
      return session;
    } catch (err) {
      const error = err as Error;
      console.error('[Voice Prefetch] Failed:', error);
      setError(error);
      return null;
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  };

  // Prefetch on mount if enabled
  useEffect(() => {
    if (enabled) {
      prefetchSession();
    }
  }, [enabled]);

  // Auto-refresh before expiry
  useEffect(() => {
    if (!sessionData || !enabled) return;

    const timeUntilExpiry = sessionData.expiresAt - Date.now();
    const refreshTime = Math.max(0, timeUntilExpiry - 60000); // Refresh 1 minute before expiry

    const timer = setTimeout(() => {
      console.log('[Voice Prefetch] Refreshing session token');
      prefetchSession();
    }, refreshTime);

    return () => clearTimeout(timer);
  }, [sessionData, enabled]);

  return {
    sessionToken: sessionData?.sessionToken || null,
    isLoading,
    error,
    prefetchSession
  };
}