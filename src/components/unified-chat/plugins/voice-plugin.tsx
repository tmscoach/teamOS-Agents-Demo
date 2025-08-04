import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatPlugin } from '../types';
import { VoiceToggle } from '@/app/chat/assessment/components/voice/VoiceToggle';
import { useVoiceNavigation } from '@/app/chat/assessment/hooks/useVoiceNavigation';
import { useVoiceSessionPrefetch } from '@/app/chat/assessment/hooks/useVoiceSessionPrefetch';
import { VoicePermissionDialog } from '@/app/chat/assessment/components/voice/VoicePermissionDialog';
import { VoiceCommandHelp } from '@/app/chat/assessment/components/voice/VoiceCommandHelp';
import { TranscriptDisplay } from '@/app/chat/assessment/components/voice/TranscriptDisplay';
import { VoiceModeEntry } from '@/app/chat/assessment/components/voice/VoiceModeEntry';
import { VoiceState, VoiceCommand } from '@/src/lib/services/voice';
import { useChatContext } from '../components/ChatProvider';
import { toast } from 'sonner';

// Voice banner component for the chat header
const VoiceBanner = () => {
  const { context } = useChatContext();
  const [hasShownVoiceEntry, setHasShownVoiceEntry] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('voiceEntryDismissed') === 'true';
    }
    return false;
  });
  const [showVoicePermission, setShowVoicePermission] = useState(false);
  
  const handleVoiceEntryDismiss = () => {
    setHasShownVoiceEntry(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('voiceEntryDismissed', 'true');
    }
  };
  
  const handleVoiceEntryStart = () => {
    setHasShownVoiceEntry(true);
    setShowVoicePermission(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('voiceEntryDismissed', 'true');
    }
  };
  
  const handleVoicePermissionAllow = async () => {
    setShowVoicePermission(false);
    // The actual voice start will be handled by the voice toggle
    toast.success('Voice features enabled! Click the microphone button to start.');
  };
  
  const handleVoicePermissionDeny = () => {
    setShowVoicePermission(false);
    toast.info('Voice features require microphone access');
  };
  
  // Only show for AssessmentAgent with an active assessment
  if (context.agent !== 'AssessmentAgent' || 
      !context.metadata?.selectedAssessment || 
      hasShownVoiceEntry) {
    return null;
  }
  
  return (
    <>
      <VoiceModeEntry
        onStartVoice={handleVoiceEntryStart}
        onDismiss={handleVoiceEntryDismiss}
      />
      
      <VoicePermissionDialog
        isOpen={showVoicePermission}
        onAllow={handleVoicePermissionAllow}
        onDeny={handleVoicePermissionDeny}
      />
    </>
  );
};

