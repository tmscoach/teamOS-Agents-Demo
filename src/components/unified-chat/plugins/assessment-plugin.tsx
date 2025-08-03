import React, { useState, useEffect } from 'react';
import { ChatPlugin } from '../types';
import { VoiceModeEntry } from '@/app/chat/assessment/components/voice/VoiceModeEntry';
import { useChatContext } from '../components/ChatProvider';

// Voice invitation component
const VoiceInvitation = () => {
  const { chat } = useChatContext();
  const [hasShownVoiceEntry, setHasShownVoiceEntry] = useState(false);
  
  // Show after first message
  const shouldShow = chat.messages.length > 0 && !hasShownVoiceEntry;
  
  if (!shouldShow) return null;
  
  return (
    <div className="px-4 pt-4">
      <VoiceModeEntry
        onStartVoice={() => {
          // TODO: Start voice mode
          setHasShownVoiceEntry(true);
        }}
        onDismiss={() => setHasShownVoiceEntry(true)}
        hasShownBefore={hasShownVoiceEntry}
      />
    </div>
  );
};

// Assessment Plugin - handles assessment workflows, questions, and voice navigation
export const AssessmentPlugin: ChatPlugin = {
  name: 'assessment',
  version: '1.0.0',
  
  config: {
    compatibleModes: ['assessment'],
    requiredFeatures: ['workflow', 'voice']
  },
  
  components: {
    // Voice invitation appears at the top of messages
    messageHeader: VoiceInvitation,
    // Will be implemented when migrating AssessmentChatClient
    // messageRenderer: AssessmentQuestionRenderer,
    // sidePanel: AssessmentProgressPanel,
    // inputExtensions: AssessmentBulkCommands
  },
  
  handlers: {
    onMessage: async (message, context) => {
      // Will handle assessment-specific messages
      // - Answer updates
      // - Navigation commands
      // - Bulk operations
      return { handled: false };
    },
    
    onStateChange: (state, context) => {
      // Will track workflow state
      // - Current question
      // - Answers provided
      // - Completion status
    }
  },
  
  tools: [
    // Will include assessment-specific tools
    // - answersUpdateTool
    // - saveAssessmentTool
    // - navigateQuestionTool
  ]
};