// Voice input component for the chat input area
const VoiceInputToggle = () => {
  console.log('[VoiceInputToggle] Rendering voice input toggle');
  const { chat, context } = useChatContext();
  const [voiceModeEnabled, setVoiceModeEnabled] = useState(false);
  const [showVoicePermission, setShowVoicePermission] = useState(false);
  const [isTogglingVoice, setIsTogglingVoice] = useState(false);
  
  // Prefetch voice session for faster startup
  const { sessionToken: prefetchedSessionToken } = useVoiceSessionPrefetch(
    context.agent === 'AssessmentAgent' && !!context.metadata?.selectedAssessment
  );
  
  // Create a ref to track if we should auto-start voice
  const shouldAutoStartVoice = useRef(false);
  
  // Handle voice commands
  const handleVoiceCommand = useCallback((command: VoiceCommand) => {
    console.log('[Voice] Command received:', command);
    
    // For assessment agent, dispatch assessment actions
    if (context.agent === 'AssessmentAgent') {
      if ((command.type as any) === 'answer_question' && (command as any).questionId && (command as any).value) {
        const event = new CustomEvent('assessment-action-detected', {
          detail: { 
            action: 'answer_question', 
            params: `${(command as any).questionId}:${(command as any).value}` 
          }
        });
        window.dispatchEvent(event);
      } else if ((command.type as any) === 'answer_multiple' && (command as any).questionIds && (command as any).value) {
        const event = new CustomEvent('assessment-action-detected', {
          detail: { 
            action: 'answer_multiple_questions', 
            params: `${(command as any).questionIds.join(',')}:${(command as any).value}` 
          }
        });
        window.dispatchEvent(event);
      } else if (command.type === 'navigation' && (command as any).direction === 'next') {
        const event = new CustomEvent('assessment-action-detected', {
          detail: { 
            action: 'navigate_page', 
            params: 'next' 
          }
        });
        window.dispatchEvent(event);
      }
    }
  }, [context.agent]);
  
  // Initialize voice navigation hook
  const {
    voiceState,
    transcript,
    lastCommand,
    audioLevel,
    startVoice,
    stopVoice,
    setWorkflowState,
    setAnswerUpdateCallback,
    setNavigateNextCallback
  } = useVoiceNavigation({
    onCommand: handleVoiceCommand,
    prefetchedSessionToken,
  });
  
  // Debug logging
  console.log('[VoiceInputToggle] Current state:', {
    voiceModeEnabled,
    voiceState,
    transcript,
    hasTranscript: !!transcript,
    transcriptLength: transcript?.length || 0
  });
  
  // Set up voice callbacks for assessment
  useEffect(() => {
    if (context.agent === 'AssessmentAgent' && context.metadata?.workflowState) {
      setWorkflowState(context.metadata.workflowState);
      
      // Set callbacks for voice to update the UI
      setAnswerUpdateCallback((questionId: number, value: string) => {
        const event = new CustomEvent('assessment-action-detected', {
          detail: { 
            action: 'answer_question', 
            params: `${questionId}:${value}` 
          }
        });
        window.dispatchEvent(event);
      });
      
      setNavigateNextCallback(() => {
        const event = new CustomEvent('assessment-action-detected', {
          detail: { 
            action: 'navigate_page', 
            params: 'next' 
          }
        });
        window.dispatchEvent(event);
      });
    }
  }, [context.agent, context.metadata?.workflowState, setWorkflowState, setAnswerUpdateCallback, setNavigateNextCallback]);
  
  const handleVoiceToggle = async () => {
    if (isTogglingVoice) {
      console.log('[VoiceToggle] Already toggling, ignoring...');
      return;
    }
    
    setIsTogglingVoice(true);
    console.log('[VoiceToggle] Current state:', { voiceModeEnabled, voiceState });
    
    try {
      if (voiceModeEnabled || voiceState !== 'idle') {
        // Stop voice mode
        await stopVoice();
        setVoiceModeEnabled(false);
        console.log('[VoiceToggle] Voice mode stopped');
      } else {
        // Check permissions first
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          toast.error('Voice features are not supported in your browser');
          return;
        }
        
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (err) {
          setShowVoicePermission(true);
          return;
        }
        
        // Make sure workflow state is set before starting voice
        if (context.agent === 'AssessmentAgent' && context.metadata?.workflowState) {
          console.log('[VoiceToggle] Setting workflow state before starting voice:', {
            questions: context.metadata.workflowState.questions?.length || 0,
            currentPageId: context.metadata.workflowState.currentPageId,
            assessmentType: context.metadata.assessmentType
          });
          setWorkflowState(context.metadata.workflowState);
          
          // Small delay to ensure state is set
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Start voice mode
        await startVoice();
        setVoiceModeEnabled(true);
        console.log('[VoiceToggle] Voice mode started');
      }
    } catch (error) {
      console.error('Failed to toggle voice mode:', error);
      toast.error('Failed to toggle voice mode');
      setVoiceModeEnabled(false);
    } finally {
      setIsTogglingVoice(false);
    }
  };
  
  const handleVoicePermissionAllow = async () => {
    setShowVoicePermission(false);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await handleVoiceToggle();
    } catch (err) {
      toast.error('Microphone access denied');
    }
  };
  
  const handleVoicePermissionDeny = () => {
    setShowVoicePermission(false);
    toast.info('Voice features require microphone access');
  };
  
  // Listen for external voice start requests (from VoiceModeEntry)
  useEffect(() => {
    const handleStartVoiceMode = (event: CustomEvent) => {
      console.log('[VoiceInputToggle] Received start-voice-mode event:', event.detail);
      if (event.detail?.type === 'assessment' && !voiceModeEnabled && !isTogglingVoice) {
        handleVoiceToggle();
      }
    };
    
    window.addEventListener('start-voice-mode', handleStartVoiceMode as EventListener);
    return () => {
      window.removeEventListener('start-voice-mode', handleStartVoiceMode as EventListener);
    };
  }, [voiceModeEnabled, isTogglingVoice]);
  
  return (
    <>
      <div className="voice-toggle-wrapper">
        <VoiceToggle
          voiceState={voiceState}
          onToggle={handleVoiceToggle}
          audioLevel={audioLevel}
          size="sm"
        />
      </div>
      
      {/* Voice permission dialog */}
      <VoicePermissionDialog
        isOpen={showVoicePermission}
        onAllow={handleVoicePermissionAllow}
        onDeny={handleVoicePermissionDeny}
      />
      
      {/* Voice transcript display */}
      {voiceModeEnabled && (
        <div className="fixed bottom-24 right-4 z-40 max-w-md">
          {transcript ? (
            <TranscriptDisplay
              transcript={transcript}
              lastCommand={lastCommand}
              isListening={voiceState === 'listening'}
            />
          ) : (
            voiceState === 'listening' && (
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-500">
                Listening...
              </div>
            )
          )}
        </div>
      )}
      
      {/* Voice help */}
      {voiceModeEnabled && (
        <div className="fixed bottom-4 left-4 z-40">
          <VoiceCommandHelp
            questionType={context.metadata?.assessmentType || 'TMP'}
            isOpen={true}
            onClose={() => {}}
          />
        </div>
      )}
    </>
  );
};

// Voice Plugin - provides voice input capabilities for accessibility
export const VoicePlugin: ChatPlugin = {
  name: 'voice',
  version: '1.0.0',
  
  config: {
    requiredFeatures: ['microphone', 'webrtc']
  },
  
  components: {
    header: VoiceBanner,
    inputExtensions: VoiceInputToggle,
  },
  
  handlers: {
    onStateChange: (state, context) => {
      // Handle state changes if needed
      console.log('[VoicePlugin] State changed:', state);
    }
  },
  
  tools: [
    // Voice-related tools if needed
    // - startVoiceSession
    // - stopVoiceSession
    // - processVoiceCommand
  ]
};